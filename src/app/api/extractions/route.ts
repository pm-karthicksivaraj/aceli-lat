import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const meetingId = searchParams.get("meetingId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (meetingId) where.meetingId = meetingId;
    if (status) where.reviewStatus = status;

    const extractions = await db.extraction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        meeting: {
          include: {
            lender: {
              select: {
                id: true,
                institutionName: true,
                contactName: true,
                country: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(extractions);
  } catch (error) {
    console.error("Error fetching extractions:", error);
    return NextResponse.json({ error: "Failed to fetch extractions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const extraction = await db.extraction.create({
      data: {
        meetingId: body.meetingId,
        activationArea: body.activationArea,
        fieldName: body.fieldName,
        extractedValue: body.extractedValue,
        confidenceScore: body.confidenceScore,
        reviewStatus: body.reviewStatus || "Pending",
      },
    });

    return NextResponse.json(extraction, { status: 201 });
  } catch (error) {
    console.error("Error creating extraction:", error);
    return NextResponse.json({ error: "Failed to create extraction" }, { status: 500 });
  }
}
