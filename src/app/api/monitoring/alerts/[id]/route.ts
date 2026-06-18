import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await db.monitoringAlert.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Monitoring alert not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error fetching monitoring alert:", error);
    return NextResponse.json(
      { error: "Failed to fetch monitoring alert" },
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
    const existing = await db.monitoringAlert.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Monitoring alert not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    switch (body.action) {
      case "acknowledge": {
        updateData.status = "Acknowledged";
        updateData.acknowledgedBy = body.acknowledgedBy ?? null;
        updateData.acknowledgedAt = new Date();
        break;
      }
      case "resolve": {
        updateData.status = "Resolved";
        updateData.resolvedBy = body.resolvedBy ?? null;
        updateData.resolvedAt = new Date();
        updateData.resolution = body.resolution ?? null;
        break;
      }
      case "suppress": {
        updateData.status = "Suppressed";
        updateData.suppressionReason = body.suppressionReason ?? null;
        updateData.suppressedUntil = body.suppressedUntil
          ? new Date(body.suppressedUntil)
          : null;
        break;
      }
      default: {
        // Generic update
        if (body.status) updateData.status = body.status;
        if (body.acknowledgedBy) {
          updateData.acknowledgedBy = body.acknowledgedBy;
          updateData.acknowledgedAt = new Date();
        }
        if (body.resolvedBy) {
          updateData.resolvedBy = body.resolvedBy;
          updateData.resolvedAt = new Date();
        }
        if (body.resolution !== undefined)
          updateData.resolution = body.resolution;
        if (body.suppressionReason !== undefined)
          updateData.suppressionReason = body.suppressionReason;
        if (body.suppressedUntil)
          updateData.suppressedUntil = new Date(body.suppressedUntil);
        break;
      }
    }

    const record = await db.monitoringAlert.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error updating monitoring alert:", error);
    return NextResponse.json(
      { error: "Failed to update monitoring alert" },
      { status: 500 }
    );
  }
}
