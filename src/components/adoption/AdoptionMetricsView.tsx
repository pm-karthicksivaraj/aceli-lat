'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, TrendingUp, TrendingDown, Minus, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AdoptionMetric {
  id: string
  metric: string
  country: string
  period: string
  value: number
  target: number | null
  previousPeriod: number | null
  unit: string
  collectedAt: string
}

const METRIC_LABELS: Record<string, string> = {
  daily_active_users: 'Daily Active Users',
  weekly_active_users: 'Weekly Active Users',
  meetings_logged: 'Meetings Logged',
  extractions_reviewed: 'Extractions Reviewed',
  sync_success_rate: 'Sync Success Rate',
}

const METRIC_ICONS: Record<string, string> = {
  daily_active_users: '👤',
  weekly_active_users: '👥',
  meetings_logged: '📅',
  extractions_reviewed: '✅',
  sync_success_rate: '🔄',
}

const METRIC_OPTIONS = [
  { value: 'daily_active_users', label: 'Daily Active Users' },
  { value: 'weekly_active_users', label: 'Weekly Active Users' },
  { value: 'meetings_logged', label: 'Meetings Logged' },
  { value: 'extractions_reviewed', label: 'Extractions Reviewed' },
  { value: 'sync_success_rate', label: 'Sync Success Rate' },
]

const COUNTRIES = ['Kenya', 'Uganda', 'Tanzania', 'Ethiopia', 'Nigeria', 'Ghana']

const defaultForm = {
  metric: 'daily_active_users',
  country: '',
  period: '',
  value: '',
  target: '',
  previousPeriod: '',
  unit: '',
}

