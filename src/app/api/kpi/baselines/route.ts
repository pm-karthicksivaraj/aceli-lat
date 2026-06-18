import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");

    const where: Record<string, unknown> = {};
    if (country) where.country = country;

    const baselines = await db.kPIBaseline.findMany({
      where,
      include: { measurements: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(baselines);
  } catch (error) {
    console.error("Error fetching KPI baselines:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPI baselines" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      metricName,
      country,
      baselineValue,
      measurementUnit,
      measurementDate,
      methodology,
      recordedBy,
      notes,
    } = body as {
      metricName: string;
      country: string;
      baselineValue: number;
      measurementUnit: string;
      measurementDate: string;
      methodology: string;
      recordedBy: string;
      notes?: string;
    };

    if (
      !metricName ||
      !country ||
      baselineValue === undefined ||
      !measurementUnit ||
      !measurementDate ||
      !methodology ||
      !recordedBy
    ) {
      return NextResponse.json(
        {
          error:
            "metricName, country, baselineValue, measurementUnit, measurementDate, methodology, and recordedBy are required",
        },
        { status: 400 }
      );
    }

    const baseline = await db.kPIBaseline.create({
      data: {
        metricName,
        country,
        baselineValue,
        measurementUnit,
        measurementDate: new Date(measurementDate),
        methodology,
        recordedBy,
        notes: notes || null,
      },
    });

    // Create audit log with hash chain
    const lastAuditLog = await db.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { hash: true },
    });

    const auditDetails = JSON.stringify({
      metricName,
      country,
      baselineValue,
      measurementUnit,
      methodology,
      recordedBy,
    });

    const auditHash = createHash("sha256")
      .update(
        `KPIBaseline:${baseline.id}:${recordedBy}:${auditDetails}:${Date.now()}`
      )
      .digest("hex");

    await db.auditLog.create({
      data: {
        entityType: "KPIBaseline",
        entityId: baseline.id,
        action: "Create",
        performedBy: recordedBy,
        details: auditDetails,
        hash: auditHash,
        previousHash: lastAuditLog?.hash || null,
      },
    });

    return NextResponse.json(baseline, { status: 201 });
  } catch (error) {
    console.error("Error creating KPI baseline:", error);
    return NextResponse.json(
      { error: "Failed to create KPI baseline" },
      { status: 500 }
    );
  }
}
