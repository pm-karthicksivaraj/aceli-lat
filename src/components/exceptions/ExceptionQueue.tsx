'use client'

import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

interface Exception {
  id: string
  entity: string
  entityId: string
  type: string
  severity: string
  message: string
  status: string
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

const SEVERITY_BADGES: Record<string, { variant: 'destructive' | 'outline' | 'secondary' | 'ghost'; label: string }> = {
  critical: { variant: 'destructive', label: 'Critical' },
  high: { variant: 'destructive', label: 'High' },
  medium: { variant: 'outline', label: 'Medium' },
  low: { variant: 'secondary', label: 'Low' },
}

const STATUS_BADGES: Record<string, { variant: 'secondary' | 'outline' | 'ghost' | 'default'; label: string }> = {
  open: { variant: 'default', label: 'Open' },
  in_progress: { variant: 'secondary', label: 'In Progress' },
  resolved: { variant: 'outline', label: 'Resolved' },
  dismissed: { variant: 'ghost', label: 'Dismissed' },
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'missing_field', label: 'Missing Field' },
  { value: 'low_confidence', label: 'Low Confidence' },
  { value: 'conflict', label: 'Conflict' },
  { value: 'invalid_transition', label: 'Invalid Transition' },
  { value: 'sync_failed', label: 'Sync Failed' },
  { value: 'reviewer_rejection', label: 'Reviewer Rejection' },
]

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
]

export function ExceptionQueue() {
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [actionException, setActionException] = useState<Exception | null>(null)
  const [actionType, setActionType] = useState<'resolve' | 'dismiss'>('resolve')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const params = new URLSearchParams()
        if (typeFilter !== 'all') params.set('type', typeFilter)
        if (severityFilter !== 'all') params.set('severity', severityFilter)
        if (statusFilter !== 'all') params.set('status', statusFilter)
        const res = await fetch(`/api/exceptions?${params.toString()}`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setExceptions(Array.isArray(data) ? data : data.items ?? [])
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [typeFilter, severityFilter, statusFilter])

  async function refetchExceptions() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (severityFilter !== 'all') params.set('severity', severityFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/exceptions?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setExceptions(Array.isArray(data) ? data : data.items ?? [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  function openAction(exception: Exception, type: 'resolve' | 'dismiss') {
    setActionException(exception)
    setActionType(type)
    setNotes('')
    setDialogOpen(true)
  }

  async function submitAction() {
    if (!actionException) return
    setSubmitting(true)
    try {
      const newStatus = actionType === 'resolve' ? 'resolved' : 'dismissed'
      await fetch(`/api/exceptions/${actionException.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes }),
      })
      setDialogOpen(false)
      refetchExceptions()
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = exceptions

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AlertTriangle className="size-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Exception Queue</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} exception{filtered.length !== 1 ? 's' : ''} found
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
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v ?? 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
          <span className="ml-2 text-sm text-muted-foreground">Loading exceptions…</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No exceptions found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[28rem] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead className="min-w-[200px]">Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((ex) => {
                    const sev = SEVERITY_BADGES[ex.severity] ?? { variant: 'secondary' as const, label: ex.severity }
                    const st = STATUS_BADGES[ex.status] ?? { variant: 'secondary' as const, label: ex.status }
                    const canAct = ex.status === 'open' || ex.status === 'in_progress'
                    return (
                      <TableRow key={ex.id}>
                        <TableCell>
                          <Badge variant={sev.variant}>{sev.label}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-xs">
                          {ex.type.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {ex.entity}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate text-xs">
                          {ex.message}
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(ex.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {canAct ? (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" onClick={() => openAction(ex, 'resolve')}>
                                <CheckCircle2 className="mr-1 size-3.5" />
                                Resolve
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openAction(ex, 'dismiss')}>
                                <XCircle className="mr-1 size-3.5" />
                                Dismiss
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {ex.resolvedBy ? `by ${ex.resolvedBy}` : '—'}
                            </span>
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

      {/* Action dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'resolve' ? 'Resolve Exception' : 'Dismiss Exception'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'resolve'
                ? 'Mark this exception as resolved with optional notes.'
                : 'Dismiss this exception as not applicable.'}
            </DialogDescription>
          </DialogHeader>

          {actionException && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Exception</p>
              <p className="text-sm">{actionException.message}</p>
              <p className="text-xs text-muted-foreground">
                {actionException.entity} · {actionException.type.replace(/_/g, ' ')}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Notes</p>
            <Textarea
              placeholder="Add any relevant notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              onClick={submitAction}
              disabled={submitting}
              variant={actionType === 'dismiss' ? 'outline' : 'default'}
            >
              {submitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              {actionType === 'resolve' ? 'Resolve' : 'Dismiss'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
