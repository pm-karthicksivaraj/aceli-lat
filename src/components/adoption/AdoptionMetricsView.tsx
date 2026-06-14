'use client'

import { useEffect, useState } from 'react'
import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AdoptionMetric {
  id: string
  metric: string
  country: string
  period: string
  value: number
  target: number | null
  previousPeriod: number | null
  unit: string
  collectedAt: string
}

const METRIC_LABELS: Record<string, string> = {
  daily_active_users: 'Daily Active Users',
  weekly_active_users: 'Weekly Active Users',
  meetings_logged: 'Meetings Logged',
  extractions_reviewed: 'Extractions Reviewed',
  sync_success_rate: 'Sync Success Rate',
}

const METRIC_ICONS: Record<string, string> = {
  daily_active_users: '👤',
  weekly_active_users: '👥',
  meetings_logged: '📅',
  extractions_reviewed: '✅',
  sync_success_rate: '🔄',
}

const COUNTRIES = ['Kenya', 'Uganda', 'Tanzania', 'Ethiopia', 'Nigeria', 'Ghana']

export function AdoptionMetricsView() {
  const [data, setData] = useState<AdoptionMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [countryFilter, setCountryFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

  useEffect(() => {
    const params = new URLSearchParams()
    if (countryFilter !== 'all') params.set('country', countryFilter)
    if (periodFilter !== 'all') params.set('period', periodFilter)
    fetch(`/api/adoption-metrics?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [countryFilter, periodFilter])

  // Group by country
  const grouped = data.reduce<Record<string, AdoptionMetric[]>>((acc, m) => {
    if (!acc[m.country]) acc[m.country] = []
    acc[m.country].push(m)
    return acc
  }, {})

  function getTrend(m: AdoptionMetric) {
    if (m.previousPeriod === null) return null
    const diff = m.value - m.previousPeriod
    const pctDiff = m.previousPeriod !== 0 ? Math.round((diff / m.previousPeriod) * 100) : 0
    if (diff > 0) return { direction: 'up' as const, pct: pctDiff, icon: <TrendingUp className="size-3.5 text-emerald-600" /> }
    if (diff < 0) return { direction: 'down' as const, pct: pctDiff, icon: <TrendingDown className="size-3.5 text-red-600" /> }
    return { direction: 'flat' as const, pct: 0, icon: <Minus className="size-3.5 text-muted-foreground" /> }
  }

  function getProgressPercent(m: AdoptionMetric): number {
    if (m.target === null || m.target === 0) return 0
    return Math.min(100, Math.max(0, Math.round((m.value / m.target) * 100)))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Adoption Metrics</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-28 rounded bg-muted" />
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
          <Users className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Adoption Metrics</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {[...new Set(data.map((m) => m.period))].map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metric Cards grouped by country */}
      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No adoption metrics found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([country, metrics]) => (
            <div key={country}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                {country}
                <Badge variant="outline" className="text-[10px]">{metrics.length} metrics</Badge>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.map((m) => {
                  const trend = getTrend(m)
                  const progressPct = getProgressPercent(m)

                  return (
                    <Card key={m.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <span>{METRIC_ICONS[m.metric] ?? '📊'}</span>
                          {METRIC_LABELS[m.metric] ?? m.metric.replace(/_/g, ' ')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Value vs Target */}
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-2xl font-bold">
                              {m.unit === 'percent' ? `${m.value.toFixed(1)}%` : m.value.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {m.period} · {m.unit}
                            </div>
                          </div>
                          {trend && (
                            <div className="flex items-center gap-1 text-sm">
                              {trend.icon}
                              <span className={
                                trend.direction === 'up' ? 'text-emerald-600 font-medium'
                                : trend.direction === 'down' ? 'text-red-600 font-medium'
                                : 'text-muted-foreground'
                              }>
                                {trend.pct > 0 ? '+' : ''}{trend.pct}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Target progress */}
                        {m.target !== null && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>vs Target: {m.unit === 'percent' ? `${m.target.toFixed(1)}%` : m.target.toLocaleString()}</span>
                              <span>{progressPct}%</span>
                            </div>
                            <Progress value={progressPct}>
                              <ProgressTrack className="h-1.5">
                                <ProgressIndicator className={progressPct >= 100 ? 'bg-emerald-500' : 'bg-primary'} />
                              </ProgressTrack>
                            </Progress>
                          </div>
                        )}

                        {/* Previous period */}
                        {m.previousPeriod !== null && (
                          <div className="text-xs text-muted-foreground">
                            Previous: {m.unit === 'percent' ? `${m.previousPeriod.toFixed(1)}%` : m.previousPeriod.toLocaleString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
