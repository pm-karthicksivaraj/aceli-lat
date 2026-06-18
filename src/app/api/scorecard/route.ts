import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const lenderId = searchParams.get("lenderId");

    // Build where clause for lenders
    const lenderWhere: Record<string, unknown> = {};
    if (country) lenderWhere.country = country;
    if (lenderId) lenderWhere.id = lenderId;

    // Get all matching lenders
    const lenders = await db.lender.findMany({
      where: lenderWhere,
      orderBy: { updatedAt: "desc" },
    });

    // For each lender, get the latest scorecard snapshot
    const results = await Promise.all(
      lenders.map(async (lender) => {
        const latestSnapshot = await db.scorecardSnapshot.findFirst({
          where: { lenderId: lender.id },
          orderBy: { snapshotDate: "desc" },
        });

        if (!latestSnapshot) return null;

        return {
          ...latestSnapshot,
          institutionName: lender.institutionName,
        };
      })
    );

    // Filter out lenders with no snapshots
    const filtered = results.filter((r) => r !== null);

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching scorecards:", error);
    return NextResponse.json(
      { error: "Failed to fetch scorecards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lenderId, performedBy } = body as {
      lenderId: string;
      performedBy: string;
    };

    if (!lenderId || !performedBy) {
      return NextResponse.json(
        { error: "lenderId and performedBy are required" },
        { status: 400 }
      );
    }

    // Fetch the lender with meetings and extractions
    const lender = await db.lender.findUnique({
      where: { id: lenderId },
      include: {
        meetings: {
          include: {
            extractions: true,
          },
        },
      },
    });

    if (!lender) {
      return NextResponse.json(
        { error: "Lender not found" },
        { status: 404 }
      );
    }

    // Collect approved extraction IDs and count review statuses
    const approvedExtractionIds: string[] = [];
    let reviewedByCount = 0;
    let pendingCount = 0;

    for (const meeting of lender.meetings) {
      for (const extraction of meeting.extractions) {
        if (extraction.reviewStatus === "Approved") {
          approvedExtractionIds.push(extraction.id);
        }
        if (
          extraction.reviewStatus === "Approved" ||
          extraction.reviewStatus === "Rejected" ||
          extraction.reviewStatus === "Escalated" ||
          extraction.reviewStatus === "FollowUp"
        ) {
          reviewedByCount++;
        }
        if (extraction.reviewStatus === "Pending") {
          pendingCount++;
        }
      }
    }

    // Compute overall score = average of 6 scores
    const scores = [
      lender.commitmentScore,
      lender.productScore,
      lender.operationalScore,
      lender.riskScore,
      lender.relationshipScore,
      lender.marketScore,
    ];
    const overallScore = scores.reduce((sum, s) => sum + s, 0) / 6;

    // Create the scorecard snapshot
    const snapshot = await db.scorecardSnapshot.create({
      data: {
        lenderId,
        commitmentScore: lender.commitmentScore,
        productScore: lender.productScore,
        operationalScore: lender.operationalScore,
        riskScore: lender.riskScore,
        relationshipScore: lender.relationshipScore,
        marketScore: lender.marketScore,
        overallScore: Math.round(overallScore * 100) / 100,
        sourceExtractionIds: JSON.stringify(approvedExtractionIds),
        reviewedByCount,
        pendingCount,
        country: lender.country,
      },
    });

    // Get previous audit log hash for chain integrity
    const lastAuditLog = await db.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { hash: true },
    });

    // Create audit log entry for scorecard generation
    const auditDetails = JSON.stringify({
      lenderId,
      institutionName: lender.institutionName,
      overallScore: Math.round(overallScore * 100) / 100,
      extractionCount: approvedExtractionIds.length,
      reviewedByCount,
      pendingCount,
    });

    const auditHash = createHash("sha256")
      .update(
        `ScorecardSnapshot:${snapshot.id}:${performedBy}:${auditDetails}:${Date.now()}`
      )
      .digest("hex");

    await db.auditLog.create({
      data: {
        entityType: "ScorecardSnapshot",
        entityId: snapshot.id,
        action: "Create",
        performedBy,
        details: auditDetails,
        correlationId: lenderId,
        hash: auditHash,
        previousHash: lastAuditLog?.hash || null,
      },
    });

    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    console.error("Error generating scorecard:", error);
    return NextResponse.json(
      { error: "Failed to generate scorecard" },
      { status: 500 }
    );
  }
}
