"use client";

import { Building2, AlertTriangle, Brain, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HQCountrySummary } from "@/lib/types";

interface CountryActivationCardProps {
  summary: HQCountrySummary;
}

const COUNTRY_FLAG_MAP: Record<string, string> = {
  Kenya: "🇰🇪",
  Uganda: "🇺🇬",
  Tanzania: "🇹🇿",
  Ethiopia: "🇪🇹",
  Nigeria: "🇳🇬",
};

function getScoreColor(score: number): string {
  if (score > 70) return "bg-green-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function getScoreTextColor(score: number): string {
  if (score > 70) return "text-green-700";
  if (score >= 40) return "text-amber-700";
  return "text-red-700";
}

function getOverallBarColor(score: number): string {
  if (score > 70) return "bg-green-500";
  if (score >= 40) return "bg-aceli";
  return "bg-red-500";
}

const MINI_SCORES: { key: keyof HQCountrySummary; label: string }[] = [
  { key: "avgCommitmentScore", label: "Commitment" },
  { key: "avgProductScore", label: "Product" },
  { key: "avgOperationalScore", label: "Operational" },
  { key: "avgRiskScore", label: "Risk" },
  { key: "avgRelationshipScore", label: "Relationship" },
  { key: "avgMarketScore", label: "Market" },
];

export function CountryActivationCard({ summary }: CountryActivationCardProps) {
  const flag = COUNTRY_FLAG_MAP[summary.country] || "🌍";
  const overallScore = summary.avgOverallScore;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header: Country name + flag + lender count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{flag}</span>
            <div>
              <h3 className="text-sm font-semibold text-aceli-navy leading-tight">
                {summary.country}
              </h3>
              <p className="text-xs text-muted-foreground">
                {summary.lenderCount} lender{summary.lenderCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="size-3.5 text-muted-foreground" />
            <span
              className={cn("text-sm font-bold tabular-nums", getScoreTextColor(overallScore))}
            >
              {overallScore.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Overall score bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Overall Score
            </span>
            <span className={cn("text-xs font-semibold tabular-nums", getScoreTextColor(overallScore))}>
              {overallScore.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", getOverallBarColor(overallScore))}
              style={{ width: `${Math.min(overallScore, 100)}%` }}
            />
          </div>
        </div>

        {/* Mini score bars */}
        <div className="space-y-1.5">
          {MINI_SCORES.map(({ key, label }) => {
            const val = summary[key] as number;
            return (
              <div key={key} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                  <span
                    className={cn("text-[10px] font-medium tabular-nums", getScoreTextColor(val))}
                  >
                    {val.toFixed(0)}
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", getScoreColor(val))}
                    style={{ width: `${Math.min(val, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Badge counts */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
          <Badge variant="secondary" className="text-[10px] h-5 gap-0.5 px-1.5">
            <Building2 className="size-2.5 text-green-600" />
            {summary.activeLenders} active
          </Badge>
          <Badge variant="secondary" className="text-[10px] h-5 gap-0.5 px-1.5">
            <AlertTriangle className="size-2.5 text-red-500" />
            {summary.atRiskLenders} at-risk
          </Badge>
          <Badge variant="secondary" className="text-[10px] h-5 gap-0.5 px-1.5">
            <Brain className="size-2.5 text-amber-600" />
            {summary.pendingReviews} reviews
          </Badge>
          {summary.openExceptions > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5 gap-0.5 px-1.5">
              <AlertTriangle className="size-2.5 text-orange-600" />
              {summary.openExceptions} exceptions
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
