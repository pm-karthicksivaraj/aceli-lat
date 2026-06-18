import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { KPI_METRIC_LABELS } from "@/lib/types";
import type { KPIDashboardData, KPIMetricName } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");

    const baselineWhere: Record<string, unknown> = {};
    if (country) baselineWhere.country = country;

    // Fetch all matching baselines with their measurements
    const baselines = await db.kPIBaseline.findMany({
      where: baselineWhere,
      include: {
        measurements: {
          orderBy: { measurementDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by (metricName, country) to produce one dashboard entry per group
    const grouped = new Map<string, typeof baselines>();

    for (const baseline of baselines) {
      const key = `${baseline.metricName}:${baseline.country}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(baseline);
    }

    const result: KPIDashboardData[] = [];

    for (const [, group] of grouped) {
      // Use the most recent baseline as the representative
      const primary = group[0];
      const metricName = primary.metricName as KPIMetricName;

      // Baseline value: average of all baselines for this metric/country
      const baselineValue =
        group.reduce((sum, b) => sum + b.baselineValue, 0) / group.length;

      // Collect all measurements across all baselines in this group
      const allMeasurements = group.flatMap((b) =>
        b.measurements.map((m) => ({
          period: m.period,
          value: m.measuredValue,
          measurementDate: m.measurementDate,
        }))
      );

      // Sort measurements by date descending to find latest
      allMeasurements.sort(
        (a, b) =>
          new Date(b.measurementDate).getTime() -
          new Date(a.measurementDate).getTime()
      );

      // Latest measurement is the current value
      const latestMeasurement = allMeasurements[0];
      const currentValue = latestMeasurement?.value ?? baselineValue;
      const latestPeriod = latestMeasurement?.period ?? "";

      // Compute change percent
      const changePercent =
        baselineValue !== 0
          ? Math.round(
              ((currentValue - baselineValue) / baselineValue) * 10000
            ) / 100
          : 0;

      // Determine trend direction
      let trend: "improving" | "stable" | "declining" = "stable";
      if (Math.abs(changePercent) > 2) {
        // For metrics where lower is better (like ReconciliationTime),
        // a negative change is improving
        const lowerIsBetterMetrics: KPIMetricName[] = [
          "ReconciliationTime",
        ];
        const lowerIsBetter = lowerIsBetterMetrics.includes(metricName);

        if (lowerIsBetter) {
          trend = changePercent < 0 ? "improving" : "declining";
        } else {
          trend = changePercent > 0 ? "improving" : "declining";
        }
      }

      // Sparkline data: measurements sorted by date ascending
      const sparklineData = [...allMeasurements]
        .sort(
          (a, b) =>
            new Date(a.measurementDate).getTime() -
            new Date(b.measurementDate).getTime()
        )
        .map((m) => ({ period: m.period, value: m.value }));

      result.push({
        metricName,
        metricLabel: KPI_METRIC_LABELS[metricName] || metricName,
        country: primary.country,
        baselineValue: Math.round(baselineValue * 100) / 100,
        currentValue: Math.round(currentValue * 100) / 100,
        changePercent,
        measurementUnit: primary.measurementUnit,
        period: latestPeriod,
        trend,
        measurements: sparklineData,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching KPI dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPI dashboard" },
      { status: 500 }
    );
  }
}
