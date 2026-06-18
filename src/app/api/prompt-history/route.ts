import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const meetingId = searchParams.get("meetingId");

    const where: Record<string, unknown> = {};
    if (meetingId) where.meetingId = meetingId;

    const history = await db.promptHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching prompt history:", error);
    return NextResponse.json({ error: "Failed to fetch prompt history" }, { status: 500 });
  }
}
