import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await db.adminHandover.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Admin handover not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error fetching admin handover:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin handover" },
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
    const existing = await db.adminHandover.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Admin handover not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    switch (body.action) {
      case "start": {
        updateData.status = "InProgress";
        break;
      }
      case "complete": {
        updateData.status = "Completed";
        updateData.completedDate = new Date();
        break;
      }
      case "accept": {
        updateData.signOffStatus = "Accepted";
        updateData.signOffBy = body.signOffBy ?? null;
        updateData.signOffAt = new Date();
        break;
      }
      case "reject": {
        updateData.signOffStatus = "Rejected";
        updateData.signOffBy = body.signOffBy ?? null;
        updateData.signOffAt = new Date();
        if (body.notes) updateData.notes = body.notes;
        break;
      }
      case "updateTransfer": {
        if (body.knowledgeTransferStatus)
          updateData.knowledgeTransferStatus = body.knowledgeTransferStatus;
        if (body.documentationStatus)
          updateData.documentationStatus = body.documentationStatus;
        if (body.accessTransferStatus)
          updateData.accessTransferStatus = body.accessTransferStatus;
        break;
      }
      case "updateChecklist": {
        if (body.checklistItems !== undefined)
          updateData.checklistItems = body.checklistItems;
        if (body.completedItems !== undefined)
          updateData.completedItems = body.completedItems;
        if (body.totalItems !== undefined)
          updateData.totalItems = body.totalItems;
        break;
      }
      default: {
        // Generic field updates
        if (body.country) updateData.country = body.country;
        if (body.handoverType) updateData.handoverType = body.handoverType;
        if (body.status) updateData.status = body.status;
        if (body.plannedDate)
          updateData.plannedDate = new Date(body.plannedDate);
        if (body.completedDate !== undefined) {
          updateData.completedDate = body.completedDate
            ? new Date(body.completedDate)
            : null;
        }
        if (body.fromPerson) updateData.fromPerson = body.fromPerson;
        if (body.fromPersonEmail !== undefined)
          updateData.fromPersonEmail = body.fromPersonEmail;
        if (body.toPerson) updateData.toPerson = body.toPerson;
        if (body.toPersonEmail !== undefined)
          updateData.toPersonEmail = body.toPersonEmail;
        if (body.checklistItems !== undefined)
          updateData.checklistItems = body.checklistItems;
        if (body.completedItems !== undefined)
          updateData.completedItems = body.completedItems;
        if (body.totalItems !== undefined)
          updateData.totalItems = body.totalItems;
        if (body.knowledgeTransferStatus)
          updateData.knowledgeTransferStatus = body.knowledgeTransferStatus;
        if (body.documentationStatus)
          updateData.documentationStatus = body.documentationStatus;
        if (body.accessTransferStatus)
          updateData.accessTransferStatus = body.accessTransferStatus;
        if (body.signOffBy !== undefined)
          updateData.signOffBy = body.signOffBy;
        if (body.signOffAt !== undefined) {
          updateData.signOffAt = body.signOffAt
            ? new Date(body.signOffAt)
            : null;
        }
        if (body.signOffStatus) updateData.signOffStatus = body.signOffStatus;
        if (body.notes !== undefined) updateData.notes = body.notes;
        break;
      }
    }

    const record = await db.adminHandover.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error updating admin handover:", error);
    return NextResponse.json(
      { error: "Failed to update admin handover" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify record exists
    const existing = await db.adminHandover.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Admin handover not found" },
        { status: 404 }
      );
    }

    await db.adminHandover.delete({
      where: { id },
    });

    return NextResponse.json({
      data: { id, deleted: true },
    });
  } catch (error) {
    console.error("Error deleting admin handover:", error);
    return NextResponse.json(
      { error: "Failed to delete admin handover" },
      { status: 500 }
    );
  }
}
