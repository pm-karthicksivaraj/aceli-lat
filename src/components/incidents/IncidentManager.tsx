'use client'

import { useEffect, useState } from 'react'
import { AlertOctagon, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Incident {
  id: string
  title: string
  description: string
  severity: string
  country: string | null
  status: string
  reporter: string | null
  assignee: string | null
  timeline: string | null
  resolution: string | null
  rootCause: string | null
  startedAt: string
  resolvedAt: string | null
}

const SEVERITY_BADGE: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_BADGE: Record<string, string> = {
  reported: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  investigating: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  mitigated: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  closed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const COUNTRIES = ['Kenya', 'Uganda', 'Tanzania', 'Ethiopia', 'Nigeria', 'Ghana']

export function IncidentManager() {
  const [data, setData] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'medium',
    country: '',
    reporter: '',
  })

  function fetchData() {
    const params = new URLSearchParams()
    if (severityFilter !== 'all') params.set('severity', severityFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (countryFilter !== 'all') params.set('country', countryFilter)
    fetch(`/api/incidents?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severityFilter, statusFilter, countryFilter])

  async function handleCreate() {
    await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setDialogOpen(false)
    setForm({ title: '', description: '', severity: 'medium', country: '', reporter: '' })
    fetchData()
  }

  function parseTimeline(timeline: string | null): Array<{ timestamp: string; action: string; by: string }> {
    if (!timeline) return []
    try {
      return JSON.parse(timeline)
    } catch {
      return []
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Incident Manager</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="reported">Reported</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="mitigated">Mitigated</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm"><Plus className="size-4" />New Incident</Button>} />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Incident</DialogTitle>
                <DialogDescription>Report a new incident for tracking and resolution.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="inc-title">Title</Label>
                  <Input id="inc-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Incident title" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="inc-desc">Description</Label>
                  <Textarea id="inc-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What happened?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Severity</Label>
                    <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v ?? 'medium' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Country</Label>
                    <Select value={form.country} onValueChange={(v) => setForm((f) => ({ ...f, country: v ?? '' }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="inc-reporter">Reporter</Label>
                  <Input id="inc-reporter" value={form.reporter} onChange={(e) => setForm((f) => ({ ...f, reporter: e.target.value }))} placeholder="Who reported?" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!form.title}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No incidents found.</div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((incident) => {
                    const timeline = parseTimeline(incident.timeline)
                    return (
                      <TableRow key={incident.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{incident.title}</div>
                            {timeline.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {timeline.length} timeline event{timeline.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={SEVERITY_BADGE[incident.severity] ?? SEVERITY_BADGE.medium}>
                            {incident.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGE[incident.status] ?? STATUS_BADGE.reported}>
                            {incident.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{incident.country ?? '—'}</TableCell>
                        <TableCell>{incident.assignee ?? 'Unassigned'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(incident.startedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
