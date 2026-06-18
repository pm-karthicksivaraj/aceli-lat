import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.writeBackQueue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Write-back request not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.status === "Approved") {
      updateData.status = "Approved";
      updateData.approvedBy = body.approvedBy || "field_officer";
      updateData.approvedAt = new Date();
    } else if (body.status === "Rejected") {
      updateData.status = "RolledBack";
      updateData.result = body.reason || "Rejected by reviewer";
    } else if (body.status === "RolledBack") {
      updateData.status = "RolledBack";
      updateData.result = body.reason || "Rolled back by reviewer";
    } else if (body.status) {
      updateData.status = body.status;
    }

    const writeback = await db.writeBackQueue.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        entityType: "WriteBack",
        entityId: id,
        action: body.status === "Approved" ? "Approve" : "Update",
        performedBy: body.approvedBy || body.performedBy || "field_officer",
        details: JSON.stringify({
          previousStatus: existing.status,
          newStatus: updateData.status,
          targetObject: existing.targetObject,
          targetField: existing.targetField,
        }),
        correlationId: existing.extractionId,
      },
    });

    return NextResponse.json(writeback);
  } catch (error) {
    console.error("Error updating write-back request:", error);
    return NextResponse.json({ error: "Failed to update write-back request" }, { status: 500 });
  }
}
