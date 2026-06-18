import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await db.supportTicket.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Support ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error fetching support ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch support ticket" },
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
    const existing = await db.supportTicket.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Support ticket not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    switch (body.action) {
      case "assign": {
        updateData.assignedTo = body.assignedTo ?? null;
        updateData.assignedToEmail = body.assignedToEmail ?? null;
        updateData.assignedTeam = body.assignedTeam ?? null;
        updateData.status = "Assigned";
        // Set first response time if not already set
        if (!existing.firstResponseAt) {
          updateData.firstResponseAt = new Date();
        }
        break;
      }
      case "escalate": {
        const currentLevel = existing.escalationLevel ?? 0;
        updateData.escalationLevel = currentLevel + 1;
        updateData.escalatedAt = new Date();
        // Auto-assign to higher tier team if specified
        if (body.assignedTeam) updateData.assignedTeam = body.assignedTeam;
        if (body.assignedTo) updateData.assignedTo = body.assignedTo;
        if (body.assignedToEmail)
          updateData.assignedToEmail = body.assignedToEmail;
        updateData.status = "InProgress";
        break;
      }
      case "resolve": {
        updateData.status = "Resolved";
        updateData.resolution = body.resolution ?? null;
        updateData.resolvedBy = body.resolvedBy ?? null;
        updateData.resolvedAt = new Date();
        if (body.satisfactionScore !== undefined) {
          updateData.satisfactionScore = body.satisfactionScore;
        }
        break;
      }
      case "close": {
        updateData.status = "Closed";
        if (body.satisfactionScore !== undefined) {
          updateData.satisfactionScore = body.satisfactionScore;
        }
        break;
      }
      default: {
        // Generic update
        if (body.status) updateData.status = body.status;
        if (body.priority) updateData.priority = body.priority;
        if (body.assignedTo !== undefined)
          updateData.assignedTo = body.assignedTo;
        if (body.assignedToEmail !== undefined)
          updateData.assignedToEmail = body.assignedToEmail;
        if (body.assignedTeam !== undefined)
          updateData.assignedTeam = body.assignedTeam;
        if (body.resolution !== undefined)
          updateData.resolution = body.resolution;
        if (body.workaround !== undefined)
          updateData.workaround = body.workaround;
        if (body.satisfactionScore !== undefined)
          updateData.satisfactionScore = body.satisfactionScore;
        if (body.escalationLevel !== undefined)
          updateData.escalationLevel = body.escalationLevel;
        break;
      }
    }

    const record = await db.supportTicket.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error updating support ticket:", error);
    return NextResponse.json(
      { error: "Failed to update support ticket" },
      { status: 500 }
    );
  }
}
