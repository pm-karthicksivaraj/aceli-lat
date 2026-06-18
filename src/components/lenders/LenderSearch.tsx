"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Building2, MapPin, ChevronRight, Clock } from "lucide-react";
import { cn, timeAgo, formatScore, getScoreColor } from "@/lib/utils";
import {
  STATUS_COLORS,
  COUNTRY_FLAGS,
  ACTIVATION_AREA_LABELS,
  type Lender,
  type Country,
  type ActivationArea,
} from "@/lib/types";
import { LenderCard } from "./LenderCard";

interface LenderSearchProps {
  selectedCountry: Country | null;
  onNewMeeting: (lenderId: string) => void;
}

const SCORE_AREAS: { key: keyof Pick<Lender, "commitmentScore" | "productScore" | "operationalScore" | "riskScore" | "relationshipScore" | "marketScore">; area: ActivationArea }[] = [
  { key: "commitmentScore", area: "commitment" },
  { key: "productScore", area: "product" },
  { key: "operationalScore", area: "operational" },
  { key: "riskScore", area: "risk" },
  { key: "relationshipScore", area: "relationship" },
  { key: "marketScore", area: "market" },
];

export function LenderSearch({ selectedCountry, onNewMeeting }: LenderSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLenderId, setSelectedLenderId] = useState<string | null>(null);

  const fetchLenders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (selectedCountry) params.set("country", selectedCountry);

      const res = await fetch(`/api/lenders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLenders(data);
      }
    } catch {
      // Offline or error
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCountry]);

  useEffect(() => {
    const debounce = setTimeout(fetchLenders, 300);
    return () => clearTimeout(debounce);
  }, [fetchLenders]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search lenders by name or institution..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Results or Lender Profile */}
      {selectedLenderId ? (
        <LenderCard
          lenderId={selectedLenderId}
          onBack={() => setSelectedLenderId(null)}
          onNewMeeting={onNewMeeting}
        />
      ) : (
        <ScrollArea className="max-h-[calc(100vh-280px)]">
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-16 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))
            ) : lenders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No lenders found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try adjusting your search or country filter
                  </p>
                </CardContent>
              </Card>
            ) : (
              lenders.map((lender) => {
                const avgScore =
                  (lender.commitmentScore +
                    lender.productScore +
                    lender.operationalScore +
                    lender.riskScore +
                    lender.relationshipScore +
                    lender.marketScore) /
                  6;

                return (
                  <Card
                    key={lender.id}
                    className="cursor-pointer hover:shadow-md transition-all hover:border-aceli/30"
                    onClick={() => setSelectedLenderId(lender.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-4 w-4 text-aceli shrink-0" />
                            <h3 className="font-semibold text-sm text-foreground truncate">
                              {lender.institutionName}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {COUNTRY_FLAGS[lender.country as Country]} {lender.country}
                            </span>
                            {lender.lastContactDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeAgo(lender.lastContactDate)}
                              </span>
                            )}
                          </div>
                          {/* Mini activation bar */}
                          <div className="flex gap-0.5 h-1.5">
                            {SCORE_AREAS.map(({ key }) => (
                              <div
                                key={key}
                                className={cn(
                                  "flex-1 rounded-full",
                                  lender[key] >= 0.8
                                    ? "bg-green-500"
                                    : lender[key] >= 0.6
                                    ? "bg-amber-500"
                                    : lender[key] >= 0.4
                                    ? "bg-orange-500"
                                    : "bg-red-400"
                                )}
                                title={`${ACTIVATION_AREA_LABELS[SCORE_AREAS.find(s => s.key === key)!.area]}: ${formatScore(lender[key])}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Badge className={cn("text-[10px]", STATUS_COLORS[lender.relationshipStatus as keyof typeof STATUS_COLORS])}>
                            {lender.relationshipStatus}
                          </Badge>
                          <span className={cn("text-xs font-medium", getScoreColor(avgScore))}>
                            {formatScore(avgScore)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
