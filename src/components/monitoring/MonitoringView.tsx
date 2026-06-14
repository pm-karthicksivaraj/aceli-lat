'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, Bell, CheckCircle2, Eye, Filter, Plus, Loader2 } from 'lucide-react'
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
import { getLabel } from '@/lib/utils'

interface MonitoringAlert {
  id: string
  type: string
  severity: string
  message: string
  entity: string | null
  entityId: string | null
  country: string | null
  status: string
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

const SEVERITY_CONFIG: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; color: string }> = {
  critical: { variant: 'destructive', icon: AlertTriangle, color: 'text-red-500' },
  warning: { variant: 'secondary', icon: AlertTriangle, color: 'text-yellow-500' },
  info: { variant: 'outline', icon: Bell, color: 'text-blue-500' },
}

const alertTypes = ['sync_failure', 'performance', 'security', 'availability', 'data_quality']
const severities = ['critical', 'warning', 'info']
const alertStatuses = ['active', 'acknowledged', 'resolved']

const ALERT_TYPE_OPTIONS = [
  { value: 'sync_failure', label: 'Sync Failure' },
  { value: 'performance', label: 'Performance' },
  { value: 'security', label: 'Security' },
  { value: 'availability', label: 'Availability' },
  { value: 'data_quality', label: 'Data Quality' },
]

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
]

const defaultForm = {
  type: 'sync_failure',
  severity: 'warning',
  message: '',
  entity: '',
  country: '',
}

export function MonitoringView() {
  const [data, setData] = useState<MonitoringAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    const params = new URLSearchParams()
    if (filterType !== 'all') params.set('type', filterType)
    if (filterSeverity !== 'all') params.set('severity', filterSeverity)
    if (filterStatus !== 'all') params.set('status', filterStatus)

    fetch(`/api/monitoring-alerts?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setData(d) })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [filterType, filterSeverity, filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleAction(id: string, action: 'acknowledge' | 'resolve') {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/monitoring-alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCreate() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/monitoring-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          severity: form.severity,
          message: form.message,
          entity: form.entity || null,
          country: form.country || null,
        }),
      })
      if (res.ok) {
        setCreateOpen(false)
        setForm(defaultForm)
        fetchData()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const activeCount = data.filter((d) => d.status === 'active').length
  const criticalCount = data.filter((d) => d.severity === 'critical' && d.status !== 'resolved').length
  const resolvedCount = data.filter((d) => d.status === 'resolved').length

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Bell className="size-4" /> Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="size-4" /> Critical Unresolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="size-4" /> Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{resolvedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Create */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="size-4 text-muted-foreground" />
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {alertTypes.map((t) => (
              <SelectItem key={t} value={t}>{getLabel(t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={(v) => setFilterSeverity(v ?? 'all')}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {severities.map((s) => (
              <SelectItem key={s} value={s}>{getLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {alertStatuses.map((s) => (
              <SelectItem key={s} value={s}>{getLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterType !== 'all' || filterSeverity !== 'all' || filterStatus !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterType('all')
              setFilterSeverity('all')
              setFilterStatus('all')
            }}
          >
            Clear Filters
          </Button>
        )}
        <div className="ml-auto">
          <Dialog open={createOpen} onOpenChange={(open) => { if (open) setForm(defaultForm); setCreateOpen(open) }}>
            <DialogTrigger render={<Button size="sm"><Plus className="size-4 mr-1" />Create Alert</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Monitoring Alert</DialogTitle>
                <DialogDescription>Manually create a new monitoring alert.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? 'sync_failure' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALERT_TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Severity</Label>
                  <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v ?? 'warning' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ma-message">Message</Label>
                  <Textarea id="ma-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Alert message" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="ma-entity">Entity</Label>
                    <Input id="ma-entity" value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })} placeholder="e.g. Lender" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="ma-country">Country</Label>
                    <Input id="ma-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. Kenya" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Cancel</Button>} />
                <Button onClick={handleCreate} disabled={submitting || !form.message}>
                  {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alert Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading alerts...</div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          No monitoring alerts found.
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {data.map((alert) => {
            const sevConfig = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info
            const SevIcon = sevConfig.icon
            return (
              <Card key={alert.id} className={alert.status === 'resolved' ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <SevIcon className={`size-4 ${sevConfig.color}`} />
                      {getLabel(alert.type)}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={sevConfig.variant}>{getLabel(alert.severity)}</Badge>
                      <Badge
                        variant={
                          alert.status === 'resolved'
                            ? 'default'
                            : alert.status === 'acknowledged'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {getLabel(alert.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{alert.message}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {alert.entity && <span>Entity: {alert.entity}</span>}
                    {alert.country && <span>Country: {alert.country}</span>}
                    <span>{new Date(alert.createdAt).toLocaleString()}</span>
                    {alert.resolvedAt && (
                      <span>Resolved: {new Date(alert.resolvedAt).toLocaleString()}</span>
                    )}
                  </div>

                  {/* Actions */}
                  {alert.status === 'active' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(alert.id, 'acknowledge')}
                        disabled={actionLoading === alert.id}
                      >
                        <Eye className="size-3.5" />
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAction(alert.id, 'resolve')}
                        disabled={actionLoading === alert.id}
                      >
                        <CheckCircle2 className="size-3.5" />
                        Resolve
                      </Button>
                    </div>
                  )}
                  {alert.status === 'acknowledged' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAction(alert.id, 'resolve')}
                        disabled={actionLoading === alert.id}
                      >
                        <CheckCircle2 className="size-3.5" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
