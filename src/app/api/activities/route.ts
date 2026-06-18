import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lenderId = searchParams.get("lenderId");
    const limit = parseInt(searchParams.get("limit") || "30");

    const where: Record<string, unknown> = {};
    if (lenderId) where.lenderId = lenderId;

    const activities = await db.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        lender: {
          select: {
            id: true,
            institutionName: true,
            country: true,
          },
        },
      },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
