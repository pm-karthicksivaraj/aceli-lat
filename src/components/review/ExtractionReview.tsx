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
  AlertTriangle,
  Cloud,
  MessageSquare,
  CheckCheck,
  XSquare,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ACTIVATION_AREA_LABELS,
  ACTIVATION_AREA_ICONS,
  type Extraction,
  type ReviewStatus,
  type ExceptionQueue,
} from "@/lib/types";

// Salesforce field mapping for write-back preview
const SF_FIELD_MAP: Record<string, { object: string; field: string }> = {
  commitment: { object: "Account", field: "Commitment_Score__c" },
  product: { object: "Account", field: "Product_Alignment_Score__c" },
  operational: { object: "Account", field: "Operational_Capacity_Score__c" },
  risk: { object: "Account", field: "Risk_Appetite_Score__c" },
  relationship: { object: "Account", field: "Relationship_Health_Score__c" },
  market: { object: "Account", field: "Market_Position_Score__c" },
};

interface ExtractionReviewProps {
  initialFilter?: string;
}

export function ExtractionReview({ initialFilter }: ExtractionReviewProps) {
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter || "all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDialog, setBatchDialog] = useState<"approve" | "reject" | null>(null);
  const [writeBackPreview, setWriteBackPreview] = useState<{
    extractionId: string;
    targetSystem: string;
    targetObject: string;
    targetField: string;
    proposedValue: string;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

    Promise.all([
      fetch(`/api/extractions?${params.toString()}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setExtractions(data);
        })
        .catch(() => {}),
      fetch(`/api/exceptions?status=Open`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setExceptions(data);
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));

    return () => controller.abort();
  }, [statusFilter]);

  const refreshExtractions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

    Promise.all([
      fetch(`/api/extractions?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setExtractions(data);
        })
        .catch(() => {}),
      fetch(`/api/exceptions?status=Open`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setExceptions(data);
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [statusFilter]);

  const handleAction = async (extractionId: string, action: ReviewStatus, notes?: string) => {
    setProcessingId(extractionId);

    // Show write-back preview when approving high-confidence extraction
    if (action === "Approved") {
      const extraction = extractions.find((e) => e.id === extractionId);
      if (extraction && extraction.confidenceScore > 0.70) {
        const sfMap = SF_FIELD_MAP[extraction.activationArea] || { object: "Account", field: "Notes__c" };
        setWriteBackPreview({
          extractionId,
          targetSystem: "Salesforce",
          targetObject: sfMap.object,
          targetField: sfMap.field,
          proposedValue: extraction.extractedValue,
        });
      }
    }

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
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(extractionId);
          return next;
        });
      }
    } catch {
      // Error
    } finally {
      setProcessingId(null);
    }
  };

  const handleBatchAction = async (action: "approve" | "reject") => {
    const reviewAction: ReviewStatus = action === "approve" ? "Approved" : "Rejected";
    const ids = Array.from(selectedIds);

    for (const id of ids) {
      try {
        await fetch(`/api/extractions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewStatus: reviewAction,
            reviewedBy: "field_officer",
          }),
        });
      } catch {
        // Error
      }
    }

    setExtractions((prev) =>
      prev.map((e) =>
        selectedIds.has(e.id)
          ? { ...e, reviewStatus: reviewAction, reviewedAt: new Date().toISOString(), reviewedBy: "field_officer" }
          : e
      )
    );
    setSelectedIds(new Set());
    setBatchDialog(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getExceptionsForExtraction = (extractionId: string) => {
    return exceptions.filter((e) => e.extractionId === extractionId);
  };

  const pendingCount = extractions.filter((e) => e.reviewStatus === "Pending").length;
  const approvedCount = extractions.filter((e) => e.reviewStatus === "Approved").length;
  const escalatedCount = extractions.filter((e) => e.reviewStatus === "Escalated" || e.reviewStatus === "FollowUp").length;

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
        <Card className={cn("cursor-pointer", (statusFilter === "Escalated" || statusFilter === "FollowUp") && "ring-2 ring-aceli/30")}
          onClick={() => setStatusFilter(statusFilter === "Escalated" ? "all" : "Escalated")}>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-red-600">{escalatedCount}</p>
            <p className="text-[10px] text-muted-foreground">Escalated/Follow-up</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Batch Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Escalated">Escalated</SelectItem>
              <SelectItem value="FollowUp">Follow-up</SelectItem>
            </SelectContent>
          </Select>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px] h-6">
                {selectedIds.size} selected
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => setBatchDialog("approve")}
              >
                <CheckCheck className="h-3 w-3 mr-0.5" />
                Approve All
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => setBatchDialog("reject")}
              >
                <XSquare className="h-3 w-3 mr-0.5" />
                Reject All
              </Button>
            </div>
          )}
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
              const linkedExceptions = getExceptionsForExtraction(extraction.id);
              const isSelected = selectedIds.has(extraction.id);

              return (
                <Card
                  key={extraction.id}
                  className={cn(
                    "transition-all",
                    extraction.reviewStatus === "Pending" && "border-l-4 border-l-amber-400",
                    extraction.reviewStatus === "Approved" && "border-l-4 border-l-green-400",
                    extraction.reviewStatus === "Rejected" && "border-l-4 border-l-red-400",
                    extraction.reviewStatus === "Escalated" && "border-l-4 border-l-red-500",
                    extraction.reviewStatus === "FollowUp" && "border-l-4 border-l-blue-400",
                    isSelected && "ring-2 ring-aceli/30"
                  )}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : extraction.id)}
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {/* Checkbox for batch selection */}
                        {extraction.reviewStatus === "Pending" && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(extraction.id)}
                            className="mt-1.5 h-3.5 w-3.5 rounded border-muted-foreground/30 text-aceli focus:ring-aceli/30"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm">{areaIcon}</span>
                            <span className="text-xs font-medium text-aceli">{areaLabel}</span>
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                              {extraction.fieldName}
                            </Badge>
                            {linkedExceptions.length > 0 && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1 bg-red-50 text-red-700 border-red-200">
                                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                {linkedExceptions.length} exception{linkedExceptions.length > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                            {extraction.extractedValue}
                          </p>
                        </div>
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

                        {/* Write-back preview */}
                        {extraction.reviewStatus === "Pending" && extraction.confidenceScore > 0.70 && (
                          <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Cloud className="h-3 w-3 text-blue-600" />
                              <span className="text-[10px] font-medium text-blue-800">Write-back Preview</span>
                            </div>
                            <p className="text-[10px] text-blue-700">
                              If approved, this will be queued for Salesforce:
                              <code className="ml-1 bg-blue-100 px-1 rounded">
                                {SF_FIELD_MAP[extraction.activationArea]?.object || "Account"}.{SF_FIELD_MAP[extraction.activationArea]?.field || "Notes__c"}
                              </code>
                            </p>
                          </div>
                        )}

                        {/* Linked exceptions */}
                        {linkedExceptions.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                              <span className="text-[10px] font-medium text-red-700">Linked Exceptions</span>
                            </div>
                            {linkedExceptions.map((exc) => (
                              <div key={exc.id} className="p-2 bg-red-50 rounded text-xs text-red-800 mb-1">
                                <span className="font-medium">{exc.exceptionType}</span>: {exc.description}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Prompt history link */}
                        {extraction.meetingId && (
                          <div className="mb-3 flex items-center gap-1.5">
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              AI prompt history available for this meeting
                            </span>
                          </div>
                        )}

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

      {/* Batch Action Confirmation Dialog */}
      <Dialog open={!!batchDialog} onOpenChange={() => setBatchDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {batchDialog === "approve" ? "Approve Selected" : "Reject Selected"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {batchDialog === "approve"
              ? `This will approve ${selectedIds.size} extraction(s). High-confidence extractions will automatically be queued for Salesforce write-back.`
              : `This will reject ${selectedIds.size} extraction(s). Exception entries will be created for each rejected extraction.`}
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBatchDialog(null)}>
              Cancel
            </Button>
            {batchDialog === "approve" ? (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleBatchAction("approve")}
              >
                Confirm Approve
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBatchAction("reject")}
              >
                Confirm Reject
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Write-back Preview Dialog */}
      <Dialog open={!!writeBackPreview} onOpenChange={() => setWriteBackPreview(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Write-back Queued</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              This extraction has been approved and queued for Salesforce write-back.
            </p>
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <p className="text-muted-foreground">Target System</p>
                  <p className="font-medium text-foreground">{writeBackPreview?.targetSystem}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Object</p>
                  <p className="font-medium text-foreground">{writeBackPreview?.targetObject}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Field</p>
                  <p className="font-medium text-foreground">{writeBackPreview?.targetField}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Proposed Value</p>
                  <p className="font-medium text-foreground truncate" title={writeBackPreview?.proposedValue}>
                    {writeBackPreview?.proposedValue}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-amber-600">
              ⚠️ Write-back will not execute automatically. Go to the Write-back view to approve and execute.
            </p>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setWriteBackPreview(null)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
