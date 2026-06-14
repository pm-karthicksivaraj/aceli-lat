'use client'

import { useEffect, useState, useCallback } from 'react'
import { Globe, CheckCircle2, XCircle, FileCheck, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress, ProgressTrack, ProgressIndicator, ProgressLabel } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CountryReadiness {
  id: string
  rolloutWaveId: string
  dataMigrationComplete: boolean
  rolesConfigured: boolean
  usersTrained: boolean
  integrationVerified: boolean
  signOffDate: string | null
  notes: string | null
  updatedAt: string
  rolloutWave?: {
    id: string
    wave: number
    country: string
    status: string
  } | null
}

interface RolloutWave {
  id: string
  wave: number
  country: string
  status: string
}

const CHECKLIST_ITEMS = [
  { key: 'dataMigrationComplete', label: 'Data Migration' },
  { key: 'rolesConfigured', label: 'Roles Configured' },
  { key: 'usersTrained', label: 'Users Trained' },
  { key: 'integrationVerified', label: 'Integration Verified' },
] as const

const defaultForm = {
  rolloutWaveId: '',
  dataMigrationComplete: false,
  rolesConfigured: false,
  usersTrained: false,
  integrationVerified: false,
  notes: '',
}

export function CountryReadinessView() {
  const [data, setData] = useState<CountryReadiness[]>([])
  const [waves, setWaves] = useState<RolloutWave[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CountryReadiness | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    fetch('/api/country-readiness')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setData(d) })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
    fetch('/api/rollout-waves')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setWaves(d) })
      .catch(() => { /* ignore */ })
  }, [fetchData])

  function getReadinessPercent(item: CountryReadiness): number {
    const checks = [
      item.dataMigrationComplete,
      item.rolesConfigured,
      item.usersTrained,
      item.integrationVerified,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }

  function getOverallStats() {
    const total = data.length
    const complete = data.filter((d) => getReadinessPercent(d) === 100).length
    const signed = data.filter((d) => d.signOffDate).length
    return { total, complete, signed }
  }

  function openEdit(item: CountryReadiness) {
    setEditingItem(item)
    setForm({
      rolloutWaveId: item.rolloutWaveId,
      dataMigrationComplete: item.dataMigrationComplete,
      rolesConfigured: item.rolesConfigured,
      usersTrained: item.usersTrained,
      integrationVerified: item.integrationVerified,
      notes: item.notes ?? '',
    })
    setEditOpen(true)
  }

  async function handleCreate() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/country-readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rolloutWaveId: form.rolloutWaveId,
          dataMigrationComplete: form.dataMigrationComplete,
          rolesConfigured: form.rolesConfigured,
          usersTrained: form.usersTrained,
          integrationVerified: form.integrationVerified,
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
      const res = await fetch(`/api/country-readiness/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rolloutWaveId: form.rolloutWaveId,
          dataMigrationComplete: form.dataMigrationComplete,
          rolesConfigured: form.rolesConfigured,
          usersTrained: form.usersTrained,
          integrationVerified: form.integrationVerified,
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
    if (!confirm('Delete this country readiness record?')) return
    try {
      const res = await fetch(`/api/country-readiness/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch { /* ignore */ }
  }

  const stats = getOverallStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading country readiness...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="flex items-start justify-between">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Globe className="size-4" /> Total Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="size-4" /> Fully Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.complete}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileCheck className="size-4" /> Signed Off
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.signed}</div>
            </CardContent>
          </Card>
        </div>
        <Dialog open={createOpen} onOpenChange={(open) => { if (open) setForm(defaultForm); setCreateOpen(open) }}>
          <DialogTrigger render={<Button size="sm" className="ml-4"><Plus className="size-4 mr-1" />Create</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Country Readiness</DialogTitle>
              <DialogDescription>Add a new country readiness record.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Rollout Wave</Label>
                <Select value={form.rolloutWaveId} onValueChange={(v) => setForm({ ...form, rolloutWaveId: v ?? '' })}>
                  <SelectTrigger><SelectValue placeholder="Select rollout wave" /></SelectTrigger>
                  <SelectContent>
                    {waves.map((w) => (
                      <SelectItem key={w.id} value={w.id}>Wave {w.wave} - {w.country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                {CHECKLIST_ITEMS.map((ci) => (
                  <div key={ci.key} className="flex items-center justify-between">
                    <Label>{ci.label}</Label>
                    <Switch
                      checked={form[ci.key]}
                      onCheckedChange={(checked: boolean) => setForm({ ...form, [ci.key]: checked })}
                    />
                  </div>
                ))}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cr-notes">Notes</Label>
                <Textarea id="cr-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button onClick={handleCreate} disabled={submitting || !form.rolloutWaveId}>
                {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Readiness Matrix */}
      {data.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          No country readiness data available.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead>Wave</TableHead>
                      <TableHead className="text-center">Data Migration</TableHead>
                      <TableHead className="text-center">Roles Configured</TableHead>
                      <TableHead className="text-center">Users Trained</TableHead>
                      <TableHead className="text-center">Integration Verified</TableHead>
                      <TableHead className="text-center">Progress</TableHead>
                      <TableHead>Sign-Off</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => {
                      const country = item.rolloutWave?.country ?? 'Unknown'
                      const wave = item.rolloutWave?.wave ?? '—'
                      const pct = getReadinessPercent(item)
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{country}</TableCell>
                          <TableCell>
                            <Badge variant="outline">Wave {wave}</Badge>
                          </TableCell>
                          {CHECKLIST_ITEMS.map((ci) => {
                            const done = item[ci.key]
                            return (
                              <TableCell key={ci.key} className="text-center">
                                {done ? (
                                  <CheckCircle2 className="size-5 text-green-500 mx-auto" />
                                ) : (
                                  <XCircle className="size-5 text-red-500 mx-auto" />
                                )}
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-center">
                            <div className="flex items-center gap-2">
                              <Progress value={pct} className="flex-1">
                                <ProgressLabel className="sr-only">{country} readiness</ProgressLabel>
                                <ProgressTrack>
                                  <ProgressIndicator
                                    style={{ width: `${pct}%` }}
                                    className={pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
                                  />
                                </ProgressTrack>
                              </Progress>
                              <span className="text-sm font-medium tabular-nums">{pct}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.signOffDate ? (
                              <Badge variant="default">
                                {new Date(item.signOffDate).toLocaleDateString()}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item)}>
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="size-3.5 text-destructive" />
                              </Button>
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

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {data.map((item) => {
              const country = item.rolloutWave?.country ?? 'Unknown'
              const wave = item.rolloutWave?.wave ?? '—'
              const pct = getReadinessPercent(item)
              return (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Globe className="size-4" />
                        {country}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">Wave {wave}</Badge>
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
                    <div className="grid grid-cols-2 gap-2">
                      {CHECKLIST_ITEMS.map((ci) => {
                        const done = item[ci.key]
                        return (
                          <div key={ci.key} className="flex items-center gap-2 text-sm">
                            {done ? (
                              <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                            ) : (
                              <XCircle className="size-4 text-red-500 shrink-0" />
                            )}
                            <span className={done ? '' : 'text-muted-foreground'}>{ci.label}</span>
                          </div>
                        )
                      })}
                    </div>

                    <Progress value={pct}>
                      <ProgressLabel className="sr-only">{country} readiness</ProgressLabel>
                      <ProgressTrack>
                        <ProgressIndicator
                          style={{ width: `${pct}%` }}
                          className={pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
                        />
                      </ProgressTrack>
                    </Progress>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {item.signOffDate
                          ? `Signed off: ${new Date(item.signOffDate).toLocaleDateString()}`
                          : 'Sign-off pending'}
                      </span>
                      {item.notes && <span className="italic truncate max-w-[160px]">{item.notes}</span>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Country Readiness</DialogTitle>
            <DialogDescription>Update the country readiness details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Rollout Wave</Label>
              <Select value={form.rolloutWaveId} onValueChange={(v) => setForm({ ...form, rolloutWaveId: v ?? '' })}>
                <SelectTrigger><SelectValue placeholder="Select rollout wave" /></SelectTrigger>
                <SelectContent>
                  {waves.map((w) => (
                    <SelectItem key={w.id} value={w.id}>Wave {w.wave} - {w.country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              {CHECKLIST_ITEMS.map((ci) => (
                <div key={ci.key} className="flex items-center justify-between">
                  <Label>{ci.label}</Label>
                  <Switch
                    checked={form[ci.key]}
                    onCheckedChange={(checked: boolean) => setForm({ ...form, [ci.key]: checked })}
                  />
                </div>
              ))}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cr-edit-notes">Notes</Label>
              <Textarea id="cr-edit-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={handleEdit} disabled={submitting || !form.rolloutWaveId}>
              {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
