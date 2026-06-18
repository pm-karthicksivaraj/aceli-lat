"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ClipboardPaste,
  Database,
  FileWarning,
  Loader2,
  Upload,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MigrationResult } from "@/lib/types";

type WizardStep = 1 | 2 | 3 | 4;

const VALID_COUNTRIES = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];

interface ParsedLender {
  institutionName: string;
  contactName: string;
  country: string;
  commitmentScore?: number;
  productScore?: number;
  operationalScore?: number;
  riskScore?: number;
  relationshipScore?: number;
  marketScore?: number;
}

interface ValidationError {
  row: number;
  message: string;
}

export function MigrationWizard() {
  const [step, setStep] = useState<WizardStep>(1);
  const [rawJson, setRawJson] = useState("");
  const [parsedLenders, setParsedLenders] = useState<ParsedLender[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const reset = () => {
    setStep(1);
    setRawJson("");
    setParsedLenders([]);
    setValidationErrors([]);
    setImporting(false);
    setResult(null);
  };

  const handleParse = () => {
    const errors: ValidationError[] = [];
    let parsed: ParsedLender[] = [];

    try {
      const data = JSON.parse(rawJson);
      if (!Array.isArray(data)) {
        errors.push({ row: 0, message: "Input must be a JSON array of lender objects." });
      } else {
        parsed = data;
        // Validate each row
        data.forEach((item: Record<string, unknown>, index: number) => {
          if (!item.institutionName || String(item.institutionName).trim() === "") {
            errors.push({ row: index + 1, message: "institutionName is required." });
          }
          if (!item.country || !VALID_COUNTRIES.includes(String(item.country))) {
            errors.push({
              row: index + 1,
              message: `country must be one of: ${VALID_COUNTRIES.join(", ")}. Got: "${item.country}"`,
            });
          }
          // Validate score ranges if provided
          const scoreFields = [
            "commitmentScore",
            "productScore",
            "operationalScore",
            "riskScore",
            "relationshipScore",
            "marketScore",
          ];
          for (const field of scoreFields) {
            const val = item[field];
            if (val !== undefined && val !== null) {
              const num = Number(val);
              if (isNaN(num) || num < 0 || num > 1) {
                errors.push({
                  row: index + 1,
                  message: `${field} must be a number between 0 and 1. Got: "${val}"`,
                });
              }
            }
          }
        });
      }
    } catch (e) {
      errors.push({
        row: 0,
        message: `Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`,
      });
    }

    setParsedLenders(parsed);
    setValidationErrors(errors);
    setStep(2);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/migration/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lenders: parsedLenders,
          performedBy: "current-user",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const data = await res.json().catch(() => ({}));
        setResult({
          success: false,
          lendersImported: 0,
          lendersSkipped: 0,
          meetingsImported: 0,
          errors: [data.error || "Import failed with an unknown error."],
        });
      }
    } catch {
      setResult({
        success: false,
        lendersImported: 0,
        lendersSkipped: 0,
        meetingsImported: 0,
        errors: ["Network error. Please try again."],
      });
    } finally {
      setImporting(false);
      setStep(4);
    }
  };

  const exampleJson = `[{"institutionName": "Acme Bank", "contactName": "Jane Doe", "country": "Kenya", "commitmentScore": 0.75, "productScore": 0.6}]`;

  return (
    <div className="space-y-4 view-transition">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-aceli" />
          <h2 className="font-bold text-lg text-foreground">Google Sheets Migration</h2>
        </div>
        {step > 1 && (
          <Button variant="outline" size="sm" onClick={reset} className="text-xs">
            Start Over
          </Button>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {([1, 2, 3, 4] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold transition-colors",
                step === s
                  ? "bg-aceli text-white"
                  : step > s
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step > s ? <CheckCircle2 className="h-3.5 w-3.5" /> : s}
            </div>
            {i < 3 && (
              <div
                className={cn(
                  "h-px w-6",
                  step > s ? "bg-green-500" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
        <span className="text-xs text-muted-foreground ml-2">
          {step === 1 && "Paste Data"}
          {step === 2 && "Preview & Validate"}
          {step === 3 && "Confirm Import"}
          {step === 4 && "Results"}
        </span>
      </div>

      {/* Step 1: Paste JSON */}
      {step === 1 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <ClipboardPaste className="h-4 w-4 text-aceli" />
                Paste JSON Data
              </h3>
              <p className="text-xs text-muted-foreground">
                Paste an array of lender objects from your Google Sheets export. Each object should
                have at minimum <code className="bg-muted px-1 rounded text-foreground">institutionName</code>,{" "}
                <code className="bg-muted px-1 rounded text-foreground">contactName</code>, and{" "}
                <code className="bg-muted px-1 rounded text-foreground">country</code>.
              </p>
              <p className="text-xs text-muted-foreground">
                Valid countries: <span className="font-medium">Kenya, Uganda, Tanzania, Ethiopia, Nigeria</span>.
                Scores should be between 0 and 1.
              </p>
            </div>

            <Textarea
              className="min-h-48 text-xs font-mono"
              placeholder={exampleJson}
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setRawJson(exampleJson)}
              >
                Load Example
              </Button>
              <Button
                size="sm"
                className="bg-aceli hover:bg-aceli-dark text-white"
                disabled={!rawJson.trim()}
                onClick={handleParse}
              >
                Parse & Validate
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview & Validate */}
      {step === 2 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Database className="h-4 w-4 text-aceli" />
              Preview Parsed Data
            </h3>

            {/* Count summary */}
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                {parsedLenders.length} lender{parsedLenders.length !== 1 ? "s" : ""} parsed
              </Badge>
              {validationErrors.length > 0 && (
                <Badge variant="destructive" className="text-xs gap-0.5">
                  <FileWarning className="h-3 w-3" />
                  {validationErrors.length} validation error{validationErrors.length !== 1 ? "s" : ""}
                </Badge>
              )}
              {validationErrors.length === 0 && (
                <Badge className="bg-green-100 text-green-800 text-xs gap-0.5">
                  <CheckCircle2 className="h-3 w-3" />
                  All valid
                </Badge>
              )}
            </div>

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1.5">
                <p className="text-xs font-medium text-red-800 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Validation Errors
                </p>
                <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                  {validationErrors.map((err, i) => (
                    <p key={i} className="text-[11px] text-red-700">
                      Row {err.row}: {err.message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Parsed data preview */}
            {parsedLenders.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground">Data Preview</p>
                <div className="max-h-40 overflow-y-auto custom-scrollbar rounded-lg border">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">#</th>
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Institution</th>
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Contact</th>
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedLenders.slice(0, 10).map((l, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                          <td className="px-2 py-1.5 text-foreground">{l.institutionName || "—"}</td>
                          <td className="px-2 py-1.5 text-muted-foreground">{l.contactName || "—"}</td>
                          <td className="px-2 py-1.5">{l.country || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedLenders.length > 10 && (
                    <p className="text-[10px] text-muted-foreground text-center py-1">
                      ... and {parsedLenders.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setStep(1)}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back
              </Button>
              <Button
                size="sm"
                className="bg-aceli hover:bg-aceli-dark text-white"
                disabled={parsedLenders.length === 0 || validationErrors.length > 0}
                onClick={() => setStep(3)}
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm Import */}
      {step === 3 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Upload className="h-4 w-4 text-aceli" />
              Confirm Import
            </h3>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <p className="text-sm text-foreground">
                You are about to import{" "}
                <span className="font-bold text-aceli">{parsedLenders.length}</span> lender
                {parsedLenders.length !== 1 ? "s" : ""} into the system.
              </p>
              <p className="text-xs text-muted-foreground">
                This action will create new lender records. Duplicate lenders (same institution name
                and country) will be skipped.
              </p>
            </div>

            {/* Summary list */}
            <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
              {parsedLenders.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-card border text-xs"
                >
                  <span className="text-foreground font-medium">{l.institutionName}</span>
                  <span className="text-muted-foreground">{l.country}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setStep(2)}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back
              </Button>
              <Button
                size="sm"
                className="bg-aceli hover:bg-aceli-dark text-white"
                disabled={importing}
                onClick={handleImport}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Import {parsedLenders.length} Lender{parsedLenders.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === 4 && result && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Import {result.success ? "Complete" : "Failed"}
            </h3>

            {/* Result stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{result.lendersImported}</p>
                <p className="text-xs text-green-600">Imported</p>
              </div>
              <div className="rounded-lg border bg-amber-50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">{result.lendersSkipped}</p>
                <p className="text-xs text-amber-600">Skipped</p>
              </div>
            </div>

            {result.meetingsImported > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-lg font-bold text-foreground">{result.meetingsImported}</p>
                <p className="text-xs text-muted-foreground">Meetings Imported</p>
              </div>
            )}

            {/* Errors list */}
            {result.errors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Import Issues ({result.errors.length})
                </p>
                <div className="max-h-32 overflow-y-auto custom-scrollbar rounded-lg border border-amber-200 bg-amber-50 p-2 space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-[11px] text-amber-800">
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                className="bg-aceli hover:bg-aceli-dark text-white"
                onClick={reset}
              >
                Import More Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
