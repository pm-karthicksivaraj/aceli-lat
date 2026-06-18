import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const weekStartDateFrom = searchParams.get("weekStartDateFrom");
    const weekStartDateTo = searchParams.get("weekStartDateTo");
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 20;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (weekStartDateFrom || weekStartDateTo) {
      const dateFilter: Record<string, unknown> = {};
      if (weekStartDateFrom) dateFilter.gte = new Date(weekStartDateFrom);
      if (weekStartDateTo) dateFilter.lte = new Date(weekStartDateTo);
      where.weekStartDate = dateFilter;
    }

    const [records, total] = await Promise.all([
      db.weeklyActiveUse.findMany({
        where,
        orderBy: { weekStartDate: "desc" },
        skip,
        take,
      }),
      db.weeklyActiveUse.count({ where }),
    ]);

    // Aggregated stats
    const aggregated = await db.weeklyActiveUse.aggregate({
      where,
      _sum: {
        totalUsers: true,
        activeUsers: true,
        captureActions: true,
        reviewActions: true,
        syncActions: true,
        writebackActions: true,
      },
      _avg: {
        averageSessionMinutes: true,
      },
      _max: {
        peakConcurrentUsers: true,
      },
    });

    return NextResponse.json({
      data: records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats: {
        totalUsers: aggregated._sum.totalUsers ?? 0,
        activeUsers: aggregated._sum.activeUsers ?? 0,
        captureActions: aggregated._sum.captureActions ?? 0,
        reviewActions: aggregated._sum.reviewActions ?? 0,
        syncActions: aggregated._sum.syncActions ?? 0,
        writebackActions: aggregated._sum.writebackActions ?? 0,
        averageSessionMinutes: aggregated._avg.averageSessionMinutes ?? 0,
        peakConcurrentUsers: aggregated._max.peakConcurrentUsers ?? 0,
      },
    });
  } catch (error) {
    console.error("Error fetching weekly active use:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly active use records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      country,
      weekStartDate,
      weekEndDate,
      totalUsers,
      activeUsers,
      captureActions,
      reviewActions,
      syncActions,
      writebackActions,
      averageSessionMinutes,
      peakConcurrentUsers,
      recordedBy,
      notes,
    } = body as {
      country: string;
      weekStartDate: string;
      weekEndDate: string;
      totalUsers?: number;
      activeUsers?: number;
      captureActions?: number;
      reviewActions?: number;
      syncActions?: number;
      writebackActions?: number;
      averageSessionMinutes?: number;
      peakConcurrentUsers?: number;
      recordedBy: string;
      notes?: string;
    };

    if (!country || !weekStartDate || !weekEndDate || !recordedBy) {
      return NextResponse.json(
        {
          error:
            "country, weekStartDate, weekEndDate, and recordedBy are required",
        },
        { status: 400 }
      );
    }

    const record = await db.weeklyActiveUse.create({
      data: {
        country,
        weekStartDate: new Date(weekStartDate),
        weekEndDate: new Date(weekEndDate),
        totalUsers: totalUsers ?? 0,
        activeUsers: activeUsers ?? 0,
        captureActions: captureActions ?? 0,
        reviewActions: reviewActions ?? 0,
        syncActions: syncActions ?? 0,
        writebackActions: writebackActions ?? 0,
        averageSessionMinutes: averageSessionMinutes ?? 0,
        peakConcurrentUsers: peakConcurrentUsers ?? 0,
        recordedBy,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("Error creating weekly active use record:", error);
    return NextResponse.json(
      { error: "Failed to create weekly active use record" },
      { status: 500 }
    );
  }
}