export function AdoptionMetricsView() {
  const [data, setData] = useState<AdoptionMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [countryFilter, setCountryFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AdoptionMetric | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    const params = new URLSearchParams()
    if (countryFilter !== 'all') params.set('country', countryFilter)
    if (periodFilter !== 'all') params.set('period', periodFilter)
    fetch(`/api/adoption-metrics?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [countryFilter, periodFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // Group by country
  const grouped = data.reduce<Record<string, AdoptionMetric[]>>((acc, m) => {
    if (!acc[m.country]) acc[m.country] = []
    acc[m.country].push(m)
    return acc
  }, {})

  function getTrend(m: AdoptionMetric) {
    if (m.previousPeriod === null) return null
    const diff = m.value - m.previousPeriod
    const pctDiff = m.previousPeriod !== 0 ? Math.round((diff / m.previousPeriod) * 100) : 0
    if (diff > 0) return { direction: 'up' as const, pct: pctDiff, icon: <TrendingUp className="size-3.5 text-emerald-600" /> }
    if (diff < 0) return { direction: 'down' as const, pct: pctDiff, icon: <TrendingDown className="size-3.5 text-red-600" /> }
    return { direction: 'flat' as const, pct: 0, icon: <Minus className="size-3.5 text-muted-foreground" /> }
  }

  function getProgressPercent(m: AdoptionMetric): number {
    if (m.target === null || m.target === 0) return 0
    return Math.min(100, Math.max(0, Math.round((m.value / m.target) * 100)))
  }

  function openEdit(m: AdoptionMetric) {
    setEditingItem(m)
    setForm({
      metric: m.metric,
      country: m.country,
      period: m.period,
      value: String(m.value),
      target: m.target != null ? String(m.target) : '',
      previousPeriod: m.previousPeriod != null ? String(m.previousPeriod) : '',
      unit: m.unit,
    })
    setEditOpen(true)
  }

  async function handleCreate() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/adoption-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: form.metric,
          country: form.country,
          period: form.period,
          value: parseFloat(form.value) || 0,
          target: form.target !== '' ? parseFloat(form.target) : null,
          previousPeriod: form.previousPeriod !== '' ? parseFloat(form.previousPeriod) : null,
          unit: form.unit,
        }),
      })
      if (res.ok) {
        setCreateOpen(false)
        fetchData()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit() {
    if (!editingItem) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/adoption-metrics/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: form.metric,
          country: form.country,
          period: form.period,
          value: parseFloat(form.value) || 0,
          target: form.target !== '' ? parseFloat(form.target) : null,
          previousPeriod: form.previousPeriod !== '' ? parseFloat(form.previousPeriod) : null,
          unit: form.unit,
        }),
      })
      if (res.ok) {
        setEditOpen(false)
        setEditingItem(null)
        fetchData()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this adoption metric?')) return
    try {
      const res = await fetch(`/api/adoption-metrics/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Adoption Metrics</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-28 rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Adoption Metrics</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={countryFilter} onValueChange={(v) => setCountryFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {[...new Set(data.map((m) => m.period))].map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={createOpen} onOpenChange={(open) => { if (open) setForm(defaultForm); setCreateOpen(open) }}>
            <DialogTrigger render={<Button size="sm"><Plus className="size-4 mr-1" />Create Metric</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Adoption Metric</DialogTitle>
                <DialogDescription>Add a new adoption metric record.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Metric</Label>
                  <Select value={form.metric} onValueChange={(v) => setForm({ ...form, metric: v ?? 'daily_active_users' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {METRIC_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="am-country">Country</Label>
                    <Input id="am-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. Kenya" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="am-period">Period</Label>
                    <Input id="am-period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g. Q1-2025" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="am-value">Value</Label>
                    <Input id="am-value" type="number" step="any" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="am-target">Target</Label>
                    <Input id="am-target" type="number" step="any" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="am-prev">Previous Period</Label>
                    <Input id="am-prev" type="number" step="any" value={form.previousPeriod} onChange={(e) => setForm({ ...form, previousPeriod: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="am-unit">Unit</Label>
                  <Input id="am-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. count, percent" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Cancel</Button>} />
                <Button onClick={handleCreate} disabled={submitting || !form.country || !form.period || !form.unit}>
                  {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metric Cards grouped by country */}
      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No adoption metrics found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([country, metrics]) => (
            <div key={country}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                {country}
                <Badge variant="outline" className="text-[10px]">{metrics.length} metrics</Badge>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.map((m) => {
                  const trend = getTrend(m)
                  const progressPct = getProgressPercent(m)

                  return (
                    <Card key={m.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <span>{METRIC_ICONS[m.metric] ?? '📊'}</span>
                            {METRIC_LABELS[m.metric] ?? m.metric.replace(/_/g, ' ')}
                          </CardTitle>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(m)}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(m.id)}>
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Value vs Target */}
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-2xl font-bold">
                              {m.unit === 'percent' ? `${m.value.toFixed(1)}%` : m.value.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {m.period} · {m.unit}
                            </div>
                          </div>
                          {trend && (
                            <div className="flex items-center gap-1 text-sm">
                              {trend.icon}
                              <span className={
                                trend.direction === 'up' ? 'text-emerald-600 font-medium'
                                : trend.direction === 'down' ? 'text-red-600 font-medium'
                                : 'text-muted-foreground'
                              }>
                                {trend.pct > 0 ? '+' : ''}{trend.pct}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Target progress */}
                        {m.target !== null && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>vs Target: {m.unit === 'percent' ? `${m.target.toFixed(1)}%` : m.target.toLocaleString()}</span>
                              <span>{progressPct}%</span>
                            </div>
                            <Progress value={progressPct}>
                              <ProgressTrack className="h-1.5">
                                <ProgressIndicator className={progressPct >= 100 ? 'bg-emerald-500' : 'bg-primary'} />
                              </ProgressTrack>
                            </Progress>
                          </div>
                        )}

                        {/* Previous period */}
                        {m.previousPeriod !== null && (
                          <div className="text-xs text-muted-foreground">
                            Previous: {m.unit === 'percent' ? `${m.previousPeriod.toFixed(1)}%` : m.previousPeriod.toLocaleString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Adoption Metric</DialogTitle>
            <DialogDescription>Update the adoption metric details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Metric</Label>
              <Select value={form.metric} onValueChange={(v) => setForm({ ...form, metric: v ?? 'daily_active_users' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="am-edit-country">Country</Label>
                <Input id="am-edit-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="am-edit-period">Period</Label>
                <Input id="am-edit-period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="am-edit-value">Value</Label>
                <Input id="am-edit-value" type="number" step="any" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="am-edit-target">Target</Label>
                <Input id="am-edit-target" type="number" step="any" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="am-edit-prev">Previous Period</Label>
                <Input id="am-edit-prev" type="number" step="any" value={form.previousPeriod} onChange={(e) => setForm({ ...form, previousPeriod: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="am-edit-unit">Unit</Label>
              <Input id="am-edit-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
