'use client'

import { useEffect, useState } from 'react'
import { Shield, Calendar, Clock, AlertTriangle, CheckCircle2, Star } from 'lucide-react'
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

function enrichWarranty(item: WarrantyPeriodRaw, now: number): WarrantyPeriod {
  const daysRemaining = Math.ceil(
    (new Date(item.endDate).getTime() - now) / (1000 * 60 * 60 * 24)
  )
  const total = new Date(item.endDate).getTime() - new Date(item.startDate).getTime()
  const elapsed = now - new Date(item.startDate).getTime()
  const progressPct = total <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))

  return { ...item, daysRemaining, progressPct }
}

export function WarrantyTracker() {
  const [data, setData] = useState<WarrantyPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')

  useEffect(() => {
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

  const countries = [...new Set(data.map((w) => w.country))]

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
        <div className="flex flex-wrap gap-2">
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
                    <Badge className={badge.className}>{badge.label}</Badge>
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
    </div>
  )
}
