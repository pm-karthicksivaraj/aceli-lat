import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const exports = await db.benchmarkingExport.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(exports);
  } catch (error) {
    console.error("Error fetching benchmarking exports:", error);
    return NextResponse.json(
      { error: "Failed to fetch benchmarking exports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { country, format, triggeredBy } = body as {
      country?: string;
      format: "JSON" | "CSV";
      triggeredBy: string;
    };

    if (!format || !triggeredBy) {
      return NextResponse.json(
        { error: "format and triggeredBy are required" },
        { status: 400 }
      );
    }

    if (format !== "JSON" && format !== "CSV") {
      return NextResponse.json(
        { error: "format must be 'JSON' or 'CSV'" },
        { status: 400 }
      );
    }

    // Build lender filter by country
    const lenderWhere: Record<string, unknown> = {};
    if (country) lenderWhere.country = country;

    // Fetch lenders with their meetings and extractions (for data quality gate)
    const lenders = await db.lender.findMany({
      where: lenderWhere,
      include: {
        meetings: {
          include: {
            extractions: true,
          },
        },
      },
      orderBy: { institutionName: "asc" },
    });

    // Filter: only include lenders with at least 1 approved extraction
    const qualifiedLenders = lenders.filter((lender) =>
      lender.meetings.some((meeting) =>
        meeting.extractions.some(
          (ext) => ext.reviewStatus === "Approved"
        )
      )
    );

    // Build the export data rows
    const exportRows = qualifiedLenders.map((lender) => ({
      institutionName: lender.institutionName,
      country: lender.country,
      commitmentScore: lender.commitmentScore,
      productScore: lender.productScore,
      operationalScore: lender.operationalScore,
      riskScore: lender.riskScore,
      relationshipScore: lender.relationshipScore,
      marketScore: lender.marketScore,
      relationshipStatus: lender.relationshipStatus,
      lastContactDate: lender.lastContactDate
        ? lender.lastContactDate.toISOString()
        : null,
    }));

    const recordCount = exportRows.length;

    // Generate the data string based on format
    let dataString: string;
    if (format === "JSON") {
      dataString = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          country: country || "All",
          recordCount,
          records: exportRows,
        },
        null,
        2
      );
    } else {
      // CSV format
      const headers = [
        "institutionName",
        "country",
        "commitmentScore",
        "productScore",
        "operationalScore",
        "riskScore",
        "relationshipScore",
        "marketScore",
        "relationshipStatus",
        "lastContactDate",
      ];
      const csvRows = [headers.join(",")];
      for (const row of exportRows) {
        csvRows.push(
          headers
            .map((h) => {
              const val = row[h as keyof typeof row];
              // Escape CSV values containing commas or quotes
              if (
                typeof val === "string" &&
                (val.includes(",") || val.includes('"'))
              ) {
                return `"${val.replace(/"/g, '""')}"`;
              }
              return String(val ?? "");
            })
            .join(",")
        );
      }
      dataString = csvRows.join("\n");
    }

    // Compute SHA-256 checksum
    const checksum = createHash("sha256").update(dataString).digest("hex");

    // Create the BenchmarkingExport record
    const exportRecord = await db.benchmarkingExport.create({
      data: {
        country: country || null,
        recordCount,
        status: "Completed",
        format,
        checksum,
        triggeredBy,
        completedAt: new Date(),
      },
    });

    // Get previous audit log hash for chain integrity
    const lastAuditLog = await db.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { hash: true },
    });

    // Create audit log entry
    const auditDetails = JSON.stringify({
      exportId: exportRecord.id,
      country: country || "All",
      format,
      recordCount,
      checksum,
    });

    const auditHash = createHash("sha256")
      .update(
        `BenchmarkingExport:${exportRecord.id}:${triggeredBy}:${auditDetails}:${Date.now()}`
      )
      .digest("hex");

    await db.auditLog.create({
      data: {
        entityType: "BenchmarkingExport",
        entityId: exportRecord.id,
        action: "Create",
        performedBy: triggeredBy,
        details: auditDetails,
        hash: auditHash,
        previousHash: lastAuditLog?.hash || null,
      },
    });

    return NextResponse.json(
      {
        ...exportRecord,
        data: dataString,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating benchmarking export:", error);
    return NextResponse.json(
      { error: "Failed to create benchmarking export" },
      { status: 500 }
    );
  }
}
