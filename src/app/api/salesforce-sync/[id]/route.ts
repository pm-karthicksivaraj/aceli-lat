import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await db.salesforceSyncLog.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Salesforce sync log not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error fetching Salesforce sync log:", error);
    return NextResponse.json(
      { error: "Failed to fetch Salesforce sync log" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify record exists
    const existing = await db.salesforceSyncLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Salesforce sync log not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // Update status
    if (body.status) updateData.status = body.status;

    // Update error info
    if (body.errorMessage !== undefined)
      updateData.errorMessage = body.errorMessage;
    if (body.recordsProcessed !== undefined)
      updateData.recordsProcessed = body.recordsProcessed;
    if (body.recordsSucceeded !== undefined)
      updateData.recordsSucceeded = body.recordsSucceeded;
    if (body.recordsFailed !== undefined)
      updateData.recordsFailed = body.recordsFailed;

    // Update completion details
    if (body.completedAt) updateData.completedAt = new Date(body.completedAt);
    if (body.durationMs !== undefined) updateData.durationMs = body.durationMs;
    if (body.checksumAfter !== undefined)
      updateData.checksumAfter = body.checksumAfter;
    if (body.conflictCount !== undefined)
      updateData.conflictCount = body.conflictCount;
    if (body.conflictsJson !== undefined)
      updateData.conflictsJson = body.conflictsJson;

    // Auto-set startedAt if transitioning from Pending to InProgress
    if (body.status === "InProgress" && !existing.startedAt) {
      updateData.startedAt = new Date();
    }

    // Auto-set completedAt if transitioning to a terminal state
    if (
      (body.status === "Completed" ||
        body.status === "Failed" ||
        body.status === "PartiallyCompleted") &&
      !body.completedAt
    ) {
      updateData.completedAt = new Date();
    }

    const record = await db.salesforceSyncLog.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error updating Salesforce sync log:", error);
    return NextResponse.json(
      { error: "Failed to update Salesforce sync log" },
      { status: 500 }
    );
  }
}
