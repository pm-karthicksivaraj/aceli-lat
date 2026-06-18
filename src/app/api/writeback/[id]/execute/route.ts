import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.writeBackQueue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Write-back request not found" }, { status: 404 });
    }

    if (existing.status !== "Approved") {
      return NextResponse.json({
        error: "Write-back must be approved before execution",
      }, { status: 400 });
    }

    // Update to InProgress
    await db.writeBackQueue.update({
      where: { id },
      data: { status: "InProgress" },
    });

    // Simulate Salesforce write-back with 2s delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate success/failure (90% success rate)
    const success = Math.random() > 0.1;

    if (success) {
      const writeback = await db.writeBackQueue.update({
        where: { id },
        data: {
          status: "Completed",
          executedAt: new Date(),
          result: `Successfully updated ${existing.targetObject}.${existing.targetField} in ${existing.targetSystem}`,
        },
      });

      // Create audit log
      await db.auditLog.create({
        data: {
          entityType: "WriteBack",
          entityId: id,
          action: "WriteBack",
          performedBy: existing.approvedBy || "system",
          details: JSON.stringify({
            targetSystem: existing.targetSystem,
            targetObject: existing.targetObject,
            targetField: existing.targetField,
            proposedValue: existing.proposedValue,
            result: "Success",
          }),
          correlationId: existing.extractionId,
        },
      });

      return NextResponse.json({
        success: true,
        writeback,
        message: `Successfully wrote to ${existing.targetSystem}`,
      });
    } else {
      const writeback = await db.writeBackQueue.update({
        where: { id },
        data: {
          status: "Failed",
          result: `Failed to update ${existing.targetObject}.${existing.targetField} in ${existing.targetSystem}: Connection timeout`,
          retryCount: existing.retryCount + 1,
        },
      });

      // Create audit log for failure
      await db.auditLog.create({
        data: {
          entityType: "WriteBack",
          entityId: id,
          action: "WriteBack",
          performedBy: existing.approvedBy || "system",
          details: JSON.stringify({
            targetSystem: existing.targetSystem,
            targetObject: existing.targetObject,
            targetField: existing.targetField,
            result: "Failed",
            error: "Connection timeout",
          }),
          correlationId: existing.extractionId,
        },
      });

      return NextResponse.json({
        success: false,
        writeback,
        message: "Write-back execution failed",
      });
    }
  } catch (error) {
    console.error("Error executing write-back:", error);
    return NextResponse.json({ error: "Failed to execute write-back" }, { status: 500 });
  }
}
