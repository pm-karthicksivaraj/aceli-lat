"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { ReviewActions } from "./ReviewActions";
import {
  Brain,
  Building2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ACTIVATION_AREA_LABELS,
  ACTIVATION_AREA_ICONS,
  type Extraction,
  type ReviewStatus,
} from "@/lib/types";

interface ExtractionReviewProps {
  initialFilter?: string;
}

export function ExtractionReview({ initialFilter }: ExtractionReviewProps) {
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter || "all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

    fetch(`/api/extractions?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setExtractions(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [statusFilter]);

  const refreshExtractions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

    fetch(`/api/extractions?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setExtractions(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleAction = async (extractionId: string, action: ReviewStatus, notes?: string) => {
    setProcessingId(extractionId);
    try {
      const res = await fetch(`/api/extractions/${extractionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewStatus: action,
          reviewerNotes: notes || null,
          reviewedBy: "field_officer",
        }),
      });

      if (res.ok) {
        setExtractions((prev) =>
          prev.map((e) =>
            e.id === extractionId
              ? {
                  ...e,
                  reviewStatus: action,
                  reviewerNotes: notes || e.reviewerNotes,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: "field_officer",
                }
              : e
          )
        );
      }
    } catch {
      // Error
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = extractions.filter((e) => e.reviewStatus === "Pending").length;
  const approvedCount = extractions.filter((e) => e.reviewStatus === "Approved").length;
  const escalatedCount = extractions.filter((e) => e.reviewStatus === "Escalated").length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className={cn("cursor-pointer", statusFilter === "Pending" && "ring-2 ring-aceli/30")}
          onClick={() => setStatusFilter(statusFilter === "Pending" ? "all" : "Pending")}>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer", statusFilter === "Approved" && "ring-2 ring-aceli/30")}
          onClick={() => setStatusFilter(statusFilter === "Approved" ? "all" : "Approved")}>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-green-600">{approvedCount}</p>
            <p className="text-[10px] text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer", statusFilter === "Escalated" && "ring-2 ring-aceli/30")}
          onClick={() => setStatusFilter(statusFilter === "Escalated" ? "all" : "Escalated")}>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-red-600">{escalatedCount}</p>
            <p className="text-[10px] text-muted-foreground">Escalated</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={refreshExtractions}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Extraction Cards */}
      <ScrollArea className="max-h-[calc(100vh-360px)]">
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))
          ) : extractions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No extractions to review</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Submit a meeting for AI processing to generate extractions
                </p>
              </CardContent>
            </Card>
          ) : (
            extractions.map((extraction) => {
              const isExpanded = expandedId === extraction.id;
              const areaLabel = ACTIVATION_AREA_LABELS[extraction.activationArea as keyof typeof ACTIVATION_AREA_LABELS];
              const areaIcon = ACTIVATION_AREA_ICONS[extraction.activationArea as keyof typeof ACTIVATION_AREA_ICONS];

              return (
                <Card
                  key={extraction.id}
                  className={cn(
                    "transition-all",
                    extraction.reviewStatus === "Pending" && "border-l-4 border-l-amber-400",
                    extraction.reviewStatus === "Approved" && "border-l-4 border-l-green-400",
                    extraction.reviewStatus === "Rejected" && "border-l-4 border-l-red-400",
                    extraction.reviewStatus === "Escalated" && "border-l-4 border-l-red-500"
                  )}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : extraction.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{areaIcon}</span>
                          <span className="text-xs font-medium text-aceli">{areaLabel}</span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1">
                            {extraction.fieldName}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                          {extraction.extractedValue}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                        <ConfidenceBadge score={extraction.confidenceScore} />
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border">
                        {extraction.meeting && (
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {extraction.meeting.lender?.institutionName || "Unknown lender"}
                            </span>
                          </div>
                        )}

                        <div className="mb-3">
                          <p className="text-xs text-foreground whitespace-pre-wrap">
                            {extraction.extractedValue}
                          </p>
                        </div>

                        {extraction.reviewerNotes && (
                          <div className="mb-3 p-2 bg-muted rounded text-xs text-muted-foreground">
                            <span className="font-medium">Notes:</span> {extraction.reviewerNotes}
                          </div>
                        )}

                        <Separator className="my-2" />

                        <ReviewActions
                          currentStatus={extraction.reviewStatus as ReviewStatus}
                          onAction={(action, notes) => handleAction(extraction.id, action, notes)}
                          disabled={processingId === extraction.id}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
