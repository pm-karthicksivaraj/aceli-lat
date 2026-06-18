"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Mic,
  Clock,
  FileText,
} from "lucide-react";
import { cn, timeAgo, formatScore, getScoreColor, getScoreBgColor } from "@/lib/utils";
import {
  STATUS_COLORS,
  COUNTRY_FLAGS,
  ACTIVATION_AREA_LABELS,
  ACTIVATION_AREA_ICONS,
  type Lender,
  type Meeting,
  type Activity,
  type ActivationArea,
} from "@/lib/types";

interface LenderCardProps {
  lenderId: string;
  onBack: () => void;
  onNewMeeting: (lenderId: string) => void;
}

const SCORE_MAP: { key: keyof Pick<Lender, "commitmentScore" | "productScore" | "operationalScore" | "riskScore" | "relationshipScore" | "marketScore">; area: ActivationArea }[] = [
  { key: "commitmentScore", area: "commitment" },
  { key: "productScore", area: "product" },
  { key: "operationalScore", area: "operational" },
  { key: "riskScore", area: "risk" },
  { key: "relationshipScore", area: "relationship" },
  { key: "marketScore", area: "market" },
];

export function LenderCard({ lenderId, onBack, onNewMeeting }: LenderCardProps) {
  const [lender, setLender] = useState<Lender | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/lenders/${lenderId}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setLender(data);
          setMeetings(data.meetings || []);
          setActivities(data.activities || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [lenderId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lender) return null;

  const avgScore =
    (lender.commitmentScore +
      lender.productScore +
      lender.operationalScore +
      lender.riskScore +
      lender.relationshipScore +
      lender.marketScore) /
    6;

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Search
      </Button>

      {/* Lender Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-aceli" />
                <h2 className="font-bold text-lg text-foreground">{lender.institutionName}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{lender.contactName}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {COUNTRY_FLAGS[lender.country as keyof typeof COUNTRY_FLAGS]} {lender.country}
                </span>
                {lender.lastContactDate && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last: {timeAgo(lender.lastContactDate)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={cn("text-xs", STATUS_COLORS[lender.relationshipStatus as keyof typeof STATUS_COLORS])}>
                {lender.relationshipStatus}
              </Badge>
              <div className="text-center">
                <p className={cn("text-xl font-bold", getScoreColor(avgScore))}>
                  {formatScore(avgScore)}
                </p>
                <p className="text-[10px] text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-aceli hover:bg-aceli-dark text-white"
              onClick={() => onNewMeeting(lender.id)}
            >
              <Mic className="h-3.5 w-3.5 mr-1.5" />
              New Meeting
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activation Scores */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm text-foreground mb-3">
            Activation Areas
          </h3>
          <div className="space-y-3">
            {SCORE_MAP.map(({ key, area }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground flex items-center gap-1.5">
                    <span>{ACTIVATION_AREA_ICONS[area]}</span>
                    {ACTIVATION_AREA_LABELS[area]}
                  </span>
                  <span className={cn("text-xs font-medium", getScoreColor(lender[key]))}>
                    {formatScore(lender[key])}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={lender[key] * 100} className="h-2 flex-1" />
                  <div className={cn("h-2 w-2 rounded-full", getScoreBgColor(lender[key]))} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm text-foreground mb-3">Activity Timeline</h3>
          <ScrollArea className="max-h-60">
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-2">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-aceli mt-1.5" />
                      {index < activities.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs text-foreground">{activity.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {timeAgo(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Meetings */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm text-foreground mb-3">Meetings</h3>
          <div className="space-y-2">
            {meetings.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No meetings recorded
              </p>
            ) : (
              meetings.slice(0, 5).map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {new Date(meeting.meetingDate).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {meeting.duration > 0 ? `${Math.round(meeting.duration / 60)} min` : "Draft"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      meeting.status === "Approved"
                        ? "border-green-500 text-green-600"
                        : meeting.status === "Processing"
                        ? "border-amber-500 text-amber-600"
                        : "border-gray-300 text-gray-600"
                    )}
                  >
                    {meeting.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
