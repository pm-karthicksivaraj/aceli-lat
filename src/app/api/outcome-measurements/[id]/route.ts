import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await db.outcomeMeasurement.findUnique({
      where: { id },
      include: { kpi: true },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Outcome measurement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error fetching outcome measurement:", error);
    return NextResponse.json(
      { error: "Failed to fetch outcome measurement" },
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

    const existing = await db.outcomeMeasurement.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Outcome measurement not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    switch (body.action) {
      case "verify": {
        updateData.isVerified = true;
        updateData.verifiedBy = body.verifiedBy ?? null;
        updateData.verifiedAt = new Date();
        break;
      }
      default: {
        // Generic update
        if (body.measuredValue !== undefined)
          updateData.measuredValue = body.measuredValue;
        if (body.measurementDate !== undefined)
          updateData.measurementDate = body.measurementDate
            ? new Date(body.measurementDate)
            : new Date();
        if (body.period) updateData.period = body.period;
        if (body.measuredBy) updateData.measuredBy = body.measuredBy;
        if (body.methodology !== undefined)
          updateData.methodology = body.methodology;
        if (body.evidenceIds !== undefined)
          updateData.evidenceIds = body.evidenceIds;
        if (body.confidence !== undefined)
          updateData.confidence = body.confidence;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.isVerified !== undefined)
          updateData.isVerified = body.isVerified;
        if (body.verifiedBy !== undefined)
          updateData.verifiedBy = body.verifiedBy;
        if (body.verifiedAt !== undefined)
          updateData.verifiedAt = body.verifiedAt
            ? new Date(body.verifiedAt)
            : null;
        break;
      }
    }

    const record = await db.outcomeMeasurement.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error updating outcome measurement:", error);
    return NextResponse.json(
      { error: "Failed to update outcome measurement" },
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

    const existing = await db.outcomeMeasurement.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Outcome measurement not found" },
        { status: 404 }
      );
    }

    await db.outcomeMeasurement.delete({ where: { id } });

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting outcome measurement:", error);
    return NextResponse.json(
      { error: "Failed to delete outcome measurement" },
      { status: 500 }
    );
  }
}
