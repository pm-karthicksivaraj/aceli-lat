import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface CountryReadinessResult {
  country: string;
  rolloutStatus: string;
  pilotCountry: boolean;
  goLiveDate: string | null;
  trainingStatus: string;
  dataMigrationStatus: string;
  roleSetupComplete: boolean;
  fieldOfficerCount: number;
  readinessScore: number;
  readinessStatus: string;
  trainingCompletionRate: number;
  totalTrained: number;
  totalTrainees: number;
  activeUsersThisWeek: number;
  totalUsersThisWeek: number;
  adoptionRate: number;
}

function computeReadinessStatus(score: number): string {
  if (score >= 90) return "Ready";
  if (score >= 70) return "NearlyReady";
  if (score >= 50) return "InProgress";
  if (score >= 25) return "EarlyStage";
  return "NotReady";
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");

    // Build where clause for country configs
    const countryWhere: Record<string, unknown> = {};
    if (country) countryWhere.country = country;

    const countryConfigs = await db.countryConfig.findMany({
      where: countryWhere,
      orderBy: { country: "asc" },
    });

    if (countryConfigs.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const countryNames = countryConfigs.map((c) => c.country);

    // Fetch training records for these countries
    const trainingRecords = await db.trainingRecord.findMany({
      where: {
        country: { in: countryNames },
      },
    });

    // Fetch latest weekly active use for these countries
    const weeklyUsage = await db.weeklyActiveUse.findMany({
      where: {
        country: { in: countryNames },
      },
      orderBy: { weekStartDate: "desc" },
    });

    // Group training records by country
    const trainingByCountry = new Map<string, typeof trainingRecords>();
    for (const tr of trainingRecords) {
      const list = trainingByCountry.get(tr.country) ?? [];
      list.push(tr);
      trainingByCountry.set(tr.country, list);
    }

    // Group weekly usage by country (only latest week)
    const latestUsageByCountry = new Map<
      string,
      (typeof weeklyUsage)[0]
    >();
    for (const wu of weeklyUsage) {
      if (!latestUsageByCountry.has(wu.country)) {
        latestUsageByCountry.set(wu.country, wu);
      }
    }

    const results: CountryReadinessResult[] = countryConfigs.map((config) => {
      const trainings = trainingByCountry.get(config.country) ?? [];
      const latestUsage = latestUsageByCountry.get(config.country);

      // Training metrics
      const totalTrainees = trainings.length;
      const completedTrainings = trainings.filter(
        (t) => t.status === "Completed"
      ).length;
      const trainingCompletionRate =
        totalTrainees > 0 ? (completedTrainings / totalTrainees) * 100 : 0;

      // Usage metrics
      const activeUsersThisWeek = latestUsage?.activeUsers ?? 0;
      const totalUsersThisWeek = latestUsage?.totalUsers ?? 0;
      const adoptionRate =
        totalUsersThisWeek > 0
          ? (activeUsersThisWeek / totalUsersThisWeek) * 100
          : 0;

      // Compute readiness score (0-100) based on weighted factors
      let score = 0;

      // Rollout status contribution (0-25)
      const statusScores: Record<string, number> = {
        Active: 25,
        InProgress: 15,
        Pending: 5,
        Suspended: 0,
      };
      score += statusScores[config.rolloutStatus] ?? 0;

      // Data migration status contribution (0-20)
      const migrationScores: Record<string, number> = {
        Completed: 20,
        InProgress: 10,
        Pending: 5,
        Failed: 0,
      };
      score += migrationScores[config.dataMigrationStatus] ?? 0;

      // Training status contribution (0-20)
      const trainingScores: Record<string, number> = {
        Completed: 20,
        InProgress: 10,
        Pending: 5,
      };
      score += trainingScores[config.trainingStatus] ?? 0;

      // Training completion rate contribution (0-15) - scaled
      score += Math.min(trainingCompletionRate * 0.15, 15);

      // Role setup contribution (0-10)
      if (config.roleSetupComplete) score += 10;

      // Adoption rate contribution (0-10) - scaled
      score += Math.min(adoptionRate * 0.1, 10);

      const readinessScore = Math.round(Math.min(score, 100));

      return {
        country: config.country,
        rolloutStatus: config.rolloutStatus,
        pilotCountry: config.pilotCountry,
        goLiveDate: config.goLiveDate?.toISOString() ?? null,
        trainingStatus: config.trainingStatus,
        dataMigrationStatus: config.dataMigrationStatus,
        roleSetupComplete: config.roleSetupComplete,
        fieldOfficerCount: config.fieldOfficerCount,
        readinessScore,
        readinessStatus: computeReadinessStatus(readinessScore),
        trainingCompletionRate: Math.round(trainingCompletionRate * 10) / 10,
        totalTrained: completedTrainings,
        totalTrainees,
        activeUsersThisWeek,
        totalUsersThisWeek,
        adoptionRate: Math.round(adoptionRate * 10) / 10,
      };
    });

    return NextResponse.json({
      data: results,
      pagination: {
        page: 1,
        pageSize: results.length,
        total: results.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error("Error fetching country readiness:", error);
    return NextResponse.json(
      { error: "Failed to fetch country readiness data" },
      { status: 500 }
    );
  }
}
