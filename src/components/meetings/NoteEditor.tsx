"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Save } from "lucide-react";

interface NoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  autoSaveStatus: "saving" | "saved" | "unsaved";
}

export function NoteEditor({ value, onChange, autoSaveStatus }: NoteEditorProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-aceli" />
            Meeting Notes
          </Label>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Save className="h-3 w-3" />
            {autoSaveStatus === "saving"
              ? "Saving..."
              : autoSaveStatus === "saved"
              ? "Saved"
              : "Unsaved changes"}
          </span>
        </div>
        <Textarea
          placeholder="Type your meeting notes here... Include details about discussions, decisions, action items, and any relevant information about the lender relationship."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[200px] text-sm resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-muted-foreground">
            {value.length} characters
          </p>
          <p className="text-[10px] text-muted-foreground">
            Auto-saves as draft
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
