import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const actionType = searchParams.get("actionType");
    const category = searchParams.get("category");
    const country = searchParams.get("country");
    const performedBy = searchParams.get("performedBy");
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 20;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Record<string, unknown> = {};
    if (actionType) where.actionType = actionType;
    if (category) where.category = category;
    if (country) where.country = country;
    if (performedBy) where.performedBy = performedBy;

    const [records, total] = await Promise.all([
      db.adminAction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.adminAction.count({ where }),
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
    console.error("Error fetching admin actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin actions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      actionType,
      category,
      performedBy,
      performedByEmail,
      targetEntity,
      targetEntityId,
      description,
      previousValue,
      newValue,
      country,
      justification,
      approvedBy,
      impact,
      rollbackPlan,
    } = body as {
      actionType: string;
      category: string;
      performedBy: string;
      performedByEmail?: string;
      targetEntity: string;
      targetEntityId?: string;
      description: string;
      previousValue?: string;
      newValue?: string;
      country?: string;
      justification?: string;
      approvedBy?: string;
      impact?: string;
      rollbackPlan?: string;
    };

    if (!actionType || !category || !performedBy || !targetEntity || !description) {
      return NextResponse.json(
        {
          error:
            "actionType, category, performedBy, targetEntity, and description are required",
        },
        { status: 400 }
      );
    }

    const record = await db.adminAction.create({
      data: {
        actionType,
        category,
        performedBy,
        performedByEmail: performedByEmail ?? null,
        targetEntity,
        targetEntityId: targetEntityId ?? null,
        description,
        previousValue: previousValue ?? null,
        newValue: newValue ?? null,
        country: country ?? null,
        justification: justification ?? null,
        approvedBy: approvedBy ?? null,
        impact: impact ?? "Low",
        rollbackPlan: rollbackPlan ?? null,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("Error creating admin action:", error);
    return NextResponse.json(
      { error: "Failed to create admin action" },
      { status: 500 }
    );
  }
}
