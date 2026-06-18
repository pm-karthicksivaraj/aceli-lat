"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, Clock, Check, FileText } from "lucide-react";

interface DraftQueueProps {
  draftCount: number;
}

export function DraftQueue({ draftCount }: DraftQueueProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-aceli" />
            Draft Queue
          </h3>
          <Badge variant="outline" className="text-[10px]">
            {draftCount} drafts
          </Badge>
        </div>
        {draftCount === 0 ? (
          <div className="text-center py-4">
            <Check className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No pending drafts</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">{draftCount} unsaved draft{draftCount > 1 ? "s" : ""}</p>
                <p className="text-[10px] text-muted-foreground">Auto-saved locally</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[10px]">
                <Upload className="h-3 w-3 mr-1" />
                Upload
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
