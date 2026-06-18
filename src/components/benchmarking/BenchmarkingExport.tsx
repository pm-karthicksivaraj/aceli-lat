"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Database,
  Hash,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COUNTRY_FLAGS,
  type Country,
  type BenchmarkingExport,
  type BenchmarkingExportFormat,
} from "@/lib/types";

const COUNTRIES: Country[] = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];

const STATUS_BADGE: Record<string, { color: string; icon: React.ReactNode }> = {
  Completed: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  Pending: {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="h-3 w-3" />,
  },
  Failed: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

export function BenchmarkingExportPanel() {
  const [exports, setExports] = useState<BenchmarkingExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<BenchmarkingExportFormat>("JSON");
  const [exporting, setExporting] = useState(false);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/benchmarking/export")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setExports(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleExport = async () => {
    setExporting(true);
    setPreviewData(null);
    try {
      const body: Record<string, string> = {
        format: selectedFormat,
        triggeredBy: "current-user",
      };
      if (selectedCountry) body.country = selectedCountry;

      const res = await fetch("/api/benchmarking/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        // Show preview of export data
        if (data.data) {
          if (selectedFormat === "JSON") {
            try {
              const parsed = JSON.parse(data.data);
              // Show first 3 records
              const preview = {
                ...parsed,
                records: parsed.records?.slice(0, 3),
                _note: `Showing 3 of ${parsed.recordCount} records`,
              };
              setPreviewData(JSON.stringify(preview, null, 2));
            } catch {
              setPreviewData(data.data.substring(0, 500));
            }
          } else {
            // CSV preview: first 5 lines
            const lines = data.data.split("\n");
            setPreviewData(lines.slice(0, 5).join("\n") + (lines.length > 5 ? "\n..." : ""));
          }
        }
        setRefreshKey((k) => k + 1);
      }
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setPreviewData(null);
    setSelectedCountry("");
    setSelectedFormat("JSON");
  };

  const truncateChecksum = (checksum: string | null) => {
    if (!checksum) return "—";
    return `${checksum.substring(0, 8)}...${checksum.substring(checksum.length - 4)}`;
  };

  return (
    <div className="space-y-4 view-transition">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-aceli" />
          <h2 className="font-bold text-lg text-foreground">Benchmarking Exports</h2>
        </div>
        <Button
          size="sm"
          className="bg-aceli hover:bg-aceli-dark text-white"
          onClick={() => setDialogOpen(true)}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          New Export
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading exports...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && exports.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Database className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No exports yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Generate a benchmarking export to download lender data.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Export history table */}
      {!loading && exports.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[calc(100vh-200px)]">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Date</th>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Country</th>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Format</th>
                      <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Records</th>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Triggered By</th>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Checksum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exports.map((exp) => {
                      const statusInfo = STATUS_BADGE[exp.status] || STATUS_BADGE.Pending;
                      return (
                        <tr
                          key={exp.id}
                          className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-foreground">
                            {new Date(exp.exportDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2.5">
                            {exp.country ? (
                              <span className="flex items-center gap-1">
                                {COUNTRY_FLAGS[exp.country as Country]} {exp.country}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">All Countries</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="flex items-center gap-1">
                              {exp.format === "JSON" ? (
                                <FileJson className="h-3 w-3 text-aceli" />
                              ) : (
                                <FileSpreadsheet className="h-3 w-3 text-green-600" />
                              )}
                              {exp.format}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium">
                            {exp.recordCount}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] h-5 border gap-0.5", statusInfo.color)}
                            >
                              {statusInfo.icon}
                              {exp.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {exp.triggeredBy}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {truncateChecksum(exp.checksum)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* New Export Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Benchmarking Export</DialogTitle>
            <DialogDescription>
              Generate a new benchmarking data export for analysis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Country selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Country</label>
              <Select value={selectedCountry || "all"} onValueChange={(val) => setSelectedCountry(val === "all" ? "" : (val ?? ""))}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌍 All Countries</SelectItem>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {COUNTRY_FLAGS[c]} {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Format</label>
              <Select value={selectedFormat} onValueChange={(val) => setSelectedFormat((val ?? "JSON") as BenchmarkingExportFormat)}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JSON">
                    <span className="flex items-center gap-2">
                      <FileJson className="h-3.5 w-3.5 text-aceli" />
                      JSON
                    </span>
                  </SelectItem>
                  <SelectItem value="CSV">
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
                      CSV
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview data */}
            {previewData && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Export Preview</label>
                <ScrollArea className="max-h-48 rounded-lg border bg-muted/30">
                  <pre className="text-[10px] font-mono p-3 whitespace-pre-wrap text-foreground">
                    {previewData}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              {previewData ? "Close" : "Cancel"}
            </DialogClose>
            {!previewData && (
              <Button
                size="sm"
                className="bg-aceli hover:bg-aceli-dark text-white"
                disabled={exporting}
                onClick={handleExport}
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Generate Export
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
