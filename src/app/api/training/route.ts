import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const trainingModule = searchParams.get("module");
    const status = searchParams.get("status");
    const role = searchParams.get("role");

    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (trainingModule) where.module = trainingModule;
    if (status) where.status = status;
    if (role) where.role = role;

    const records = await db.trainingRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching training records:", error);
    return NextResponse.json(
      { error: "Failed to fetch training records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      userName,
      country,
      role,
      module: trainingModule,
      status,
      completedAt,
      score,
      trainer,
      notes,
    } = body as {
      userId: string;
      userName: string;
      country: string;
      role: string;
      module: string;
      status?: string;
      completedAt?: string;
      score?: number;
      trainer?: string;
      notes?: string;
    };

    if (!userId || !userName || !country || !role || !trainingModule) {
      return NextResponse.json(
        {
          error: "userId, userName, country, role, and module are required",
        },
        { status: 400 }
      );
    }

    const record = await db.trainingRecord.create({
      data: {
        userId,
        userName,
        country,
        role,
        module: trainingModule,
        status: status || "NotStarted",
        completedAt: completedAt ? new Date(completedAt) : null,
        score: score !== undefined ? score : null,
        trainer: trainer || null,
        notes: notes || null,
      },
    });

    // Create audit log with hash chain
    const lastAuditLog = await db.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { hash: true },
    });

    const auditDetails = JSON.stringify({
      userId,
      userName,
      country,
      role,
      module: trainingModule,
      status: status || "NotStarted",
    });

    const auditHash = createHash("sha256")
      .update(
        `TrainingRecord:${record.id}:${userId}:${auditDetails}:${Date.now()}`
      )
      .digest("hex");

    await db.auditLog.create({
      data: {
        entityType: "TrainingRecord",
        entityId: record.id,
        action: "Create",
        performedBy: userId,
        details: auditDetails,
        hash: auditHash,
        previousHash: lastAuditLog?.hash || null,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error creating training record:", error);
    return NextResponse.json(
      { error: "Failed to create training record" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required for PATCH" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Verify record exists
    const existing = await db.trainingRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Training record not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.status) updateData.status = body.status;
    if (body.completedAt)
      updateData.completedAt = new Date(body.completedAt);
    if (body.score !== undefined) updateData.score = body.score;
    if (body.trainer) updateData.trainer = body.trainer;
    if (body.notes) updateData.notes = body.notes;

    const record = await db.trainingRecord.update({
      where: { id },
      data: updateData,
    });

    // Create audit log with hash chain
    const lastAuditLog = await db.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { hash: true },
    });

    const performedBy = body.performedBy || existing.userId;

    const auditDetails = JSON.stringify({
      previousStatus: existing.status,
      newStatus: record.status,
      changes: updateData,
    });

    const auditHash = createHash("sha256")
      .update(
        `TrainingRecord:${id}:${performedBy}:${auditDetails}:${Date.now()}`
      )
      .digest("hex");

    await db.auditLog.create({
      data: {
        entityType: "TrainingRecord",
        entityId: id,
        action: "Update",
        performedBy,
        details: auditDetails,
        hash: auditHash,
        previousHash: lastAuditLog?.hash || null,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error updating training record:", error);
    return NextResponse.json(
      { error: "Failed to update training record" },
      { status: 500 }
    );
  }
}
