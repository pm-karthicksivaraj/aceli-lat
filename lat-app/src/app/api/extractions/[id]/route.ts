import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      reviewStatus: body.reviewStatus,
    };

    if (body.reviewerNotes !== undefined) {
      updateData.reviewerNotes = body.reviewerNotes;
    }
    if (body.reviewStatus === "Approved" || body.reviewStatus === "Rejected" || body.reviewStatus === "Escalated") {
      updateData.reviewedAt = new Date();
      updateData.reviewedBy = body.reviewedBy || "field_officer";
    }

    const extraction = await db.extraction.update({
      where: { id },
      data: updateData,
      include: {
        meeting: {
          include: {
            lender: true,
          },
        },
      },
    });

    // Create activity for the review
    await db.activity.create({
      data: {
        lenderId: extraction.meeting.lenderId,
        meetingId: extraction.meetingId,
        type: "Review",
        description: `Extraction "${extraction.fieldName}" ${body.reviewStatus.toLowerCase()} — ${extraction.meeting.lender.institutionName}`,
      },
    });

    // Check if all extractions for this meeting have been reviewed
    const pendingCount = await db.extraction.count({
      where: {
        meetingId: extraction.meetingId,
        reviewStatus: "Pending",
      },
    });

    if (pendingCount === 0) {
      await db.meeting.update({
        where: { id: extraction.meetingId },
        data: { status: "Approved" },
      });
    }

    return NextResponse.json(extraction);
  } catch (error) {
    console.error("Error updating extraction:", error);
    return NextResponse.json({ error: "Failed to update extraction" }, { status: 500 });
  }
}
