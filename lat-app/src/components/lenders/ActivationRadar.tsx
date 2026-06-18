"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ACTIVATION_AREA_LABELS, ACTIVATION_AREA_ICONS, type ActivationArea, type Lender } from "@/lib/types";
import { cn, getScoreColor } from "@/lib/utils";

interface ActivationRadarProps {
  lender: Pick<Lender, "commitmentScore" | "productScore" | "operationalScore" | "riskScore" | "relationshipScore" | "marketScore">;
}

const SCORE_MAP: { key: keyof ActivationRadarProps["lender"]; area: ActivationArea }[] = [
  { key: "commitmentScore", area: "commitment" },
  { key: "productScore", area: "product" },
  { key: "operationalScore", area: "operational" },
  { key: "riskScore", area: "risk" },
  { key: "relationshipScore", area: "relationship" },
  { key: "marketScore", area: "market" },
];

export function ActivationRadar({ lender }: ActivationRadarProps) {
  const scores = SCORE_MAP.map(({ key, area }) => ({
    area,
    label: ACTIVATION_AREA_LABELS[area],
    icon: ACTIVATION_AREA_ICONS[area],
    score: lender[key],
  }));

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm text-foreground mb-4">Activation Profile</h3>
        {/* Hexagonal-style visual representation */}
        <div className="grid grid-cols-3 gap-3">
          {scores.map(({ area, label, icon, score }) => (
            <div
              key={area}
              className="flex flex-col items-center p-3 rounded-lg bg-muted/50 border border-border"
            >
              <span className="text-lg mb-1">{icon}</span>
              <p className="text-[10px] text-muted-foreground text-center mb-2">{label}</p>
              <p className={cn("text-lg font-bold", getScoreColor(score))}>
                {Math.round(score * 100)}
              </p>
              <div className="w-full bg-muted rounded-full h-1 mt-1">
                <div
                  className={cn(
                    "h-1 rounded-full transition-all",
                    score >= 0.8
                      ? "bg-green-500"
                      : score >= 0.6
                      ? "bg-amber-500"
                      : score >= 0.4
                      ? "bg-orange-500"
                      : "bg-red-400"
                  )}
                  style={{ width: `${score * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
