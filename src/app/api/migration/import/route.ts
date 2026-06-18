import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";
import type { MigrationResult } from "@/lib/types";

const VALID_COUNTRIES = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];

interface ImportLenderInput {
  institutionName: string;
  contactName: string;
  country: string;
  commitmentScore?: number;
  productScore?: number;
  operationalScore?: number;
  riskScore?: number;
  relationshipScore?: number;
  marketScore?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lenders, performedBy } = body as {
      lenders: ImportLenderInput[];
      performedBy: string;
    };

    if (!lenders || !Array.isArray(lenders) || !performedBy) {
      return NextResponse.json(
        { error: "lenders array and performedBy are required" },
        { status: 400 }
      );
    }

    const result: MigrationResult = {
      success: true,
      lendersImported: 0,
      lendersSkipped: 0,
      meetingsImported: 0,
      errors: [],
    };

    // Get previous audit log hash for chain integrity
    const lastAuditLog = await db.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { hash: true },
    });
    let previousHash = lastAuditLog?.hash || null;

    for (let i = 0; i < lenders.length; i++) {
      const lenderInput = lenders[i];

      // Validate: institutionName is required
      if (
        !lenderInput.institutionName ||
        lenderInput.institutionName.trim() === ""
      ) {
        result.lendersSkipped++;
        result.errors.push(
          `Row ${i + 1}: institutionName is required`
        );
        continue;
      }

      // Validate: country must be one of the 5 valid countries
      if (
        !lenderInput.country ||
        !VALID_COUNTRIES.includes(lenderInput.country)
      ) {
        result.lendersSkipped++;
        result.errors.push(
          `Row ${i + 1} (${lenderInput.institutionName}): country must be one of ${VALID_COUNTRIES.join(", ")}`
        );
        continue;
      }

      // Check for duplicates by institutionName + country
      const existingLender = await db.lender.findFirst({
        where: {
          institutionName: lenderInput.institutionName,
          country: lenderInput.country,
        },
      });

      if (existingLender) {
        result.lendersSkipped++;
        result.errors.push(
          `Row ${i + 1} (${lenderInput.institutionName}): duplicate lender already exists in ${lenderInput.country}`
        );
        continue;
      }

      try {
        // Create the Lender record
        const newLender = await db.lender.create({
          data: {
            institutionName: lenderInput.institutionName,
            contactName: lenderInput.contactName || "",
            country: lenderInput.country,
            commitmentScore: lenderInput.commitmentScore ?? 0,
            productScore: lenderInput.productScore ?? 0,
            operationalScore: lenderInput.operationalScore ?? 0,
            riskScore: lenderInput.riskScore ?? 0,
            relationshipScore: lenderInput.relationshipScore ?? 0,
            marketScore: lenderInput.marketScore ?? 0,
          },
        });

        result.lendersImported++;

        // Create audit log entry for this import
        const auditDetails = JSON.stringify({
          institutionName: newLender.institutionName,
          country: newLender.country,
          importedBy: performedBy,
          source: "GoogleSheets",
        });

        const auditHash = createHash("sha256")
          .update(
            `Lender:Import:${newLender.id}:${performedBy}:${auditDetails}:${Date.now()}`
          )
          .digest("hex");

        await db.auditLog.create({
          data: {
            entityType: "Lender",
            entityId: newLender.id,
            action: "Create",
            performedBy,
            details: auditDetails,
            correlationId: `migration-${Date.now()}`,
            hash: auditHash,
            previousHash,
          },
        });

        // Update previous hash for chain integrity
        previousHash = auditHash;
      } catch (createError) {
        result.lendersSkipped++;
        result.errors.push(
          `Row ${i + 1} (${lenderInput.institutionName}): failed to create - ${createError instanceof Error ? createError.message : "Unknown error"}`
        );
      }
    }

    // Mark overall success as false if there were any errors
    if (result.errors.length > 0 && result.lendersImported === 0) {
      result.success = false;
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error importing lenders:", error);
    return NextResponse.json(
      {
        success: false,
        lendersImported: 0,
        lendersSkipped: 0,
        meetingsImported: 0,
        errors: [
          `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      } satisfies MigrationResult,
      { status: 500 }
    );
  }
}
