'use client'

import { useEffect, useState, useCallback } from 'react'
import { Target, TrendingUp, BarChart3, Filter, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue } from '@/components/ui/progress'
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

interface KPIData {
  id: string
  kpiName: string
  country: string
  period: string
  baseline: number | null
  actual: number | null
  target: number | null
  unit: string
  source: string
  lender?: { id: string; name: string } | null
}

const defaultForm = {
  kpiName: '',
  country: '',
  period: '',
  baseline: '',
  actual: '',
  target: '',
  unit: '',
  source: '',
}

export function KPIDashboard() {
  const [data, setData] = useState<KPIData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterKpiName, setFilterKpiName] = useState('all')
  const [filterCountry, setFilterCountry] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KPIData | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    const params = new URLSearchParams()
    if (filterKpiName !== 'all') params.set('kpiName', filterKpiName)
    if (filterCountry !== 'all') params.set('country', filterCountry)
    if (filterPeriod !== 'all') params.set('period', filterPeriod)

    fetch(`/api/kpis?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setData(d) })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [filterKpiName, filterCountry, filterPeriod])

  useEffect(() => { fetchData() }, [fetchData])

  const kpiNames = [...new Set(data.map((d) => d.kpiName))]
  const countries = [...new Set(data.map((d) => d.country))]
  const periods = [...new Set(data.map((d) => d.period))]

  function getProgressPercent(item: KPIData): number {
    if (item.target == null || item.baseline == null || item.actual == null) return 0
    const range = item.target - item.baseline
    if (range === 0) return item.actual >= item.target ? 100 : 0
    const pct = ((item.actual - item.baseline) / range) * 100
    return Math.min(Math.max(pct, 0), 100)
  }

  function getStatusBadge(item: KPIData) {
    if (item.actual == null || item.target == null) return <Badge variant="secondary">No Data</Badge>
    const pct = getProgressPercent(item)
    if (pct >= 100) return <Badge variant="default">On Target</Badge>
    if (pct >= 70) return <Badge variant="outline">Near Target</Badge>
    return <Badge variant="destructive">Below Target</Badge>
  }

  function openEdit(item: KPIData) {
    setEditingItem(item)
    setForm({
      kpiName: item.kpiName,
      country: item.country,
      period: item.period,
      baseline: item.baseline != null ? String(item.baseline) : '',
      actual: item.actual != null ? String(item.actual) : '',
      target: item.target != null ? String(item.target) : '',
      unit: item.unit,
      source: item.source,
    })
    setEditOpen(true)
  }

  async function handleCreate() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpiName: form.kpiName,
          country: form.country,
          period: form.period,
          baseline: form.baseline !== '' ? parseFloat(form.baseline) : null,
          actual: form.actual !== '' ? parseFloat(form.actual) : null,
          target: form.target !== '' ? parseFloat(form.target) : null,
          unit: form.unit,
          source: form.source || 'system',
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
      const res = await fetch(`/api/kpis/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpiName: form.kpiName,
          country: form.country,
          period: form.period,
          baseline: form.baseline !== '' ? parseFloat(form.baseline) : null,
          actual: form.actual !== '' ? parseFloat(form.actual) : null,
          target: form.target !== '' ? parseFloat(form.target) : null,
          unit: form.unit,
          source: form.source,
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
    if (!confirm('Delete this KPI?')) return
    try {
      const res = await fetch(`/api/kpis/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      {/* Filters & Create */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="size-4 text-muted-foreground" />
        <Select value={filterKpiName} onValueChange={(v) => setFilterKpiName(v ?? 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All KPIs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KPIs</SelectItem>
            {kpiNames.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCountry} onValueChange={(v) => setFilterCountry(v ?? 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v ?? 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Periods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Periods</SelectItem>
            {periods.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterKpiName !== 'all' || filterCountry !== 'all' || filterPeriod !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterKpiName('all')
              setFilterCountry('all')
              setFilterPeriod('all')
            }}
          >
            Clear Filters
          </Button>
        )}
        <div className="ml-auto">
          <Dialog open={createOpen} onOpenChange={(open) => { if (open) setForm(defaultForm); setCreateOpen(open) }}>
            <DialogTrigger render={<Button size="sm"><Plus className="size-4 mr-1" />Create KPI</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create KPI</DialogTitle>
                <DialogDescription>Add a new KPI measurement.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="kpi-name">KPI Name</Label>
                  <Input id="kpi-name" value={form.kpiName} onChange={(e) => setForm({ ...form, kpiName: e.target.value })} placeholder="e.g. Lending Volume Growth" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="kpi-country">Country</Label>
                    <Input id="kpi-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. Kenya" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="kpi-period">Period</Label>
                    <Input id="kpi-period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g. Q1-2025" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="kpi-baseline">Baseline</Label>
                    <Input id="kpi-baseline" type="number" step="any" value={form.baseline} onChange={(e) => setForm({ ...form, baseline: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="kpi-actual">Actual</Label>
                    <Input id="kpi-actual" type="number" step="any" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="kpi-target">Target</Label>
                    <Input id="kpi-target" type="number" step="any" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="kpi-unit">Unit</Label>
                    <Input id="kpi-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. %" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="kpi-source">Source</Label>
                    <Input id="kpi-source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g. Salesforce" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Cancel</Button>} />
                <Button onClick={handleCreate} disabled={submitting || !form.kpiName || !form.country || !form.period}>
                  {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Target className="size-4" /> Total KPIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" /> On Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.filter((d) => getProgressPercent(d) >= 100).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BarChart3 className="size-4" /> Avg Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.length > 0
                ? `${Math.round(data.reduce((sum, d) => sum + getProgressPercent(d), 0) / data.length)}%`
                : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading KPIs...</div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          No KPI measurements found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">{item.kpiName}</CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    {getStatusBadge(item)}
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{item.country}</span>
                  <span>·</span>
                  <span>{item.period}</span>
                  {item.lender && (
                    <>
                      <span>·</span>
                      <span>{item.lender.name}</span>
                    </>
                  )}
                </div>

                {/* Baseline / Actual / Target */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Baseline</div>
                    <div className="text-sm font-semibold">
                      {item.baseline != null ? `${item.baseline}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Actual</div>
                    <div className="text-sm font-semibold text-primary">
                      {item.actual != null ? `${item.actual}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Target</div>
                    <div className="text-sm font-semibold">
                      {item.target != null ? `${item.target}` : '—'}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <Progress value={getProgressPercent(item)}>
                  <ProgressLabel className="sr-only">{item.kpiName} progress</ProgressLabel>
                  <ProgressValue>{Math.round(getProgressPercent(item))}%</ProgressValue>
                  <ProgressTrack>
                    <ProgressIndicator
                      style={{ width: `${getProgressPercent(item)}%` }}
                      className={
                        getProgressPercent(item) >= 100
                          ? 'bg-green-500'
                          : getProgressPercent(item) >= 70
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }
                    />
                  </ProgressTrack>
                </Progress>

                <div className="text-xs text-muted-foreground">
                  Unit: {item.unit} · Source: {item.source}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit KPI</DialogTitle>
            <DialogDescription>Update the KPI measurement details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="kpi-edit-name">KPI Name</Label>
              <Input id="kpi-edit-name" value={form.kpiName} onChange={(e) => setForm({ ...form, kpiName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="kpi-edit-country">Country</Label>
                <Input id="kpi-edit-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="kpi-edit-period">Period</Label>
                <Input id="kpi-edit-period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="kpi-edit-baseline">Baseline</Label>
                <Input id="kpi-edit-baseline" type="number" step="any" value={form.baseline} onChange={(e) => setForm({ ...form, baseline: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="kpi-edit-actual">Actual</Label>
                <Input id="kpi-edit-actual" type="number" step="any" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="kpi-edit-target">Target</Label>
                <Input id="kpi-edit-target" type="number" step="any" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="kpi-edit-unit">Unit</Label>
                <Input id="kpi-edit-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="kpi-edit-source">Source</Label>
                <Input id="kpi-edit-source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={handleEdit} disabled={submitting || !form.kpiName}>
              {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
