'use client'

import { useEffect, useState, useCallback } from 'react'
import { Target, TrendingUp, TrendingDown, Minus, ArrowRight, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'

interface OutcomeKPI {
  id: string
  name: string
  description: string
  category: string
  measurementUnit: string
  baseline: number | null
  target: number | null
  actual: number | null
  period: string
  country: string | null
  evidence: string | null
  status: string
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  defined: { label: 'Defined', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  baseline_set: { label: 'Baseline Set', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  tracking: { label: 'Tracking', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  achieved: { label: 'Achieved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  missed: { label: 'Missed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const CATEGORY_LABELS: Record<string, string> = {
  activation: 'Activation',
  adoption: 'Adoption',
  efficiency: 'Efficiency',
  quality: 'Quality',
  impact: 'Impact',
}

const CATEGORY_COLORS: Record<string, string> = {
  activation: 'bg-emerald-500',
  adoption: 'bg-sky-500',
  efficiency: 'bg-amber-500',
  quality: 'bg-violet-500',
  impact: 'bg-pink-500',
}

const CATEGORIES = [
  { value: 'activation', label: 'Activation' },
  { value: 'adoption', label: 'Adoption' },
  { value: 'efficiency', label: 'Efficiency' },
  { value: 'quality', label: 'Quality' },
  { value: 'impact', label: 'Impact' },
]

const defaultForm = {
  name: '',
  description: '',
  category: 'activation',
  measurementUnit: '',
  baseline: '',
  target: '',
  actual: '',
  period: '',
  country: '',
}

export function OutcomeKPIView() {
  const [data, setData] = useState<OutcomeKPI[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<OutcomeKPI | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    const params = new URLSearchParams()
    if (categoryFilter !== 'all') params.set('category', categoryFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    fetch(`/api/outcome-kpis?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [categoryFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // Group by category
  const grouped = data.reduce<Record<string, OutcomeKPI[]>>((acc, kpi) => {
    if (!acc[kpi.category]) acc[kpi.category] = []
    acc[kpi.category].push(kpi)
    return acc
  }, {})

  function getProgressPercent(kpi: OutcomeKPI): number {
    if (kpi.target === null || kpi.baseline === null || kpi.actual === null) return 0
    const range = kpi.target - kpi.baseline
    if (range === 0) return 100
    return Math.min(100, Math.max(0, Math.round(((kpi.actual - kpi.baseline) / range) * 100)))
  }

  function getTrendIcon(kpi: OutcomeKPI) {
    if (kpi.actual === null || kpi.baseline === null) return <Minus className="size-3 text-muted-foreground" />
    if (kpi.actual > kpi.baseline) return <TrendingUp className="size-3 text-emerald-600" />
    if (kpi.actual < kpi.baseline) return <TrendingDown className="size-3 text-red-600" />
    return <Minus className="size-3 text-muted-foreground" />
  }

  function openEdit(kpi: OutcomeKPI) {
    setEditingItem(kpi)
    setForm({
      name: kpi.name,
      description: kpi.description,
      category: kpi.category,
      measurementUnit: kpi.measurementUnit,
      baseline: kpi.baseline != null ? String(kpi.baseline) : '',
      target: kpi.target != null ? String(kpi.target) : '',
      actual: kpi.actual != null ? String(kpi.actual) : '',
      period: kpi.period,
      country: kpi.country ?? '',
    })
    setEditOpen(true)
  }

  async function handleCreate() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/outcome-kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          measurementUnit: form.measurementUnit,
          baseline: form.baseline !== '' ? parseFloat(form.baseline) : null,
          target: form.target !== '' ? parseFloat(form.target) : null,
          actual: form.actual !== '' ? parseFloat(form.actual) : null,
          period: form.period,
          country: form.country || null,
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
      const res = await fetch(`/api/outcome-kpis/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          measurementUnit: form.measurementUnit,
          baseline: form.baseline !== '' ? parseFloat(form.baseline) : null,
          target: form.target !== '' ? parseFloat(form.target) : null,
          actual: form.actual !== '' ? parseFloat(form.actual) : null,
          period: form.period,
          country: form.country || null,
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
    if (!confirm('Delete this outcome KPI?')) return
    try {
      const res = await fetch(`/api/outcome-kpis/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Target className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Outcome KPIs</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-28 rounded bg-muted" />
                <div className="h-4 w-20 rounded bg-muted" />
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
          <Target className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Outcome KPIs</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="activation">Activation</SelectItem>
              <SelectItem value="adoption">Adoption</SelectItem>
              <SelectItem value="efficiency">Efficiency</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="impact">Impact</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="defined">Defined</SelectItem>
              <SelectItem value="baseline_set">Baseline Set</SelectItem>
              <SelectItem value="tracking">Tracking</SelectItem>
              <SelectItem value="achieved">Achieved</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={createOpen} onOpenChange={(open) => { if (open) setForm(defaultForm); setCreateOpen(open) }}>
            <DialogTrigger render={<Button size="sm"><Plus className="size-4 mr-1" />Create KPI</Button>} />
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Outcome KPI</DialogTitle>
                <DialogDescription>Add a new outcome KPI.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="ok-name">Name</Label>
                  <Input id="ok-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="KPI name" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ok-desc">Description</Label>
                  <Textarea id="ok-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v ?? 'activation' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="ok-unit">Measurement Unit</Label>
                    <Input id="ok-unit" value={form.measurementUnit} onChange={(e) => setForm({ ...form, measurementUnit: e.target.value })} placeholder="e.g. %" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="ok-baseline">Baseline</Label>
                    <Input id="ok-baseline" type="number" step="any" value={form.baseline} onChange={(e) => setForm({ ...form, baseline: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="ok-target">Target</Label>
                    <Input id="ok-target" type="number" step="any" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="ok-actual">Actual</Label>
                    <Input id="ok-actual" type="number" step="any" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="ok-period">Period</Label>
                    <Input id="ok-period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g. Q1-2025" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="ok-country">Country</Label>
                    <Input id="ok-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. Kenya" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Cancel</Button>} />
                <Button onClick={handleCreate} disabled={submitting || !form.name}>
                  {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards grouped by category */}
      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No outcome KPIs found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, kpis]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`size-2 rounded-full ${CATEGORY_COLORS[category] ?? 'bg-slate-500'}`} />
                <h3 className="text-sm font-semibold">{CATEGORY_LABELS[category] ?? category}</h3>
                <Badge variant="outline" className="text-[10px]">{kpis.length}</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {kpis.map((kpi) => {
                  const badge = STATUS_BADGE[kpi.status] ?? STATUS_BADGE.defined
                  const pct = getProgressPercent(kpi)

                  return (
                    <Card key={kpi.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm leading-tight">{kpi.name}</CardTitle>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge className={badge.className}>{badge.label}</Badge>
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(kpi)}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(kpi.id)}>
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription className="line-clamp-2 text-xs">{kpi.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Baseline → Actual → Target */}
                        <div className="flex items-center gap-2 text-sm">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Baseline</div>
                            <div className="font-semibold">{kpi.baseline ?? '—'}</div>
                          </div>
                          <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                          <div className="text-center flex items-center gap-1">
                            <div>
                              <div className="text-xs text-muted-foreground">Actual</div>
                              <div className="font-semibold">{kpi.actual ?? '—'}</div>
                            </div>
                            {getTrendIcon(kpi)}
                          </div>
                          <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Target</div>
                            <div className="font-semibold">{kpi.target ?? '—'}</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        {(kpi.baseline !== null && kpi.target !== null) && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Progress</span>
                              <span>{pct}%</span>
                            </div>
                            <Progress value={pct}>
                              <ProgressTrack className="h-1.5">
                                <ProgressIndicator
                                  className={
                                    kpi.status === 'achieved' ? 'bg-emerald-500'
                                    : kpi.status === 'missed' ? 'bg-red-500'
                                    : 'bg-primary'
                                  }
                                />
                              </ProgressTrack>
                            </Progress>
                          </div>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{kpi.measurementUnit}</span>
                          <span>·</span>
                          <span>{kpi.period}</span>
                          {kpi.country && (
                            <>
                              <span>·</span>
                              <span>{kpi.country}</span>
                            </>
                          )}
                        </div>
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
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Outcome KPI</DialogTitle>
            <DialogDescription>Update the outcome KPI details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ok-edit-name">Name</Label>
              <Input id="ok-edit-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ok-edit-desc">Description</Label>
              <Textarea id="ok-edit-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v ?? 'activation' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ok-edit-unit">Measurement Unit</Label>
                <Input id="ok-edit-unit" value={form.measurementUnit} onChange={(e) => setForm({ ...form, measurementUnit: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ok-edit-baseline">Baseline</Label>
                <Input id="ok-edit-baseline" type="number" step="any" value={form.baseline} onChange={(e) => setForm({ ...form, baseline: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ok-edit-target">Target</Label>
                <Input id="ok-edit-target" type="number" step="any" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ok-edit-actual">Actual</Label>
                <Input id="ok-edit-actual" type="number" step="any" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ok-edit-period">Period</Label>
                <Input id="ok-edit-period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ok-edit-country">Country</Label>
                <Input id="ok-edit-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={handleEdit} disabled={submitting || !form.name}>
              {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
