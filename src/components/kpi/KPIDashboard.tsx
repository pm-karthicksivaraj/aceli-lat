'use client'

import { useEffect, useState } from 'react'
import { Target, TrendingUp, BarChart3, Filter } from 'lucide-react'
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
import { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue } from '@/components/ui/progress'

interface KPIData {
  id: string
  kpiName: string
  country: string
  period: string
  baseline: number | null
  actual: number | null
  target: number | null
  unit: string
  source: string
  lender?: { id: string; name: string } | null
}

export function KPIDashboard() {
  const [data, setData] = useState<KPIData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterKpiName, setFilterKpiName] = useState('all')
  const [filterCountry, setFilterCountry] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('all')

  useEffect(() => {
    const params = new URLSearchParams()
    if (filterKpiName !== 'all') params.set('kpiName', filterKpiName)
    if (filterCountry !== 'all') params.set('country', filterCountry)
    if (filterPeriod !== 'all') params.set('period', filterPeriod)

    fetch(`/api/kpis?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setData(d) })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [filterKpiName, filterCountry, filterPeriod])

  const kpiNames = [...new Set(data.map((d) => d.kpiName))]
  const countries = [...new Set(data.map((d) => d.country))]
  const periods = [...new Set(data.map((d) => d.period))]

  function getProgressPercent(item: KPIData): number {
    if (item.target == null || item.baseline == null || item.actual == null) return 0
    const range = item.target - item.baseline
    if (range === 0) return item.actual >= item.target ? 100 : 0
    const pct = ((item.actual - item.baseline) / range) * 100
    return Math.min(Math.max(pct, 0), 100)
  }

  function getStatusBadge(item: KPIData) {
    if (item.actual == null || item.target == null) return <Badge variant="secondary">No Data</Badge>
    const pct = getProgressPercent(item)
    if (pct >= 100) return <Badge variant="default">On Target</Badge>
    if (pct >= 70) return <Badge variant="outline">Near Target</Badge>
    return <Badge variant="destructive">Below Target</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="size-4 text-muted-foreground" />
        <Select value={filterKpiName} onValueChange={(v) => setFilterKpiName(v ?? 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All KPIs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KPIs</SelectItem>
            {kpiNames.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCountry} onValueChange={(v) => setFilterCountry(v ?? 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v ?? 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Periods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Periods</SelectItem>
            {periods.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterKpiName !== 'all' || filterCountry !== 'all' || filterPeriod !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterKpiName('all')
              setFilterCountry('all')
              setFilterPeriod('all')
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Target className="size-4" /> Total KPIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" /> On Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.filter((d) => getProgressPercent(d) >= 100).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BarChart3 className="size-4" /> Avg Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.length > 0
                ? `${Math.round(data.reduce((sum, d) => sum + getProgressPercent(d), 0) / data.length)}%`
                : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading KPIs...</div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          No KPI measurements found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">{item.kpiName}</CardTitle>
                  {getStatusBadge(item)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{item.country}</span>
                  <span>·</span>
                  <span>{item.period}</span>
                  {item.lender && (
                    <>
                      <span>·</span>
                      <span>{item.lender.name}</span>
                    </>
                  )}
                </div>

                {/* Baseline / Actual / Target */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Baseline</div>
                    <div className="text-sm font-semibold">
                      {item.baseline != null ? `${item.baseline}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Actual</div>
                    <div className="text-sm font-semibold text-primary">
                      {item.actual != null ? `${item.actual}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Target</div>
                    <div className="text-sm font-semibold">
                      {item.target != null ? `${item.target}` : '—'}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <Progress value={getProgressPercent(item)}>
                  <ProgressLabel className="sr-only">{item.kpiName} progress</ProgressLabel>
                  <ProgressValue>{Math.round(getProgressPercent(item))}%</ProgressValue>
                  <ProgressTrack>
                    <ProgressIndicator
                      style={{ width: `${getProgressPercent(item)}%` }}
                      className={
                        getProgressPercent(item) >= 100
                          ? 'bg-green-500'
                          : getProgressPercent(item) >= 70
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }
                    />
                  </ProgressTrack>
                </Progress>

                <div className="text-xs text-muted-foreground">
                  Unit: {item.unit} · Source: {item.source}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
