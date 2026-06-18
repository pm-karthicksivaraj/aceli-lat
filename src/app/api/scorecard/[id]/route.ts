import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ScorecardTraceEntry } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the scorecard snapshot
    const snapshot = await db.scorecardSnapshot.findUnique({
      where: { id },
    });

    if (!snapshot) {
      return NextResponse.json(
        { error: "Scorecard snapshot not found" },
        { status: 404 }
      );
    }

    // Parse sourceExtractionIds JSON to get extraction IDs
    let extractionIds: string[] = [];
    try {
      extractionIds = JSON.parse(snapshot.sourceExtractionIds);
    } catch {
      extractionIds = [];
    }

    // Fetch the actual Extraction records whose IDs are in sourceExtractionIds
    const extractions = extractionIds.length > 0
      ? await db.extraction.findMany({
          where: {
            id: { in: extractionIds },
          },
          include: {
            meeting: {
              select: {
                meetingDate: true,
              },
            },
          },
        })
      : [];

    // Map to ScorecardTraceEntry format
    const traceEntries: ScorecardTraceEntry[] = extractions.map((ext) => ({
      extractionId: ext.id,
      activationArea: ext.activationArea,
      fieldName: ext.fieldName,
      extractedValue: ext.extractedValue,
      confidenceScore: ext.confidenceScore,
      reviewStatus: ext.reviewStatus,
      reviewedBy: ext.reviewedBy,
      reviewedAt: ext.reviewedAt ? ext.reviewedAt.toISOString() : null,
      meetingDate: ext.meeting.meetingDate.toISOString(),
    }));

    return NextResponse.json({
      snapshot,
      traceEntries,
    });
  } catch (error) {
    console.error("Error fetching scorecard detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch scorecard detail" },
      { status: 500 }
    );
  }
}
