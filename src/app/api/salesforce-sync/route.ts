import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const direction = searchParams.get("direction");
    const status = searchParams.get("status");
    const country = searchParams.get("country");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 20;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Record<string, unknown> = {};
    if (direction) where.direction = direction;
    if (status) where.status = status;
    if (country) where.country = country;
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.createdAt = dateFilter;
    }

    const [records, total] = await Promise.all([
      db.salesforceSyncLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.salesforceSyncLog.count({ where }),
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
    console.error("Error fetching Salesforce sync logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch Salesforce sync logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      direction,
      operation,
      status,
      country,
      recordsProcessed,
      recordsSucceeded,
      recordsFailed,
      errorMessage,
      startedAt,
      completedAt,
      durationMs,
      triggeredBy,
      syncVersion,
      checksumBefore,
      checksumAfter,
      conflictCount,
      conflictsJson,
    } = body as {
      direction: string;
      operation: string;
      status?: string;
      country?: string;
      recordsProcessed?: number;
      recordsSucceeded?: number;
      recordsFailed?: number;
      errorMessage?: string;
      startedAt?: string;
      completedAt?: string;
      durationMs?: number;
      triggeredBy: string;
      syncVersion?: string;
      checksumBefore?: string;
      checksumAfter?: string;
      conflictCount?: number;
      conflictsJson?: string;
    };

    if (!direction || !operation || !triggeredBy) {
      return NextResponse.json(
        { error: "direction, operation, and triggeredBy are required" },
        { status: 400 }
      );
    }

    const record = await db.salesforceSyncLog.create({
      data: {
        direction,
        operation,
        status: status ?? "Pending",
        country: country ?? null,
        recordsProcessed: recordsProcessed ?? 0,
        recordsSucceeded: recordsSucceeded ?? 0,
        recordsFailed: recordsFailed ?? 0,
        errorMessage: errorMessage ?? null,
        startedAt: startedAt ? new Date(startedAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
        durationMs: durationMs ?? 0,
        triggeredBy,
        syncVersion: syncVersion ?? null,
        checksumBefore: checksumBefore ?? null,
        checksumAfter: checksumAfter ?? null,
        conflictCount: conflictCount ?? 0,
        conflictsJson: conflictsJson ?? null,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("Error creating Salesforce sync log:", error);
    return NextResponse.json(
      { error: "Failed to create Salesforce sync log" },
      { status: 500 }
    );
  }
}
