'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Bell, CheckCircle2, Eye, Filter } from 'lucide-react'
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

export function MonitoringView() {
  const [data, setData] = useState<MonitoringAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
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

  async function handleAction(id: string, action: 'acknowledge' | 'resolve') {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/monitoring-alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        // Re-fetch
        const params = new URLSearchParams()
        if (filterType !== 'all') params.set('type', filterType)
        if (filterSeverity !== 'all') params.set('severity', filterSeverity)
        if (filterStatus !== 'all') params.set('status', filterStatus)
        fetch(`/api/monitoring-alerts?${params.toString()}`)
          .then((r) => r.json())
          .then((d) => { if (Array.isArray(d)) setData(d) })
          .catch(() => { /* ignore */ })
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="size-4 text-muted-foreground" />
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {alertTypes.map((t) => (
              <SelectItem key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</SelectItem>
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
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
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
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
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
                      {alert.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={sevConfig.variant}>{alert.severity}</Badge>
                      <Badge
                        variant={
                          alert.status === 'resolved'
                            ? 'default'
                            : alert.status === 'acknowledged'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {alert.status}
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
