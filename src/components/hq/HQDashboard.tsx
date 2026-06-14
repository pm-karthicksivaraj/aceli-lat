'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  BarChart3,
  ClipboardCheck,
  ArrowLeftRight,
  Globe2,
  Activity,
  Loader2,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Lender {
  id: string
  name: string
  institutionType: string
  country: string
  activationScore: number
  status: string
}

interface Scorecard {
  id: string
  lenderId: string
  period: string
  overallScore: number
  lender?: { name: string; country: string }
}

interface SyncRecord {
  id: string
  entity: string
  status: string
  createdAt: string
}

interface ActivityItem {
  id: string
  type: string
  description: string
  timestamp: string
}

export function HQDashboard() {
  const [lenders, setLenders] = useState<Lender[]>([])
  const [scorecards, setScorecards] = useState<Scorecard[]>([])
  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [lendersRes, scorecardsRes, syncRes] = await Promise.all([
          fetch('/api/lenders'),
          fetch('/api/scorecards'),
          fetch('/api/sync-records'),
        ])
        if (lendersRes.ok && !cancelled) {
          const data = await lendersRes.json()
          setLenders(Array.isArray(data) ? data : data.items ?? [])
        }
        if (scorecardsRes.ok && !cancelled) {
          const data = await scorecardsRes.json()
          setScorecards(Array.isArray(data) ? data : data.items ?? [])
        }
        if (syncRes.ok && !cancelled) {
          const data = await syncRes.json()
          setSyncRecords(Array.isArray(data) ? data : data.items ?? [])
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Derived data
  const totalLenders = lenders.length
  const countries = [...new Set(lenders.map((l) => l.country))]
  const lendersByCountry = countries.map((country) => {
    const countryLenders = lenders.filter((l) => l.country === country)
    return {
      country,
      count: countryLenders.length,
      avgScore: countryLenders.length > 0
        ? countryLenders.reduce((sum, l) => sum + l.activationScore, 0) / countryLenders.length
        : 0,
      activeCount: countryLenders.filter((l) => l.status === 'active').length,
    }
  })

  const avgActivationScore = lenders.length > 0
    ? lenders.reduce((sum, l) => sum + l.activationScore, 0) / lenders.length
    : 0

  const pendingReviews = lenders.filter((l) => l.status === 'active').length

  const syncHealthy = syncRecords.length > 0
    ? Math.round(
        (syncRecords.filter((r) => r.status === 'completed').length / syncRecords.length) * 100
      )
    : 100

  // Recent activity timeline
  const recentActivity: ActivityItem[] = [
    ...syncRecords
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        type: 'sync',
        description: `${r.entity} sync ${r.status}`,
        timestamp: r.createdAt,
      })),
    ...scorecards
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        type: 'scorecard',
        description: `Scorecard updated for ${s.lender?.name ?? `Lender ${s.lenderId.slice(-6)}`}`,
        timestamp: new Date().toISOString(),
      })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)

  const summaryCards = [
    {
      title: 'Total Lenders',
      value: totalLenders,
      subtitle: `${countries.length} countries`,
      icon: Building2,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Avg Activation Score',
      value: avgActivationScore.toFixed(1),
      subtitle: 'across all lenders',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'Pending Reviews',
      value: pendingReviews,
      subtitle: 'active lenders',
      icon: ClipboardCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      title: 'Sync Health',
      value: `${syncHealthy}%`,
      subtitle: 'completion rate',
      icon: ArrowLeftRight,
      color: syncHealthy >= 90 ? 'text-emerald-600' : syncHealthy >= 70 ? 'text-amber-600' : 'text-red-600',
      bg: syncHealthy >= 90 ? 'bg-emerald-50 dark:bg-emerald-950/30' : syncHealthy >= 70 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-red-50 dark:bg-red-950/30',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading HQ dashboard…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="size-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">HQ Dashboard</h2>
          <p className="text-sm text-muted-foreground">Executive overview of the Aceli LAT platform</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg p-2.5 ${card.bg}`}>
                <card.icon className={`size-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
                <p className="text-[10px] text-muted-foreground/70">{card.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Country breakdown + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Country breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Globe2 className="size-4" />
              Country Breakdown
            </CardTitle>
            <CardDescription>Lender distribution by country</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Total Lenders</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Avg Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lendersByCountry.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No lender data available
                    </TableCell>
                  </TableRow>
                ) : (
                  lendersByCountry.map((row) => (
                    <TableRow key={row.country}>
                      <TableCell className="font-medium">{row.country}</TableCell>
                      <TableCell>{row.count}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-emerald-600">
                          {row.activeCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${Math.min(100, row.avgScore)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {row.avgScore.toFixed(1)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="size-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentActivity.map((item, i) => (
                  <div key={item.id + i} className="flex items-start gap-3">
                    <div className="mt-0.5 size-2 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs leading-relaxed">{item.description}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="size-2.5" />
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
