import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rolloutStatus = searchParams.get("rolloutStatus");

    const where: Record<string, unknown> = {};
    if (rolloutStatus) where.rolloutStatus = rolloutStatus;

    const configs = await db.countryConfig.findMany({
      where,
      orderBy: { country: "asc" },
    });

    // Compute additional fields for each config
    const enrichedConfigs = await Promise.all(
      configs.map(async (config) => {
        // Training completion rate
        const totalTraining = await db.trainingRecord.count({
          where: { country: config.country },
        });
        const completedTraining = await db.trainingRecord.count({
          where: { country: config.country, status: "Completed" },
        });
        const trainingCompletionRate =
          totalTraining > 0
            ? Math.round((completedTraining / totalTraining) * 10000) / 100
            : 0;

        // Lender count
        const lenderCount = await db.lender.count({
          where: { country: config.country },
        });

        // Active users count (from TrainingRecord where status='Completed')
        const activeUsersCount = completedTraining;

        return {
          ...config,
          trainingCompletionRate,
          lenderCount,
          activeUsersCount,
        };
      })
    );

    return NextResponse.json(enrichedConfigs);
  } catch (error) {
    console.error("Error fetching country configs:", error);
    return NextResponse.json(
      { error: "Failed to fetch country configs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      country,
      createdBy,
      rolloutStatus,
      pilotCountry,
      goLiveDate,
      primaryLanguage,
      secondaryLanguage,
      currency,
      timeZone,
      salesforceInstance,
      fieldOfficerCount,
      countryManagerId,
      dataMigrationStatus,
      trainingStatus,
      roleSetupComplete,
      configJson,
    } = body as {
      country: string;
      createdBy: string;
      rolloutStatus?: string;
      pilotCountry?: boolean;
      goLiveDate?: string;
      primaryLanguage?: string;
      secondaryLanguage?: string;
      currency?: string;
      timeZone?: string;
      salesforceInstance?: string;
      fieldOfficerCount?: number;
      countryManagerId?: string;
      dataMigrationStatus?: string;
      trainingStatus?: string;
      roleSetupComplete?: boolean;
      configJson?: string;
    };

    if (!country || !createdBy) {
      return NextResponse.json(
        { error: "country and createdBy are required" },
        { status: 400 }
      );
    }

    // Upsert: create or update by country (unique field)
    const config = await db.countryConfig.upsert({
      where: { country },
      create: {
        country,
        createdBy,
        rolloutStatus: rolloutStatus || "Pending",
        pilotCountry: pilotCountry || false,
        goLiveDate: goLiveDate ? new Date(goLiveDate) : null,
        primaryLanguage: primaryLanguage || "English",
        secondaryLanguage: secondaryLanguage || null,
        currency: currency || "USD",
        timeZone: timeZone || "Africa/Nairobi",
        salesforceInstance: salesforceInstance || null,
        fieldOfficerCount: fieldOfficerCount || 0,
        countryManagerId: countryManagerId || null,
        dataMigrationStatus: dataMigrationStatus || "Pending",
        trainingStatus: trainingStatus || "Pending",
        roleSetupComplete: roleSetupComplete || false,
        configJson: configJson || null,
      },
      update: {
        rolloutStatus: rolloutStatus || undefined,
        pilotCountry: pilotCountry !== undefined ? pilotCountry : undefined,
        goLiveDate: goLiveDate ? new Date(goLiveDate) : undefined,
        primaryLanguage: primaryLanguage || undefined,
        secondaryLanguage: secondaryLanguage || undefined,
        currency: currency || undefined,
        timeZone: timeZone || undefined,
        salesforceInstance: salesforceInstance || undefined,
        fieldOfficerCount: fieldOfficerCount || undefined,
        countryManagerId: countryManagerId || undefined,
        dataMigrationStatus: dataMigrationStatus || undefined,
        trainingStatus: trainingStatus || undefined,
        roleSetupComplete:
          roleSetupComplete !== undefined ? roleSetupComplete : undefined,
        configJson: configJson || undefined,
      },
    });

    // Create audit log with hash chain
    const lastAuditLog = await db.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { hash: true },
    });

    const auditDetails = JSON.stringify({
      country,
      rolloutStatus: rolloutStatus || "Pending",
      performedBy: createdBy,
    });

    const auditHash = createHash("sha256")
      .update(
        `CountryConfig:${config.id}:${createdBy}:${auditDetails}:${Date.now()}`
      )
      .digest("hex");

    await db.auditLog.create({
      data: {
        entityType: "CountryConfig",
        entityId: config.id,
        action: "Create",
        performedBy: createdBy,
        details: auditDetails,
        hash: auditHash,
        previousHash: lastAuditLog?.hash || null,
      },
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating country config:", error);
    return NextResponse.json(
      { error: "Failed to create/update country config" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { country, performedBy, ...updateFields } = body as {
      country: string;
      performedBy: string;
      [key: string]: unknown;
    };

    if (!country) {
      return NextResponse.json(
        { error: "country is required" },
        { status: 400 }
      );
    }

    // Build update data, filtering out meta fields
    const updateData: Record<string, unknown> = {};
    const excludedKeys = [
      "country",
      "performedBy",
      "id",
      "createdBy",
      "createdAt",
      "updatedAt",
    ];

    for (const [key, value] of Object.entries(updateFields)) {
      if (!excludedKeys.includes(key) && value !== undefined) {
        if (key === "goLiveDate" && typeof value === "string") {
          updateData[key] = new Date(value);
        } else {
          updateData[key] = value;
        }
      }
    }

    const config = await db.countryConfig.update({
      where: { country },
      data: updateData,
    });

    // Create audit log with hash chain
    const lastAuditLog = await db.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { hash: true },
    });

    const auditDetails = JSON.stringify({
      country,
      changes: updateData,
    });

    const auditHash = createHash("sha256")
      .update(
        `CountryConfig:${config.id}:${performedBy || "system"}:${auditDetails}:${Date.now()}`
      )
      .digest("hex");

    await db.auditLog.create({
      data: {
        entityType: "CountryConfig",
        entityId: config.id,
        action: "Update",
        performedBy: performedBy || "system",
        details: auditDetails,
        hash: auditHash,
        previousHash: lastAuditLog?.hash || null,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error updating country config:", error);
    return NextResponse.json(
      { error: "Failed to update country config" },
      { status: 500 }
    );
  }
}
