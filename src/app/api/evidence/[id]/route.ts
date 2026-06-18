import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await db.evidenceCapture.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Evidence capture not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error fetching evidence capture:", error);
    return NextResponse.json(
      { error: "Failed to fetch evidence capture" },
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

    const existing = await db.evidenceCapture.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Evidence capture not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    switch (body.action) {
      case "verify": {
        updateData.verificationStatus = "Verified";
        updateData.verifiedBy = body.verifiedBy ?? null;
        updateData.verifiedAt = new Date();
        break;
      }
      case "reject": {
        updateData.verificationStatus = "Rejected";
        updateData.verifiedBy = body.verifiedBy ?? null;
        updateData.verifiedAt = new Date();
        break;
      }
      case "archive": {
        updateData.isArchived = true;
        updateData.archivedAt = new Date();
        break;
      }
      default: {
        // Generic update
        if (body.evidenceType) updateData.evidenceType = body.evidenceType;
        if (body.title) updateData.title = body.title;
        if (body.description) updateData.description = body.description;
        if (body.category) updateData.category = body.category;
        if (body.country !== undefined) updateData.country = body.country;
        if (body.sourceSystem) updateData.sourceSystem = body.sourceSystem;
        if (body.evidenceData !== undefined)
          updateData.evidenceData = body.evidenceData;
        if (body.collectedBy) updateData.collectedBy = body.collectedBy;
        if (body.collectedAt !== undefined)
          updateData.collectedAt = body.collectedAt
            ? new Date(body.collectedAt)
            : new Date();
        if (body.relatedKpiId !== undefined)
          updateData.relatedKpiId = body.relatedKpiId;
        if (body.relatedReportingTemplateId !== undefined)
          updateData.relatedReportingTemplateId =
            body.relatedReportingTemplateId;
        if (body.verificationStatus)
          updateData.verificationStatus = body.verificationStatus;
        if (body.verifiedBy !== undefined)
          updateData.verifiedBy = body.verifiedBy;
        if (body.verifiedAt !== undefined)
          updateData.verifiedAt = body.verifiedAt
            ? new Date(body.verifiedAt)
            : null;
        if (body.expiryDate !== undefined)
          updateData.expiryDate = body.expiryDate
            ? new Date(body.expiryDate)
            : null;
        if (body.isArchived !== undefined)
          updateData.isArchived = body.isArchived;
        if (body.archivedAt !== undefined)
          updateData.archivedAt = body.archivedAt
            ? new Date(body.archivedAt)
            : null;
        if (body.notes !== undefined) updateData.notes = body.notes;
        break;
      }
    }

    const record = await db.evidenceCapture.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error updating evidence capture:", error);
    return NextResponse.json(
      { error: "Failed to update evidence capture" },
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

    const existing = await db.evidenceCapture.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Evidence capture not found" },
        { status: 404 }
      );
    }

    await db.evidenceCapture.delete({ where: { id } });

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting evidence capture:", error);
    return NextResponse.json(
      { error: "Failed to delete evidence capture" },
      { status: 500 }
    );
  }
}
