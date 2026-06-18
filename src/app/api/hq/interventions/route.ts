import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { InterventionPriority } from "@/lib/types";

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function computePriorityLevel(
  overallScore: number,
  daysSinceContact: number | null,
  isAtRisk: boolean,
  pendingReviews: number
): { level: "critical" | "high" | "medium" | "low"; reasons: string[] } {
  const reasons: string[] = [];

  // Critical conditions
  if (overallScore < 30) {
    reasons.push("Score below 30");
  }
  if (daysSinceContact !== null && daysSinceContact > 60) {
    reasons.push("No contact in 60+ days");
  }
  if (isAtRisk) {
    reasons.push("At-Risk status");
  }

  if (overallScore < 30 || (daysSinceContact !== null && daysSinceContact > 60) || isAtRisk) {
    return { level: "critical", reasons };
  }

  // High conditions
  if (overallScore < 50) {
    reasons.push("Score below 50");
  }
  if (daysSinceContact !== null && daysSinceContact > 30) {
    reasons.push("No contact in 30+ days");
  }

  if (overallScore < 50 || (daysSinceContact !== null && daysSinceContact > 30)) {
    return { level: "high", reasons };
  }

  // Medium conditions
  if (pendingReviews > 3) {
    reasons.push("More than 3 pending reviews");
  }

  if (overallScore < 65 || pendingReviews > 3) {
    if (overallScore < 65 && reasons.length === 0) {
      reasons.push("Score below 65");
    }
    return { level: "medium", reasons };
  }

  return { level: "low", reasons: ["No critical issues identified"] };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const countryFilter = searchParams.get("country");
    const priorityLevelFilter = searchParams.get("priorityLevel");

    // 1. Fetch all lenders (with optional country filter)
    const lenderWhere: Record<string, unknown> = {};
    if (countryFilter) {
      lenderWhere.country = countryFilter;
    }

    const lenders = await db.lender.findMany({
      where: lenderWhere,
      select: {
        id: true,
        institutionName: true,
        country: true,
        relationshipStatus: true,
        commitmentScore: true,
        productScore: true,
        operationalScore: true,
        riskScore: true,
        relationshipScore: true,
        marketScore: true,
        lastContactDate: true,
      },
    });

    // 2. Build meeting -> lender mapping
    const lenderIds = lenders.map((l) => l.id);

    const meetings = await db.meeting.findMany({
      where: { lenderId: { in: lenderIds } },
      select: { id: true, lenderId: true },
    });

    const meetingIds = meetings.map((m) => m.id);
    const meetingLenderMap: Record<string, string> = {};
    for (const m of meetings) {
      meetingLenderMap[m.id] = m.lenderId;
    }

    // 3. Pending extractions count per lender
    const pendingExtractions = await db.extraction.findMany({
      where: {
        meetingId: { in: meetingIds },
        reviewStatus: "Pending",
      },
      select: { meetingId: true },
    });

    const pendingReviewsByLender: Record<string, number> = {};
    for (const e of pendingExtractions) {
      const lenderId = meetingLenderMap[e.meetingId];
      if (lenderId) {
        pendingReviewsByLender[lenderId] = (pendingReviewsByLender[lenderId] || 0) + 1;
      }
    }

    // 4. Open exceptions count per lender
    const openExceptions = await db.exceptionQueue.findMany({
      where: {
        lenderId: { in: lenderIds },
        status: "Open",
      },
      select: { lenderId: true },
    });

    const openExceptionsByLender: Record<string, number> = {};
    for (const e of openExceptions) {
      if (e.lenderId) {
        openExceptionsByLender[e.lenderId] = (openExceptionsByLender[e.lenderId] || 0) + 1;
      }
    }

    // 5. Build intervention priority objects
    const now = new Date();
    const results: InterventionPriority[] = lenders.map((lender) => {
      const overallScore =
        Math.round(
          ((lender.commitmentScore +
            lender.productScore +
            lender.operationalScore +
            lender.riskScore +
            lender.relationshipScore +
            lender.marketScore) /
            6) *
            100
        ) / 100;

      const daysSinceContact = lender.lastContactDate
        ? Math.floor(
            (now.getTime() - new Date(lender.lastContactDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      const pendingReviews = pendingReviewsByLender[lender.id] || 0;
      const openExceptionsCount = openExceptionsByLender[lender.id] || 0;
      const isAtRisk = lender.relationshipStatus === "At-Risk";

      const { level, reasons } = computePriorityLevel(
        overallScore,
        daysSinceContact,
        isAtRisk,
        pendingReviews
      );

      return {
        lenderId: lender.id,
        institutionName: lender.institutionName,
        country: lender.country,
        relationshipStatus: lender.relationshipStatus,
        overallScore,
        daysSinceContact,
        pendingReviews,
        openExceptions: openExceptionsCount,
        priorityLevel: level,
        priorityReasons: reasons,
      };
    });

    // 6. Filter by priorityLevel if specified
    const filtered = priorityLevelFilter
      ? results.filter((r) => r.priorityLevel === priorityLevelFilter)
      : results;

    // 7. Sort by priority level (critical first), then overallScore ascending
    filtered.sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[a.priorityLevel] - PRIORITY_ORDER[b.priorityLevel];
      if (priorityDiff !== 0) return priorityDiff;
      return a.overallScore - b.overallScore;
    });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching HQ interventions:", error);
    return NextResponse.json(
      { error: "Failed to fetch interventions" },
      { status: 500 }
    );
  }
}
