import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get the existing extraction for audit diff
    const existingExtraction = await db.extraction.findUnique({
      where: { id },
      include: {
        meeting: {
          include: {
            lender: true,
          },
        },
      },
    });

    if (!existingExtraction) {
      return NextResponse.json({ error: "Extraction not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      reviewStatus: body.reviewStatus,
    };

    if (body.reviewerNotes !== undefined) {
      updateData.reviewerNotes = body.reviewerNotes;
    }
    if (body.reviewStatus === "Approved" || body.reviewStatus === "Rejected" || body.reviewStatus === "Escalated" || body.reviewStatus === "FollowUp") {
      updateData.reviewedAt = new Date();
      updateData.reviewedBy = body.reviewedBy || "field_officer";
    }

    const extraction = await db.extraction.update({
      where: { id },
      data: updateData,
      include: {
        meeting: {
          include: {
            lender: true,
          },
        },
      },
    });

    // Create audit log for the review action
    const auditActionMap: Record<string, string> = {
      Approved: "Approve",
      Rejected: "Reject",
      Escalated: "Escalate",
      FollowUp: "Review",
    };
    const auditAction = auditActionMap[body.reviewStatus] || "Review";

    await db.auditLog.create({
      data: {
        entityType: "Extraction",
        entityId: id,
        action: auditAction,
        performedBy: body.reviewedBy || "field_officer",
        details: JSON.stringify({
          before: {
            reviewStatus: existingExtraction.reviewStatus,
          },
          after: {
            reviewStatus: body.reviewStatus,
            reviewerNotes: body.reviewerNotes || null,
          },
          fieldName: extraction.fieldName,
          activationArea: extraction.activationArea,
          lenderName: extraction.meeting.lender.institutionName,
        }),
        correlationId: extraction.meetingId,
      },
    });

    // Create exception queue entry if rejected or escalated
    if (body.reviewStatus === "Rejected" || body.reviewStatus === "Escalated") {
      const severity = body.reviewStatus === "Escalated" ? "High" : "Medium";
      const exceptionType = body.reviewStatus === "Escalated" ? "LowConfidence" : "ReviewerRejection";

      await db.exceptionQueue.create({
        data: {
          extractionId: id,
          lenderId: extraction.meeting.lenderId,
          meetingId: extraction.meetingId,
          exceptionType,
          severity,
          status: "Open",
          description: `Extraction "${extraction.fieldName}" (${extraction.activationArea}) was ${body.reviewStatus.toLowerCase()} by reviewer. Confidence: ${Math.round(extraction.confidenceScore * 100)}%. ${body.reviewerNotes ? `Notes: ${body.reviewerNotes}` : ""}`,
        },
      });

      // Create audit log for exception raised
      await db.auditLog.create({
        data: {
          entityType: "ExceptionQueue",
          entityId: id,
          action: "ExceptionRaised",
          performedBy: body.reviewedBy || "field_officer",
          details: JSON.stringify({
            exceptionType,
            severity,
            reviewStatus: body.reviewStatus,
          }),
          correlationId: extraction.meetingId,
        },
      });
    }

    // Auto-create WriteBackQueue entry if approved and confidence > 0.70
    if (body.reviewStatus === "Approved" && extraction.confidenceScore > 0.70) {
      // Map activation areas to Salesforce objects/fields
      const sfMapping: Record<string, { object: string; field: string }> = {
        commitment: { object: "Account", field: "Commitment_Score__c" },
        product: { object: "Account", field: "Product_Alignment_Score__c" },
        operational: { object: "Account", field: "Operational_Capacity_Score__c" },
        risk: { object: "Account", field: "Risk_Appetite_Score__c" },
        relationship: { object: "Account", field: "Relationship_Health_Score__c" },
        market: { object: "Account", field: "Market_Position_Score__c" },
      };

      const mapping = sfMapping[extraction.activationArea] || { object: "Account", field: "Notes__c" };

      await db.writeBackQueue.create({
        data: {
          extractionId: id,
          lenderId: extraction.meeting.lenderId,
          targetSystem: "Salesforce",
          targetObject: mapping.object,
          targetField: mapping.field,
          proposedValue: extraction.extractedValue,
          currentValue: null,
          status: "Pending",
        },
      });
    }

    // Create activity for the review
    await db.activity.create({
      data: {
        lenderId: extraction.meeting.lenderId,
        meetingId: extraction.meetingId,
        type: "Review",
        description: `Extraction "${extraction.fieldName}" ${body.reviewStatus.toLowerCase()} — ${extraction.meeting.lender.institutionName}`,
      },
    });

    // Check if all extractions for this meeting have been reviewed
    const pendingCount = await db.extraction.count({
      where: {
        meetingId: extraction.meetingId,
        reviewStatus: "Pending",
      },
    });

    if (pendingCount === 0) {
      await db.meeting.update({
        where: { id: extraction.meetingId },
        data: { status: "Approved" },
      });
    }

    return NextResponse.json(extraction);
  } catch (error) {
    console.error("Error updating extraction:", error);
    return NextResponse.json({ error: "Failed to update extraction" }, { status: 500 });
  }
}
