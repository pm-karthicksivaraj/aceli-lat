'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeftRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface SyncRecord {
  id: string
  entity: string
  entityId: string
  direction: string
  status: string
  salesforceId: string | null
  payload: string | null
  errorMessage: string | null
  retryCount: number
  lastAttemptAt: string | null
  createdAt: string
  updatedAt: string
}

const STATUS_CONFIG: Record<string, { variant: 'secondary' | 'outline' | 'destructive' | 'ghost'; label: string; icon: typeof Clock; color: string }> = {
  pending: { variant: 'secondary', label: 'Pending', icon: Clock, color: 'text-amber-500' },
  in_progress: { variant: 'secondary', label: 'In Progress', icon: Loader2, color: 'text-amber-500' },
  completed: { variant: 'outline', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600' },
  failed: { variant: 'destructive', label: 'Failed', icon: XCircle, color: 'text-red-600' },
  conflict: { variant: 'destructive', label: 'Conflict', icon: AlertTriangle, color: 'text-orange-500' },
}

const DIRECTION_LABELS: Record<string, string> = {
  lat_to_sf: 'LAT → Salesforce',
  sf_to_lat: 'Salesforce → LAT',
}

export function SyncDashboard() {
  const [records, setRecords] = useState<SyncRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/sync-records')
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

  async function refetchRecords() {
    try {
      setLoading(true)
      const res = await fetch('/api/sync-records')
      if (res.ok) {
        const data = await res.json()
        setRecords(Array.isArray(data) ? data : data.items ?? [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function retryRecord(record: SyncRecord) {
    setRetrying(record.id)
    try {
      await fetch(`/api/sync-records/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending', retryCount: record.retryCount + 1 }),
      })
      refetchRecords()
    } catch {
      // ignore
    } finally {
      setRetrying(null)
    }
  }

  // Summary counts
  const pendingCount = records.filter((r) => r.status === 'pending' || r.status === 'in_progress').length
  const completedCount = records.filter((r) => r.status === 'completed').length
  const failedCount = records.filter((r) => r.status === 'failed' || r.status === 'conflict').length

  const summaryCards = [
    {
      title: 'Pending',
      value: pendingCount,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      title: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'Failed',
      value: failedCount,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ArrowLeftRight className="size-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Sync Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Monitor data synchronization between LAT and Salesforce
          </p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={refetchRecords}>
            <RefreshCw className="mr-1.5 size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg p-2.5 ${card.bg}`}>
                <card.icon className={`size-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Records table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading sync records…</span>
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ArrowLeftRight className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No sync records found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowUpDown className="size-4" />
              Sync Records
            </CardTitle>
            <CardDescription>{records.length} total records</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[28rem] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Direction</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Last Attempt</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => {
                    const cfg = STATUS_CONFIG[record.status] ?? {
                      variant: 'secondary' as const,
                      label: record.status,
                      icon: Clock,
                      color: 'text-muted-foreground',
                    }
                    const canRetry = record.status === 'failed' || record.status === 'conflict'
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {DIRECTION_LABELS[record.direction] ?? record.direction}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-xs capitalize">
                          {record.entity}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <cfg.icon className={`size-3.5 ${cfg.color}`} />
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {record.retryCount}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-red-600">
                          {record.errorMessage ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {record.lastAttemptAt
                            ? new Date(record.lastAttemptAt).toLocaleString()
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {canRetry && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryRecord(record)}
                              disabled={retrying === record.id}
                            >
                              {retrying === record.id ? (
                                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="mr-1.5 size-3.5" />
                              )}
                              Retry
                            </Button>
                          )}
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
    </div>
  )
}
