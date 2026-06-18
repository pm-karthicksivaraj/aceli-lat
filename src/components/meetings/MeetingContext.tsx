"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface MeetingContextProps {
  lenderId: string | null;
  onStartMeeting: () => void;
}

export function MeetingContext({ lenderId }: MeetingContextProps) {
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-foreground">Pre-Meeting Context</h3>
          </div>
          {lenderId ? (
            <p className="text-xs text-muted-foreground">
              Loading lender context...
            </p>
          ) : (
            <div className="text-center py-4">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Select a lender to begin</p>
              <p className="text-xs text-muted-foreground mt-1">
                Choose from your lender list or search for one
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
