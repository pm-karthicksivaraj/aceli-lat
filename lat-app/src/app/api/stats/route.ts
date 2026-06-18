import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [
      totalLenders,
      activeMeetings,
      pendingReviews,
      syncPending,
      lendersByCountry,
      lendersByStatus,
    ] = await Promise.all([
      db.lender.count(),
      db.meeting.count({ where: { status: { in: ["Draft", "Submitted", "Processing"] } } }),
      db.extraction.count({ where: { reviewStatus: "Pending" } }),
      db.meeting.count({ where: { syncStatus: "Pending" } }),
      db.lender.groupBy({ by: ["country"], _count: true }),
      db.lender.groupBy({ by: ["relationshipStatus"], _count: true }),
    ]);

    const countryMap: Record<string, number> = {};
    for (const item of lendersByCountry) {
      countryMap[item.country] = item._count;
    }

    const statusMap: Record<string, number> = {};
    for (const item of lendersByStatus) {
      statusMap[item.relationshipStatus] = item._count;
    }

    const recentActivityCount = await db.activity.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      totalLenders,
      activeMeetings,
      pendingReviews,
      syncPending,
      lendersByCountry: countryMap,
      lendersByStatus: statusMap,
      recentActivityCount,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
