"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  X,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import type { ReviewStatus } from "@/lib/types";
import { useState } from "react";

interface ReviewActionsProps {
  currentStatus: ReviewStatus;
  onAction: (action: ReviewStatus, notes?: string) => void;
  disabled?: boolean;
}

export function ReviewActions({ currentStatus, onAction, disabled }: ReviewActionsProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const handleAction = (action: ReviewStatus) => {
    onAction(action, notes || undefined);
    setNotes("");
    setShowNotes(false);
  };

  if (currentStatus === "Approved") {
    return (
      <div className="flex items-center gap-1.5 text-green-600">
        <Check className="h-4 w-4" />
        <span className="text-xs font-medium">Approved</span>
      </div>
    );
  }

  if (currentStatus === "Rejected") {
    return (
      <div className="flex items-center gap-1.5 text-red-600">
        <X className="h-4 w-4" />
        <span className="text-xs font-medium">Rejected</span>
      </div>
    );
  }

  if (currentStatus === "Escalated") {
    return (
      <div className="flex items-center gap-1.5 text-amber-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs font-medium">Escalated</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[10px] border-green-300 text-green-700 hover:bg-green-50"
          onClick={() => handleAction("Approved")}
          disabled={disabled}
        >
          <Check className="h-3 w-3 mr-0.5" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[10px] border-red-300 text-red-700 hover:bg-red-50"
          onClick={() => handleAction("Rejected")}
          disabled={disabled}
        >
          <X className="h-3 w-3 mr-0.5" />
          Reject
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[10px] border-amber-300 text-amber-700 hover:bg-amber-50"
          onClick={() => handleAction("Escalated")}
          disabled={disabled}
        >
          <AlertTriangle className="h-3 w-3 mr-0.5" />
          Escalate
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-[10px]"
          onClick={() => setShowNotes(!showNotes)}
        >
          <MessageSquare className="h-3 w-3" />
        </Button>
      </div>

      {showNotes && (
        <div className="space-y-1.5">
          <Textarea
            placeholder="Add reviewer notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[60px] text-xs"
          />
        </div>
      )}
    </div>
  );
}
