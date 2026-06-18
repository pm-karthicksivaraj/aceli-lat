import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const targetSystem = searchParams.get("targetSystem");
    const lenderId = searchParams.get("lenderId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (targetSystem) where.targetSystem = targetSystem;
    if (lenderId) where.lenderId = lenderId;

    const writebacks = await db.writeBackQueue.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(writebacks);
  } catch (error) {
    console.error("Error fetching write-back queue:", error);
    return NextResponse.json({ error: "Failed to fetch write-back queue" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate against validation rules before creating
    const rules = await db.validationRule.findMany({
      where: {
        entityType: "WriteBack",
        isActive: true,
      },
    });

    const validationFailures: string[] = [];
    for (const rule of rules) {
      const fieldValue = body[rule.fieldName] || body.proposedValue;
      if (rule.ruleType === "Required" && (!fieldValue || fieldValue === "")) {
        validationFailures.push(`Field "${rule.fieldName}" is required (${rule.severity})`);
      }
    }

    if (validationFailures.length > 0) {
      return NextResponse.json({
        error: "Validation failed",
        failures: validationFailures,
      }, { status: 400 });
    }

    const writeback = await db.writeBackQueue.create({
      data: {
        extractionId: body.extractionId,
        lenderId: body.lenderId,
        targetSystem: body.targetSystem || "Salesforce",
        targetObject: body.targetObject,
        targetField: body.targetField,
        proposedValue: body.proposedValue,
        currentValue: body.currentValue || null,
        status: "Pending",
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        entityType: "WriteBack",
        entityId: writeback.id,
        action: "Create",
        performedBy: body.performedBy || "system",
        details: JSON.stringify({
          targetSystem: body.targetSystem || "Salesforce",
          targetObject: body.targetObject,
          targetField: body.targetField,
          proposedValue: body.proposedValue,
        }),
        correlationId: body.extractionId,
      },
    });

    return NextResponse.json(writeback, { status: 201 });
  } catch (error) {
    console.error("Error creating write-back request:", error);
    return NextResponse.json({ error: "Failed to create write-back request" }, { status: 500 });
  }
}
