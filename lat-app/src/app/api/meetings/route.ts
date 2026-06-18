import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lenderId = searchParams.get("lenderId");
    const status = searchParams.get("status");
    const countOnly = searchParams.get("countOnly");

    const where: Record<string, unknown> = {};
    if (lenderId) where.lenderId = lenderId;
    if (status) where.status = status;

    if (countOnly === "true") {
      const pendingCount = await db.meeting.count({
        where: { syncStatus: "Pending" },
      });
      return NextResponse.json({ pendingCount });
    }

    const meetings = await db.meeting.findMany({
      where,
      orderBy: { meetingDate: "desc" },
      include: {
        lender: {
          select: {
            id: true,
            institutionName: true,
            contactName: true,
            country: true,
          },
        },
        extractions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const meeting = await db.meeting.create({
      data: {
        lenderId: body.lenderId,
        status: body.status || "Draft",
        typedNotes: body.typedNotes || null,
        audioBlobPath: body.audioBlobPath || null,
        duration: body.duration || 0,
        syncStatus: body.syncStatus || "Synced",
      },
      include: {
        lender: true,
      },
    });

    await db.activity.create({
      data: {
        lenderId: body.lenderId,
        meetingId: meeting.id,
        type: "Meeting",
        description: `New meeting created with ${meeting.lender.institutionName}`,
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
  }
}
