'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Filter,
  CheckCircle2,
  Send,
  Loader2,
  Globe2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BenchmarkingFeed {
  id: string
  country: string
  period: string
  metric: string
  value: number
  source: string
  feedDate: string
  status: string
  validatedBy: string | null
  validatedAt: string | null
  createdAt: string
}

const STATUS_BADGES: Record<string, { variant: 'secondary' | 'outline' | 'default' | 'ghost'; label: string }> = {
  pending: { variant: 'secondary', label: 'Pending' },
  validated: { variant: 'outline', label: 'Validated' },
  published: { variant: 'default', label: 'Published' },
  rejected: { variant: 'ghost', label: 'Rejected' },
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'validated', label: 'Validated' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
]

export function BenchmarkingView() {
  const [records, setRecords] = useState<BenchmarkingFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [countryFilter, setCountryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const params = new URLSearchParams()
        if (countryFilter !== 'all') params.set('country', countryFilter)
        if (statusFilter !== 'all') params.set('status', statusFilter)
        const res = await fetch(`/api/benchmarking?${params.toString()}`)
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
  }, [countryFilter, statusFilter])

  async function handleAction(id: string, action: 'validated' | 'published') {
    setActionLoading(id + action)
    try {
      await fetch(`/api/benchmarking/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      })
      // Refresh
      const params = new URLSearchParams()
      if (countryFilter !== 'all') params.set('country', countryFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/benchmarking?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setRecords(Array.isArray(data) ? data : data.items ?? [])
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  // Derive unique countries from data
  const countries = [...new Set(records.map((r) => r.country))].sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="size-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Benchmarking</h2>
          <p className="text-sm text-muted-foreground">
            Country-level benchmarking data feed
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="size-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={countryFilter} onValueChange={(v) => setCountryFilter(v ?? 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <Globe2 className="mr-1.5 size-3.5" />
                  All Countries
                </SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading benchmarking data…</span>
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No benchmarking data found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Benchmarking Records</CardTitle>
            <CardDescription>{records.length} records</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[28rem] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validated By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((rec) => {
                    const st = STATUS_BADGES[rec.status] ?? { variant: 'secondary' as const, label: rec.status }
                    const canValidate = rec.status === 'pending'
                    const canPublish = rec.status === 'validated'
                    return (
                      <TableRow key={rec.id}>
                        <TableCell className="font-medium">{rec.country}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{rec.period}</TableCell>
                        <TableCell className="text-xs">{rec.metric}</TableCell>
                        <TableCell className="font-mono text-xs tabular-nums">{rec.value.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {rec.validatedBy ?? '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canValidate && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(rec.id, 'validated')}
                                disabled={actionLoading === rec.id + 'validated'}
                              >
                                {actionLoading === rec.id + 'validated' ? (
                                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-1 size-3.5" />
                                )}
                                Validate
                              </Button>
                            )}
                            {canPublish && (
                              <Button
                                size="sm"
                                onClick={() => handleAction(rec.id, 'published')}
                                disabled={actionLoading === rec.id + 'published'}
                              >
                                {actionLoading === rec.id + 'published' ? (
                                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                                ) : (
                                  <Send className="mr-1 size-3.5" />
                                )}
                                Publish
                              </Button>
                            )}
                          </div>
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
