'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  ChevronRight,
  ChevronDown,
  Loader2,
  Award,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Scorecard {
  id: string
  lenderId: string
  period: string
  lendingVolume: number
  termsAlignment: number
  productFit: number
  pipelineStrength: number
  constraintResolution: number
  relationshipHealth: number
  overallScore: number
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  lender?: {
    id: string
    name: string
    country: string
  }
}

interface Lender {
  id: string
  name: string
  country: string
}

const DIMENSIONS = [
  { key: 'lendingVolume', label: 'Lending Volume', color: 'bg-emerald-500' },
  { key: 'termsAlignment', label: 'Terms Alignment', color: 'bg-teal-500' },
  { key: 'productFit', label: 'Product Fit', color: 'bg-cyan-500' },
  { key: 'pipelineStrength', label: 'Pipeline Strength', color: 'bg-sky-500' },
  { key: 'constraintResolution', label: 'Constraint Resolution', color: 'bg-indigo-500' },
  { key: 'relationshipHealth', label: 'Relationship Health', color: 'bg-violet-500' },
] as const

type DimensionKey = (typeof DIMENSIONS)[number]['key']

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function scoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 80) return 'default'
  if (score >= 60) return 'secondary'
  return 'destructive'
}

const defaultForm = {
  lenderId: '',
  period: '',
  lendingVolume: '0',
  termsAlignment: '0',
  productFit: '0',
  pipelineStrength: '0',
  constraintResolution: '0',
  relationshipHealth: '0',
}

