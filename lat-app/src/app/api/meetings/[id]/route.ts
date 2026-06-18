import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const meeting = await db.meeting.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.typedNotes !== undefined && { typedNotes: body.typedNotes }),
        ...(body.audioBlobPath !== undefined && { audioBlobPath: body.audioBlobPath }),
        ...(body.transcript !== undefined && { transcript: body.transcript }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.syncStatus && { syncStatus: body.syncStatus }),
      },
      include: {
        lender: true,
      },
    });

    if (body.status === "Submitted") {
      await db.activity.create({
        data: {
          lenderId: meeting.lenderId,
          meetingId: meeting.id,
          type: "Meeting",
          description: `Meeting submitted for processing with ${meeting.lender.institutionName}`,
        },
      });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 });
  }
}
