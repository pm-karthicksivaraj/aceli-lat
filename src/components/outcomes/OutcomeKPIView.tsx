'use client'

import { useEffect, useState } from 'react'
import { Target, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
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

export function OutcomeKPIView() {
  const [data, setData] = useState<OutcomeKPI[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const params = new URLSearchParams()
    if (categoryFilter !== 'all') params.set('category', categoryFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    fetch(`/api/outcome-kpis?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [categoryFilter, statusFilter])

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
                          <Badge className={badge.className}>{badge.label}</Badge>
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
    </div>
  )
}