export function ScorecardView() {
  const [scorecards, setScorecards] = useState<Scorecard[]>([])
  const [lenders, setLenders] = useState<Lender[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Scorecard | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    fetch('/api/scorecards')
      .then((r) => r.json())
      .then((d) => {
        setScorecards(Array.isArray(d) ? d : d.items ?? [])
      })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
    // Fetch lenders for the select dropdown
    fetch('/api/lenders')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLenders(d) })
      .catch(() => { /* ignore */ })
  }, [fetchData])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function openEdit(sc: Scorecard) {
    setEditingItem(sc)
    setForm({
      lenderId: sc.lenderId,
      period: sc.period,
      lendingVolume: String(sc.lendingVolume),
      termsAlignment: String(sc.termsAlignment),
      productFit: String(sc.productFit),
      pipelineStrength: String(sc.pipelineStrength),
      constraintResolution: String(sc.constraintResolution),
      relationshipHealth: String(sc.relationshipHealth),
    })
    setEditOpen(true)
  }

  async function handleCreate() {
    setSubmitting(true)
    try {
      const dims = {
        lendingVolume: parseFloat(form.lendingVolume) || 0,
        termsAlignment: parseFloat(form.termsAlignment) || 0,
        productFit: parseFloat(form.productFit) || 0,
        pipelineStrength: parseFloat(form.pipelineStrength) || 0,
        constraintResolution: parseFloat(form.constraintResolution) || 0,
        relationshipHealth: parseFloat(form.relationshipHealth) || 0,
      }
      const overallScore = (dims.lendingVolume + dims.termsAlignment + dims.productFit + dims.pipelineStrength + dims.constraintResolution + dims.relationshipHealth) / 6
      const res = await fetch('/api/scorecards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lenderId: form.lenderId,
          period: form.period,
          ...dims,
          overallScore,
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
      const dims = {
        lendingVolume: parseFloat(form.lendingVolume) || 0,
        termsAlignment: parseFloat(form.termsAlignment) || 0,
        productFit: parseFloat(form.productFit) || 0,
        pipelineStrength: parseFloat(form.pipelineStrength) || 0,
        constraintResolution: parseFloat(form.constraintResolution) || 0,
        relationshipHealth: parseFloat(form.relationshipHealth) || 0,
      }
      const overallScore = (dims.lendingVolume + dims.termsAlignment + dims.productFit + dims.pipelineStrength + dims.constraintResolution + dims.relationshipHealth) / 6
      const res = await fetch(`/api/scorecards/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lenderId: form.lenderId,
          period: form.period,
          ...dims,
          overallScore,
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
    if (!confirm('Delete this scorecard?')) return
    try {
      const res = await fetch(`/api/scorecards/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading scorecards…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Scorecards</h2>
            <p className="text-sm text-muted-foreground">
              {scorecards.length} scorecard{scorecards.length !== 1 ? 's' : ''} across lenders
            </p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={(open) => { if (open) setForm(defaultForm); setCreateOpen(open) }}>
          <DialogTrigger render={<Button size="sm"><Plus className="size-4 mr-1" />Create Scorecard</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Scorecard</DialogTitle>
              <DialogDescription>Add a new lender scorecard.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Lender</Label>
                <Select value={form.lenderId} onValueChange={(v) => setForm({ ...form, lenderId: v ?? '' })}>
                  <SelectTrigger><SelectValue placeholder="Select lender" /></SelectTrigger>
                  <SelectContent>
                    {lenders.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sc-period">Period</Label>
                <Input id="sc-period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g. Q1-2025" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="sc-lv">Lending Volume</Label>
                  <Input id="sc-lv" type="number" value={form.lendingVolume} onChange={(e) => setForm({ ...form, lendingVolume: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sc-ta">Terms Alignment</Label>
                  <Input id="sc-ta" type="number" value={form.termsAlignment} onChange={(e) => setForm({ ...form, termsAlignment: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sc-pf">Product Fit</Label>
                  <Input id="sc-pf" type="number" value={form.productFit} onChange={(e) => setForm({ ...form, productFit: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sc-ps">Pipeline Strength</Label>
                  <Input id="sc-ps" type="number" value={form.pipelineStrength} onChange={(e) => setForm({ ...form, pipelineStrength: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sc-cr">Constraint Resolution</Label>
                  <Input id="sc-cr" type="number" value={form.constraintResolution} onChange={(e) => setForm({ ...form, constraintResolution: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sc-rh">Relationship Health</Label>
                  <Input id="sc-rh" type="number" value={form.relationshipHealth} onChange={(e) => setForm({ ...form, relationshipHealth: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button onClick={handleCreate} disabled={submitting || !form.lenderId || !form.period}>
                {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {scorecards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No scorecards available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {scorecards.map((sc) => {
            const isExpanded = expandedId === sc.id
            return (
              <Card key={sc.id}>
                {/* Summary row */}
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleExpand(sc.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">
                          {sc.lender?.name ?? `Lender ${sc.lenderId.slice(-6)}`}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>{sc.period}</span>
                          {sc.lender?.country && (
                            <Badge variant="outline" className="text-[10px]">
                              {sc.lender.country}
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className={`size-4 ${scoreColor(sc.overallScore)}`} />
                        <span className={`text-lg font-bold tabular-nums ${scoreColor(sc.overallScore)}`}>
                          {sc.overallScore.toFixed(1)}
                        </span>
                      </div>
                      <Badge variant={scoreBadgeVariant(sc.overallScore)}>
                        {sc.overallScore >= 80 ? 'Strong' : sc.overallScore >= 60 ? 'Moderate' : 'Needs Attention'}
                      </Badge>
                      <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); openEdit(sc) }}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); handleDelete(sc.id) }}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded dimension detail */}
                {isExpanded && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="border-t pt-4" />
                    <div className="grid gap-3">
                      {DIMENSIONS.map((dim) => {
                        const value = sc[dim.key as DimensionKey]
                        return (
                          <div key={dim.key} className="space-y-1.5">
                            <Progress value={value}>
                              <div className="flex items-center justify-between w-full">
                                <ProgressLabel className="text-xs">{dim.label}</ProgressLabel>
                                <ProgressValue className="text-xs tabular-nums">
                                  {value.toFixed(1)}
                                </ProgressValue>
                              </div>
                              <ProgressTrack className="h-2">
                                <ProgressIndicator
                                  className={dim.color}
                                  style={{ width: `${Math.min(100, value)}%` }}
                                />
                              </ProgressTrack>
                            </Progress>
                          </div>
                        )
                      })}
                    </div>
                    {sc.reviewedAt && (
                      <p className="text-xs text-muted-foreground pt-2">
                        Last reviewed: {new Date(sc.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex justify-end pt-2">
                      <Button size="sm" variant="outline">
                        View Full Details
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Scorecard</DialogTitle>
            <DialogDescription>Update the scorecard details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Lender</Label>
              <Select value={form.lenderId} onValueChange={(v) => setForm({ ...form, lenderId: v ?? '' })}>
                <SelectTrigger><SelectValue placeholder="Select lender" /></SelectTrigger>
                <SelectContent>
                  {lenders.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sc-edit-period">Period</Label>
              <Input id="sc-edit-period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="sc-edit-lv">Lending Volume</Label>
                <Input id="sc-edit-lv" type="number" value={form.lendingVolume} onChange={(e) => setForm({ ...form, lendingVolume: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sc-edit-ta">Terms Alignment</Label>
                <Input id="sc-edit-ta" type="number" value={form.termsAlignment} onChange={(e) => setForm({ ...form, termsAlignment: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sc-edit-pf">Product Fit</Label>
                <Input id="sc-edit-pf" type="number" value={form.productFit} onChange={(e) => setForm({ ...form, productFit: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sc-edit-ps">Pipeline Strength</Label>
                <Input id="sc-edit-ps" type="number" value={form.pipelineStrength} onChange={(e) => setForm({ ...form, pipelineStrength: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sc-edit-cr">Constraint Resolution</Label>
                <Input id="sc-edit-cr" type="number" value={form.constraintResolution} onChange={(e) => setForm({ ...form, constraintResolution: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sc-edit-rh">Relationship Health</Label>
                <Input id="sc-edit-rh" type="number" value={form.relationshipHealth} onChange={(e) => setForm({ ...form, relationshipHealth: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={handleEdit} disabled={submitting || !form.lenderId || !form.period}>
              {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
