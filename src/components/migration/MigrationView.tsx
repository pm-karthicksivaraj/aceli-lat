'use client'

import { useState, useEffect } from 'react'
import {
  Database,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Map,
  Shield,
  Package,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface MigrationRecord {
  id: string
  sourceType: string
  sourceId: string | null
  targetType: string
  targetId: string | null
  entity: string
  status: string
  sourceData: string | null
  validationNotes: string | null
  migratedBy: string | null
  migratedAt: string | null
  createdAt: string
}

const STATUS_CONFIG: Record<string, { variant: 'secondary' | 'outline' | 'default' | 'destructive' | 'ghost'; label: string; color: string }> = {
  mapped: { variant: 'secondary', label: 'Mapped', color: 'bg-sky-500' },
  validated: { variant: 'outline', label: 'Validated', color: 'bg-emerald-500' },
  migrated: { variant: 'default', label: 'Migrated', color: 'bg-teal-500' },
  failed: { variant: 'destructive', label: 'Failed', color: 'bg-red-500' },
  skipped: { variant: 'ghost', label: 'Skipped', color: 'bg-gray-400' },
}

const SOURCE_LABELS: Record<string, string> = {
  google_sheets: 'Google Sheets',
  salesforce: 'Salesforce',
  manual: 'Manual',
}

export function MigrationView() {
  const [records, setRecords] = useState<MigrationRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/migration-records')
        if (res.ok && !cancelled) {
          const data = await res.json()
          setRecords(Array.isArray(data) ? data : data.items ?? [])
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Summary counts
  const mappedCount = records.filter((r) => r.status === 'mapped').length
  const validatedCount = records.filter((r) => r.status === 'validated').length
  const migratedCount = records.filter((r) => r.status === 'migrated').length
  const failedCount = records.filter((r) => r.status === 'failed').length
  const total = records.length
  const progressPercent = total > 0 ? Math.round(((migratedCount) / total) * 100) : 0

  const summaryItems = [
    {
      label: 'Mapped',
      count: mappedCount,
      icon: Map,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
    },
    {
      label: 'Validated',
      count: validatedCount,
      icon: Shield,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: 'Migrated',
      count: migratedCount,
      icon: Package,
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
    },
    {
      label: 'Failed',
      count: failedCount,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading migration records…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Database className="size-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Data Migration</h2>
          <p className="text-sm text-muted-foreground">
            Track data migration from external sources to the LAT platform
          </p>
        </div>
      </div>

      {/* Progress summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">Migration Progress</p>
              <p className="text-xs text-muted-foreground">
                {migratedCount} of {total} records fully migrated
              </p>
            </div>
            <span className="text-2xl font-bold tabular-nums">{progressPercent}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Summary pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-lg p-2.5 ${item.bg}`}
              >
                <item.icon className={`size-4 ${item.color}`} />
                <div>
                  <p className="text-lg font-bold tabular-nums">{item.count}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Records table */}
      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No migration records found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Migration Records</CardTitle>
            <CardDescription>{total} total records</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[28rem] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Migrated By</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((rec) => {
                    const cfg = STATUS_CONFIG[rec.status] ?? {
                      variant: 'secondary' as const,
                      label: rec.status,
                      color: 'bg-gray-400',
                    }
                    return (
                      <TableRow key={rec.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs">
                              {SOURCE_LABELS[rec.sourceType] ?? rec.sourceType}
                            </Badge>
                            <ArrowRight className="size-3 text-muted-foreground" />
                            <Badge variant="outline" className="text-xs">
                              {rec.targetType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {rec.targetId ? rec.targetId.slice(-8) : '—'}
                        </TableCell>
                        <TableCell className="font-medium text-xs capitalize">
                          {rec.entity}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className={`size-2 rounded-full ${cfg.color}`} />
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {rec.migratedBy ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {rec.migratedAt
                            ? new Date(rec.migratedAt).toLocaleDateString()
                            : '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation notes summary */}
      {records.some((r) => r.validationNotes) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4" />
              Validation Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {records
                .filter((r) => r.validationNotes)
                .map((rec) => (
                  <div key={rec.id} className="flex items-start gap-2 text-xs">
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {rec.entity}
                    </Badge>
                    <span className="text-muted-foreground">{rec.validationNotes}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
