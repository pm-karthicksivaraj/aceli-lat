import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const baselineId = searchParams.get("baselineId");
    const country = searchParams.get("country");

    const where: Record<string, unknown> = {};
    if (baselineId) where.baselineId = baselineId;

    // If country filter, join with KPIBaseline
    if (country) {
      where.baseline = { country };
    }

    const measurements = await db.kPIMeasurement.findMany({
      where,
      include: { baseline: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(measurements);
  } catch (error) {
    console.error("Error fetching KPI measurements:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPI measurements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      baselineId,
      measuredValue,
      measuredBy,
      period,
      notes,
    } = body as {
      baselineId: string;
      measuredValue: number;
      measuredBy: string;
      period: string;
      notes?: string;
    };

    if (!baselineId || measuredValue === undefined || !measuredBy || !period) {
      return NextResponse.json(
        {
          error: "baselineId, measuredValue, measuredBy, and period are required",
        },
        { status: 400 }
      );
    }

    const measurement = await db.kPIMeasurement.create({
      data: {
        baselineId,
        measuredValue,
        measuredBy,
        period,
        notes: notes || null,
      },
    });

    // Create audit log with hash chain
    const lastAuditLog = await db.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { hash: true },
    });

    const auditDetails = JSON.stringify({
      baselineId,
      measuredValue,
      measuredBy,
      period,
    });

    const auditHash = createHash("sha256")
      .update(
        `KPIMeasurement:${measurement.id}:${measuredBy}:${auditDetails}:${Date.now()}`
      )
      .digest("hex");

    await db.auditLog.create({
      data: {
        entityType: "KPIMeasurement",
        entityId: measurement.id,
        action: "Create",
        performedBy: measuredBy,
        details: auditDetails,
        correlationId: baselineId,
        hash: auditHash,
        previousHash: lastAuditLog?.hash || null,
      },
    });

    return NextResponse.json(measurement, { status: 201 });
  } catch (error) {
    console.error("Error creating KPI measurement:", error);
    return NextResponse.json(
      { error: "Failed to create KPI measurement" },
      { status: 500 }
    );
  }
}
