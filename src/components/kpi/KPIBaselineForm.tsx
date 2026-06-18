"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KPIMetricName, Country } from "@/lib/types";
import { KPI_METRIC_LABELS, COUNTRY_FLAGS } from "@/lib/types";

const COUNTRIES: Country[] = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];
const KPI_METRICS: KPIMetricName[] = [
  "ReconciliationTime",
  "ActivationGapVisibility",
  "FieldCaptureRate",
  "ReviewThroughput",
  "SyncReliability",
  "UserAdoptionRate",
];

interface KPIBaselineFormProps {
  onCreated?: () => void;
  onCancel?: () => void;
}

export function KPIBaselineForm({ onCreated, onCancel }: KPIBaselineFormProps) {
  const [metricName, setMetricName] = useState<KPIMetricName>("ReconciliationTime");
  const [country, setCountry] = useState<Country>("Kenya");
  const [baselineValue, setBaselineValue] = useState("");
  const [measurementUnit, setMeasurementUnit] = useState("");
  const [measurementDate, setMeasurementDate] = useState("");
  const [methodology, setMethodology] = useState("");
  const [recordedBy, setRecordedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/kpi/baselines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metricName,
          country,
          baselineValue: parseFloat(baselineValue),
          measurementUnit,
          measurementDate: measurementDate || new Date().toISOString(),
          methodology,
          recordedBy,
          notes: notes || null,
        }),
      });
      if (res.ok) {
        onCreated?.();
      }
    } catch {
      // Error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Metric Name</Label>
          <Select value={metricName} onValueChange={(v) => setMetricName(v as KPIMetricName)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KPI_METRICS.map((m) => (
                <SelectItem key={m} value={m}>
                  {KPI_METRIC_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Country</Label>
          <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {COUNTRY_FLAGS[c]} {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Baseline Value</Label>
          <Input
            type="number"
            className="h-8 text-xs"
            placeholder="0"
            value={baselineValue}
            onChange={(e) => setBaselineValue(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Measurement Unit</Label>
          <Input
            className="h-8 text-xs"
            placeholder="e.g. hours, %, count"
            value={measurementUnit}
            onChange={(e) => setMeasurementUnit(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Measurement Date</Label>
        <Input
          type="date"
          className="h-8 text-xs"
          value={measurementDate}
          onChange={(e) => setMeasurementDate(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Methodology</Label>
        <Textarea
          className="min-h-[60px] text-xs"
          placeholder="Describe the measurement methodology..."
          value={methodology}
          onChange={(e) => setMethodology(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Recorded By</Label>
        <Input
          className="h-8 text-xs"
          placeholder="Your name"
          value={recordedBy}
          onChange={(e) => setRecordedBy(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Notes (optional)</Label>
        <Textarea
          className="min-h-[60px] text-xs"
          placeholder="Additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || !baselineValue || !measurementUnit || !recordedBy || !methodology}
        >
          {submitting ? "Creating..." : "Create Baseline"}
        </Button>
      </div>
    </div>
  );
}
