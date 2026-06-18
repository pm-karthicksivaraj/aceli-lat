import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await db.reportingTemplate.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Reporting template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error fetching reporting template:", error);
    return NextResponse.json(
      { error: "Failed to fetch reporting template" },
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

    const existing = await db.reportingTemplate.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Reporting template not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    switch (body.action) {
      case "approve": {
        updateData.status = "Approved";
        updateData.approvedBy = body.approvedBy ?? null;
        updateData.approvedAt = new Date();
        break;
      }
      case "activate": {
        updateData.status = "Active";
        break;
      }
      case "archive": {
        updateData.status = "Archived";
        break;
      }
      case "generate": {
        updateData.lastGeneratedAt = new Date();
        updateData.generatedCount = existing.generatedCount + 1;
        break;
      }
      default: {
        // Generic update
        if (body.templateName) updateData.templateName = body.templateName;
        if (body.templateType) updateData.templateType = body.templateType;
        if (body.description) updateData.description = body.description;
        if (body.country !== undefined) updateData.country = body.country;
        if (body.sections) updateData.sections = body.sections;
        if (body.frequency) updateData.frequency = body.frequency;
        if (body.audience) updateData.audience = body.audience;
        if (body.status) updateData.status = body.status;
        if (body.version !== undefined) updateData.version = body.version;
        if (body.approvedBy !== undefined)
          updateData.approvedBy = body.approvedBy;
        if (body.approvedAt !== undefined)
          updateData.approvedAt = body.approvedAt
            ? new Date(body.approvedAt)
            : null;
        if (body.lastGeneratedAt !== undefined)
          updateData.lastGeneratedAt = body.lastGeneratedAt
            ? new Date(body.lastGeneratedAt)
            : null;
        if (body.generatedCount !== undefined)
          updateData.generatedCount = body.generatedCount;
        break;
      }
    }

    const record = await db.reportingTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error updating reporting template:", error);
    return NextResponse.json(
      { error: "Failed to update reporting template" },
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

    const existing = await db.reportingTemplate.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Reporting template not found" },
        { status: 404 }
      );
    }

    await db.reportingTemplate.delete({ where: { id } });

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting reporting template:", error);
    return NextResponse.json(
      { error: "Failed to delete reporting template" },
      { status: 500 }
    );
  }
}
