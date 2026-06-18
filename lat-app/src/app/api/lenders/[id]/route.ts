import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lender = await db.lender.findUnique({
      where: { id },
      include: {
        meetings: {
          orderBy: { meetingDate: "desc" },
          include: {
            extractions: true,
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!lender) {
      return NextResponse.json({ error: "Lender not found" }, { status: 404 });
    }

    return NextResponse.json(lender);
  } catch (error) {
    console.error("Error fetching lender:", error);
    return NextResponse.json({ error: "Failed to fetch lender" }, { status: 500 });
  }
}
