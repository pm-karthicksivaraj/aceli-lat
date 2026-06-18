import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { HQCountrySummary } from "@/lib/types";

const COUNTRIES = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"] as const;

export async function GET() {
  try {
    // 1. Lender aggregates by country (counts + average scores)
    const lenderByCountry = await db.lender.groupBy({
      by: ["country"],
      _count: { id: true },
      _avg: {
        commitmentScore: true,
        productScore: true,
        operationalScore: true,
        riskScore: true,
        relationshipScore: true,
        marketScore: true,
      },
    });

    // 2. Active lender counts by country
    const activeByCountry = await db.lender.groupBy({
      by: ["country"],
      where: { relationshipStatus: "Active" },
      _count: { id: true },
    });

    // 3. At-Risk lender counts by country
    const atRiskByCountry = await db.lender.groupBy({
      by: ["country"],
      where: { relationshipStatus: "At-Risk" },
      _count: { id: true },
    });

    // 4. Build lookup maps for cross-referencing
    const allLenders = await db.lender.findMany({
      select: { id: true, country: true },
    });
    const lenderCountryMap: Record<string, string> = {};
    for (const l of allLenders) {
      lenderCountryMap[l.id] = l.country;
    }

    // 5. Meeting -> lender mapping for extraction cross-reference
    const allMeetings = await db.meeting.findMany({
      select: { id: true, lenderId: true },
    });
    const meetingLenderMap: Record<string, string> = {};
    for (const m of allMeetings) {
      meetingLenderMap[m.id] = m.lenderId;
    }

    // 6. Pending reviews by country (Pending extractions via meetings -> lenders)
    const pendingExtractions = await db.extraction.findMany({
      where: { reviewStatus: "Pending" },
      select: { meetingId: true },
    });
    const pendingReviewsByCountry: Record<string, number> = {};
    for (const e of pendingExtractions) {
      const lenderId = meetingLenderMap[e.meetingId];
      if (lenderId) {
        const country = lenderCountryMap[lenderId];
        if (country) {
          pendingReviewsByCountry[country] = (pendingReviewsByCountry[country] || 0) + 1;
        }
      }
    }

    // 7. Open exceptions by country
    const openExceptions = await db.exceptionQueue.findMany({
      where: { status: "Open" },
      select: { lenderId: true },
    });
    const openExceptionsByCountry: Record<string, number> = {};
    for (const e of openExceptions) {
      if (e.lenderId) {
        const country = lenderCountryMap[e.lenderId];
        if (country) {
          openExceptionsByCountry[country] = (openExceptionsByCountry[country] || 0) + 1;
        }
      }
    }

    // 8. Pending writebacks by country
    const pendingWritebacks = await db.writeBackQueue.findMany({
      where: { status: "Pending" },
      select: { lenderId: true },
    });
    const pendingWritebacksByCountry: Record<string, number> = {};
    for (const w of pendingWritebacks) {
      const country = lenderCountryMap[w.lenderId];
      if (country) {
        pendingWritebacksByCountry[country] = (pendingWritebacksByCountry[country] || 0) + 1;
      }
    }

    // 9. Build helper maps for quick lookup
    const lenderCountMap: Record<string, number> = {};
    const avgMap: Record<
      string,
      {
        commitmentScore: number | null;
        productScore: number | null;
        operationalScore: number | null;
        riskScore: number | null;
        relationshipScore: number | null;
        marketScore: number | null;
      }
    > = {};
    for (const item of lenderByCountry) {
      lenderCountMap[item.country] = item._count.id;
      avgMap[item.country] = {
        commitmentScore: item._avg.commitmentScore,
        productScore: item._avg.productScore,
        operationalScore: item._avg.operationalScore,
        riskScore: item._avg.riskScore,
        relationshipScore: item._avg.relationshipScore,
        marketScore: item._avg.marketScore,
      };
    }

    const activeMap: Record<string, number> = {};
    for (const item of activeByCountry) {
      activeMap[item.country] = item._count.id;
    }

    const atRiskMap: Record<string, number> = {};
    for (const item of atRiskByCountry) {
      atRiskMap[item.country] = item._count.id;
    }

    // 10. Assemble the final result ensuring all 5 countries are present
    const result: HQCountrySummary[] = COUNTRIES.map((country) => {
      const avg = avgMap[country] ?? {
        commitmentScore: null,
        productScore: null,
        operationalScore: null,
        riskScore: null,
        relationshipScore: null,
        marketScore: null,
      };

      const avgCommitment = avg.commitmentScore ?? 0;
      const avgProduct = avg.productScore ?? 0;
      const avgOperational = avg.operationalScore ?? 0;
      const avgRisk = avg.riskScore ?? 0;
      const avgRelationship = avg.relationshipScore ?? 0;
      const avgMarket = avg.marketScore ?? 0;
      const avgOverall =
        (avgCommitment + avgProduct + avgOperational + avgRisk + avgRelationship + avgMarket) / 6;

      return {
        country,
        lenderCount: lenderCountMap[country] ?? 0,
        avgCommitmentScore: Math.round(avgCommitment * 100) / 100,
        avgProductScore: Math.round(avgProduct * 100) / 100,
        avgOperationalScore: Math.round(avgOperational * 100) / 100,
        avgRiskScore: Math.round(avgRisk * 100) / 100,
        avgRelationshipScore: Math.round(avgRelationship * 100) / 100,
        avgMarketScore: Math.round(avgMarket * 100) / 100,
        avgOverallScore: Math.round(avgOverall * 100) / 100,
        activeLenders: activeMap[country] ?? 0,
        atRiskLenders: atRiskMap[country] ?? 0,
        pendingReviews: pendingReviewsByCountry[country] ?? 0,
        openExceptions: openExceptionsByCountry[country] ?? 0,
        pendingWritebacks: pendingWritebacksByCountry[country] ?? 0,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching HQ summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch HQ summary" },
      { status: 500 }
    );
  }
}
