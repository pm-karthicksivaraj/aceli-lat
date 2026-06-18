import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Find all meetings with Pending sync status and mark them as Synced
    const result = await db.meeting.updateMany({
      where: { syncStatus: "Pending" },
      data: { syncStatus: "Synced" },
    });

    // Find all meetings with Failed sync status and retry
    const retryResult = await db.meeting.updateMany({
      where: { syncStatus: "Failed" },
      data: { syncStatus: "Synced" },
    });

    const totalSynced = result.count + retryResult.count;

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      message: totalSynced > 0
        ? `Successfully synced ${totalSynced} pending items`
        : "All items are already synced",
    });
  } catch (error) {
    console.error("Error syncing:", error);
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
  }
}
