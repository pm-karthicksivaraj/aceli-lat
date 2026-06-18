import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const kpiId = searchParams.get("kpiId");
    const period = searchParams.get("period");
    const isVerified = searchParams.get("isVerified");

    const where: Record<string, unknown> = {};
    if (kpiId) where.kpiId = kpiId;
    if (period) where.period = period;
    if (isVerified !== null) {
      where.isVerified = isVerified === "true";
    }

    const [records, total] = await Promise.all([
      db.outcomeMeasurement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.outcomeMeasurement.count({ where }),
    ]);

    return NextResponse.json({
      data: records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching outcome measurements:", error);
    return NextResponse.json(
      { error: "Failed to fetch outcome measurements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      kpiId,
      measuredValue,
      measurementDate,
      period,
      measuredBy,
      methodology,
      evidenceIds,
      confidence,
      notes,
    } = body as {
      kpiId: string;
      measuredValue: number;
      measurementDate?: string;
      period: string;
      measuredBy: string;
      methodology?: string;
      evidenceIds?: string;
      confidence?: number;
      notes?: string;
    };

    if (!kpiId || measuredValue === undefined || !period || !measuredBy) {
      return NextResponse.json(
        {
          error:
            "kpiId, measuredValue, period, and measuredBy are required",
        },
        { status: 400 }
      );
    }

    // Verify the KPI exists
    const kpi = await db.outcomeKPI.findUnique({ where: { id: kpiId } });
    if (!kpi) {
      return NextResponse.json(
        { error: "Referenced KPI not found" },
        { status: 400 }
      );
    }

    const record = await db.outcomeMeasurement.create({
      data: {
        kpiId,
        measuredValue,
        measurementDate: measurementDate ? new Date(measurementDate) : new Date(),
        period,
        measuredBy,
        methodology: methodology ?? null,
        evidenceIds: evidenceIds ?? null,
        confidence: confidence ?? 1.0,
        notes: notes ?? null,
        isVerified: false,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("Error creating outcome measurement:", error);
    return NextResponse.json(
      { error: "Failed to create outcome measurement" },
      { status: 500 }
    );
  }
}
