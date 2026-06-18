import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const status = searchParams.get("status");
    const handoverType = searchParams.get("handoverType");
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 20;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (status) where.status = status;
    if (handoverType) where.handoverType = handoverType;

    const [records, total] = await Promise.all([
      db.adminHandover.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.adminHandover.count({ where }),
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
    console.error("Error fetching admin handovers:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin handovers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      country,
      handoverType,
      plannedDate,
      fromPerson,
      fromPersonEmail,
      toPerson,
      toPersonEmail,
      checklistItems,
      totalItems,
      notes,
    } = body as {
      country: string;
      handoverType: string;
      plannedDate: string;
      fromPerson: string;
      fromPersonEmail?: string;
      toPerson: string;
      toPersonEmail?: string;
      checklistItems?: string;
      totalItems?: number;
      notes?: string;
    };

    if (!country || !handoverType || !plannedDate || !fromPerson || !toPerson) {
      return NextResponse.json(
        {
          error:
            "country, handoverType, plannedDate, fromPerson, and toPerson are required",
        },
        { status: 400 }
      );
    }

    // Validate country
    const validCountries = [
      "Kenya",
      "Uganda",
      "Tanzania",
      "Ethiopia",
      "Nigeria",
      "Global",
    ];
    if (!validCountries.includes(country)) {
      return NextResponse.json(
        {
          error: `country must be one of: ${validCountries.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate handoverType
    const validHandoverTypes = [
      "FullHandover",
      "PartialHandover",
      "RoleTransition",
    ];
    if (!validHandoverTypes.includes(handoverType)) {
      return NextResponse.json(
        {
          error: `handoverType must be one of: ${validHandoverTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Compute totalItems from checklistItems if provided and totalItems not explicitly set
    let computedTotalItems = totalItems ?? 0;
    if (checklistItems && totalItems === undefined) {
      try {
        const items = JSON.parse(checklistItems);
        if (Array.isArray(items)) {
          computedTotalItems = items.length;
        }
      } catch {
        // If checklistItems is not valid JSON, ignore the parse error
      }
    }

    const record = await db.adminHandover.create({
      data: {
        country,
        handoverType,
        plannedDate: new Date(plannedDate),
        fromPerson,
        fromPersonEmail: fromPersonEmail ?? null,
        toPerson,
        toPersonEmail: toPersonEmail ?? null,
        checklistItems: checklistItems ?? null,
        totalItems: computedTotalItems,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("Error creating admin handover:", error);
    return NextResponse.json(
      { error: "Failed to create admin handover" },
      { status: 500 }
    );
  }
}
