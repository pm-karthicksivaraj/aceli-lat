"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceRecorder } from "./VoiceRecorder";
import { NoteEditor } from "./NoteEditor";
import {
  Building2,
  Send,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import type { Lender } from "@/lib/types";

interface MeetingFormProps {
  preselectedLenderId: string | null;
  onMeetingSubmitted: (meetingId: string) => void;
}

export function MeetingForm({ preselectedLenderId, onMeetingSubmitted }: MeetingFormProps) {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [selectedLenderId, setSelectedLenderId] = useState(preselectedLenderId || "");
  const [typedNotes, setTypedNotes] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saving" | "saved" | "unsaved">("saved");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);

  // Sync preselected lender when it changes
  const currentPreselected = useMemo(() => preselectedLenderId, [preselectedLenderId]);
  if (currentPreselected && currentPreselected !== selectedLenderId) {
    setSelectedLenderId(currentPreselected);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/lenders", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (Array.isArray(data)) setLenders(data); })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Auto-save draft — update status via event handler, not directly in effect
  const handleNotesChange = useCallback((value: string) => {
    setTypedNotes(value);
    setAutoSaveStatus("unsaved");
  }, []);

  const handleLenderChange = useCallback((value: string) => {
    setSelectedLenderId(value);
    setAutoSaveStatus("unsaved");
  }, []);

  // Debounced auto-save indicator
  useEffect(() => {
    if (autoSaveStatus !== "unsaved") return;
    const timer = setTimeout(() => {
      setAutoSaveStatus("saving");
      setTimeout(() => setAutoSaveStatus("saved"), 500);
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoSaveStatus]);

  const handleRecordingComplete = useCallback((blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
  }, []);

  const handleSubmit = async () => {
    if (!selectedLenderId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lenderId: selectedLenderId,
          typedNotes,
          duration: audioDuration,
          status: "Submitted",
          syncStatus: "Synced",
        }),
      });

      if (res.ok) {
        const meeting = await res.json();
        onMeetingSubmitted(meeting.id);
      }
    } catch {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLender = lenders.find((l) => l.id === selectedLenderId);

  return (
    <div className="space-y-4">
      {/* Lender Selection */}
      <Card>
        <CardContent className="p-4">
          <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-aceli" />
            Select Lender
          </label>
          <Select
            value={selectedLenderId}
            onValueChange={handleLenderChange}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Choose a lender for this meeting" />
            </SelectTrigger>
            <SelectContent>
              {lenders.map((lender) => (
                <SelectItem key={lender.id} value={lender.id}>
                  {lender.institutionName} — {lender.contactName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedLender && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {selectedLender.country}
              </Badge>
              <Badge className={cn("text-[10px]", 
                selectedLender.relationshipStatus === "Active" ? "bg-green-100 text-green-800" : 
                selectedLender.relationshipStatus === "At-Risk" ? "bg-red-100 text-red-800" :
                "bg-gray-100 text-gray-800"
              )}>
                {selectedLender.relationshipStatus}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Recording */}
      <VoiceRecorder
        onRecordingComplete={handleRecordingComplete}
        onRecordingStart={() => {}}
      />

      {/* Audio Recording Summary */}
      {audioBlob && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-700">
                🎤 Audio recorded ({formatDuration(audioDuration)})
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Note Editor */}
      <NoteEditor
        value={typedNotes}
        onChange={handleNotesChange}
        autoSaveStatus={autoSaveStatus}
      />

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!selectedLenderId || isSubmitting}
          className="flex-1 bg-aceli hover:bg-aceli-dark text-white"
        >
          {isSubmitting ? (
            <>
              <Clock className="h-4 w-4 mr-1.5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-1.5" />
              Submit for AI Processing
            </>
          )}
        </Button>
      </div>

      {!selectedLenderId && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            Please select a lender before submitting your meeting notes.
          </p>
        </div>
      )}
    </div>
  );
}
