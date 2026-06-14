'use client'

import { useEffect, useState, useCallback } from 'react'
import { Shield, Calendar, Clock, AlertTriangle, CheckCircle2, Star, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
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

interface WarrantyPeriodRaw {
  id: string
  country: string
  startDate: string
  endDate: string
  status: string
  slaTargetHours: number
  issuesResolved: number
  issuesOpen: number
  satisfactionScore: number | null
  notes: string | null
}

interface WarrantyPeriod extends WarrantyPeriodRaw {
  daysRemaining: number
  progressPct: number
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  expiring: { label: 'Expiring', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  expired: { label: 'Expired', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  extended: { label: 'Extended', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'expired', label: 'Expired' },
  { value: 'extended', label: 'Extended' },
]

function enrichWarranty(item: WarrantyPeriodRaw, now: number): WarrantyPeriod {
  const daysRemaining = Math.ceil(
    (new Date(item.endDate).getTime() - now) / (1000 * 60 * 60 * 24)
  )
  const total = new Date(item.endDate).getTime() - new Date(item.startDate).getTime()
  const elapsed = now - new Date(item.startDate).getTime()
  const progressPct = total <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))

  return { ...item, daysRemaining, progressPct }
}

const defaultForm = {
  country: '',
  startDate: '',
  endDate: '',
  status: 'active',
  slaTargetHours: '24',
  issuesResolved: '0',
  issuesOpen: '0',
  satisfactionScore: '',
  notes: '',
}

export function WarrantyTracker() {
  const [data, setData] = useState<WarrantyPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WarrantyPeriod | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (countryFilter !== 'all') params.set('country', countryFilter)
    const now = Date.now()
    fetch(`/api/warranty?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        const items = Array.isArray(d) ? d : []
        setData(items.map((item: WarrantyPeriodRaw) => enrichWarranty(item, now)))
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [statusFilter, countryFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const countries = [...new Set(data.map((w) => w.country))]

  function openEdit(warranty: WarrantyPeriod) {
    setEditingItem(warranty)
    setForm({
      country: warranty.country,
      startDate: warranty.startDate.split('T')[0],
      endDate: warranty.endDate.split('T')[0],
      status: warranty.status,
      slaTargetHours: String(warranty.slaTargetHours),
      issuesResolved: String(warranty.issuesResolved),
      issuesOpen: String(warranty.issuesOpen),
      satisfactionScore: warranty.satisfactionScore != null ? String(warranty.satisfactionScore) : '',
      notes: warranty.notes ?? '',
    })
    setEditOpen(true)
  }

  async function handleCreate() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/warranty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: form.country,
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
          slaTargetHours: parseInt(form.slaTargetHours, 10) || 24,
          issuesResolved: parseInt(form.issuesResolved, 10) || 0,
          issuesOpen: parseInt(form.issuesOpen, 10) || 0,
          satisfactionScore: form.satisfactionScore !== '' ? parseFloat(form.satisfactionScore) : null,
          notes: form.notes || null,
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
      const res = await fetch(`/api/warranty/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: form.country,
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
          slaTargetHours: parseInt(form.slaTargetHours, 10) || 24,
          issuesResolved: parseInt(form.issuesResolved, 10) || 0,
          issuesOpen: parseInt(form.issuesOpen, 10) || 0,
          satisfactionScore: form.satisfactionScore !== '' ? parseFloat(form.satisfactionScore) : null,
          notes: form.notes || null,
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
    if (!confirm('Delete this warranty period?')) return
    try {
      const res = await fetch(`/api/warranty/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Warranty Tracker</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-24 rounded bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
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
          <Shield className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Warranty Tracker</h2>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring">Expiring</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="extended">Extended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={(v) => setCountryFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[140px]">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={createOpen} onOpenChange={(open) => { if (open) setForm(defaultForm); setCreateOpen(open) }}>
            <DialogTrigger render={<Button size="sm"><Plus className="size-4 mr-1" />Create Warranty</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Warranty Period</DialogTitle>
                <DialogDescription>Add a new warranty tracking period.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="wt-country">Country</Label>
                  <Input id="wt-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. Kenya" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="wt-start">Start Date</Label>
                    <Input id="wt-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="wt-end">End Date</Label>
                    <Input id="wt-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v ?? 'active' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="wt-sla">SLA Target Hours</Label>
                    <Input id="wt-sla" type="number" value={form.slaTargetHours} onChange={(e) => setForm({ ...form, slaTargetHours: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="wt-satisfaction">Satisfaction Score</Label>
                    <Input id="wt-satisfaction" type="number" step="0.1" value={form.satisfactionScore} onChange={(e) => setForm({ ...form, satisfactionScore: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="wt-resolved">Issues Resolved</Label>
                    <Input id="wt-resolved" type="number" value={form.issuesResolved} onChange={(e) => setForm({ ...form, issuesResolved: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="wt-open">Issues Open</Label>
                    <Input id="wt-open" type="number" value={form.issuesOpen} onChange={(e) => setForm({ ...form, issuesOpen: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="wt-notes">Notes</Label>
                  <Textarea id="wt-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Cancel</Button>} />
                <Button onClick={handleCreate} disabled={submitting || !form.country || !form.startDate || !form.endDate}>
                  {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Warranty Cards */}
      {data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No warranty periods found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((warranty) => {
            const badge = STATUS_BADGE[warranty.status] ?? STATUS_BADGE.active

            return (
              <Card key={warranty.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{warranty.country}</CardTitle>
                    <div className="flex items-center gap-1.5">
                      <Badge className={badge.className}>{badge.label}</Badge>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(warranty)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(warranty.id)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    SLA Target: {warranty.slaTargetHours}h response
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dates */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span>{new Date(warranty.startDate).toLocaleDateString()}</span>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span>{new Date(warranty.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Warranty progress</span>
                      <span>{warranty.daysRemaining > 0 ? `${warranty.daysRemaining}d remaining` : 'Expired'}</span>
                    </div>
                    <Progress value={warranty.progressPct}>
                      <ProgressTrack className="h-1.5">
                        <ProgressIndicator
                          className={
                            warranty.status === 'expired'
                              ? 'bg-red-500'
                              : warranty.status === 'expiring'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }
                        />
                      </ProgressTrack>
                    </Progress>
                  </div>

                  {/* Issues */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      <span>{warranty.issuesResolved} resolved</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <AlertTriangle className="size-3.5 text-amber-600" />
                      <span>{warranty.issuesOpen} open</span>
                    </div>
                  </div>

                  {/* Satisfaction Score */}
                  {warranty.satisfactionScore !== null && (
                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <Star className="size-4 text-amber-500" />
                      <span className="text-sm font-medium">{warranty.satisfactionScore.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">satisfaction</span>
                    </div>
                  )}

                  {/* Notes */}
                  {warranty.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{warranty.notes}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Warranty Period</DialogTitle>
            <DialogDescription>Update the warranty period details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="wt-edit-country">Country</Label>
              <Input id="wt-edit-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="wt-edit-start">Start Date</Label>
                <Input id="wt-edit-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="wt-edit-end">End Date</Label>
                <Input id="wt-edit-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v ?? 'active' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="wt-edit-sla">SLA Target Hours</Label>
                <Input id="wt-edit-sla" type="number" value={form.slaTargetHours} onChange={(e) => setForm({ ...form, slaTargetHours: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="wt-edit-satisfaction">Satisfaction Score</Label>
                <Input id="wt-edit-satisfaction" type="number" step="0.1" value={form.satisfactionScore} onChange={(e) => setForm({ ...form, satisfactionScore: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="wt-edit-resolved">Issues Resolved</Label>
                <Input id="wt-edit-resolved" type="number" value={form.issuesResolved} onChange={(e) => setForm({ ...form, issuesResolved: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="wt-edit-open">Issues Open</Label>
                <Input id="wt-edit-open" type="number" value={form.issuesOpen} onChange={(e) => setForm({ ...form, issuesOpen: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="wt-edit-notes">Notes</Label>
              <Textarea id="wt-edit-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
