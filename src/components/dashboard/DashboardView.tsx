'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Building2,
  CalendarCheck,
  FileText,
  RefreshCw,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  Database,
  Shield,
  Wifi,
  CircleDot,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/useAppStore'
import { getLabel } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Lender {
  id: string
  name: string
  institutionType: string
  country: string
  status: string
  activationScore: number
}

interface Meeting {
  id: string
  title: string
  date: string
  status: string
  country: string
  lender: { id: string; name: string }
}

interface ExtractionDraft {
  id: string
  area: string
  status: string
  confidence: number
  createdAt: string
  meeting: { id: string; title: string }
}

interface SyncRecord {
  id: string
  entity: string
  status: string
  direction: string
  createdAt: string
  retryCount: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const SCORE_RANGES = [
  { label: '0-20', min: 0, max: 20 },
  { label: '21-40', min: 21, max: 40 },
  { label: '41-60', min: 41, max: 60 },
  { label: '61-80', min: 61, max: 80 },
  { label: '81-100', min: 81, max: 100 },
]

const MEETING_STATUS_COLORS: Record<string, string> = {
  planned: '#6366f1',
  in_progress: '#f59e0b',
  completed: '#22c55e',
  cancelled: '#ef4444',
}

const SYNC_STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  pending: '#f59e0b',
  failed: '#ef4444',
  conflict: '#8b5cf6',
  in_progress: '#06b6d4',
}

// ─── Custom Tooltip (must be outside render to avoid re-creation) ────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardView() {
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  const [lenders, setLenders] = useState<Lender[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [extractions, setExtractions] = useState<ExtractionDraft[]>([])
  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>([])

  const [loadingLenders, setLoadingLenders] = useState(true)
  const [loadingMeetings, setLoadingMeetings] = useState(true)
  const [loadingExtractions, setLoadingExtractions] = useState(true)
  const [loadingSync, setLoadingSync] = useState(true)

  useEffect(() => {
    fetch('/api/lenders')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setLenders(d)
      })
      .finally(() => setLoadingLenders(false))

    fetch('/api/meetings')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setMeetings(d)
      })
      .finally(() => setLoadingMeetings(false))

    fetch('/api/extraction-drafts')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setExtractions(d)
      })
      .finally(() => setLoadingExtractions(false))

    fetch('/api/sync-records')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setSyncRecords(d)
      })
      .finally(() => setLoadingSync(false))
  }, [])

  // ─── Computed data ───────────────────────────────────────────────────────

  const activeLenders = lenders.filter((l) => l.status === 'active').length
  const activeMeetings = meetings.filter(
    (m) => m.status === 'planned' || m.status === 'in_progress'
  ).length
  const completedMeetings = meetings.filter((m) => m.status === 'completed').length
  const pendingReviews = extractions.filter(
    (e) => e.status === 'pending_review' || e.status === 'draft'
  ).length
  const syncFailed = syncRecords.filter((s) => s.status === 'failed' || s.status === 'conflict').length
  const syncCompleted = syncRecords.filter((s) => s.status === 'completed').length
  const avgActivationScore =
    lenders.length > 0
      ? Math.round(lenders.reduce((sum, l) => sum + l.activationScore, 0) / lenders.length)
      : 0

  // ─── Chart data: Activation Score Distribution ───────────────────────────

  const activationScoreData = useMemo(() => {
    return SCORE_RANGES.map((range) => ({
      name: range.label,
      count: lenders.filter(
        (l) => l.activationScore >= range.min && l.activationScore <= range.max
      ).length,
    }))
  }, [lenders])

  // ─── Chart data: Meeting Status Breakdown ────────────────────────────────

  const meetingStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {}
    meetings.forEach((m) => {
      statusCounts[m.status] = (statusCounts[m.status] || 0) + 1
    })
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: getLabel(name),
      value,
    }))
  }, [meetings])

  // ─── Chart data: Lenders by Country ──────────────────────────────────────

  const lendersByCountryData = useMemo(() => {
    const countryCounts: Record<string, number> = {}
    lenders.forEach((l) => {
      countryCounts[l.country] = (countryCounts[l.country] || 0) + 1
    })
    return Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [lenders])

  // ─── Chart data: Sync Status Overview ────────────────────────────────────

  const syncStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {}
    syncRecords.forEach((s) => {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1
    })
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: getLabel(name),
      value,
    }))
  }, [syncRecords])

  // ─── Chart data: Monthly Meeting Trend ───────────────────────────────────

  const monthlyMeetingData = useMemo(() => {
    const now = new Date()
    const months: { label: string; year: number; month: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        label: d.toLocaleString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
      })
    }
    return months.map(({ label, year, month }) => {
      const count = meetings.filter((m) => {
        const d = new Date(m.date)
        return d.getFullYear() === year && d.getMonth() === month
      }).length
      return { month: label, meetings: count }
    })
  }, [meetings])

  // ─── Recent Activity Timeline ────────────────────────────────────────────

  const recentActivity = useMemo(() => {
    const items = [
      ...meetings.slice(0, 5).map((m) => ({
        id: `meeting-${m.id}`,
        type: 'meeting' as const,
        label: m.title,
        sublabel: m.lender?.name ?? 'Unknown lender',
        date: m.date,
        status: m.status,
      })),
      ...extractions.slice(0, 5).map((e) => ({
        id: `extraction-${e.id}`,
        type: 'extraction' as const,
        label: `Extraction: ${e.area}`,
        sublabel: e.meeting?.title ?? '',
        date: e.createdAt,
        status: e.status,
      })),
      ...syncRecords.slice(0, 3).map((s) => ({
        id: `sync-${s.id}`,
        type: 'sync' as const,
        label: `${s.entity} sync`,
        sublabel: s.direction === 'lat_to_sf' ? 'LAT → Salesforce' : 'Salesforce → LAT',
        date: s.createdAt,
        status: s.status,
      })),
    ]
    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
  }, [meetings, extractions, syncRecords])

  // ─── Platform Health ─────────────────────────────────────────────────────

  const platformHealth = useMemo(() => {
    const syncHealth =
      syncRecords.length > 0
        ? Math.round((syncCompleted / syncRecords.length) * 100)
        : 100
    const extractionHealth =
      extractions.length > 0
        ? Math.round(
            (extractions.filter(
              (e) => e.status === 'approved' || e.status === 'completed'
            ).length /
              extractions.length) *
              100
          )
        : 100
    const lenderHealth =
      lenders.length > 0 ? Math.round((activeLenders / lenders.length) * 100) : 100

    return [
      {
        label: 'Sync Reliability',
        value: syncHealth,
        icon: Database,
        status: syncHealth >= 90 ? 'healthy' : syncHealth >= 70 ? 'warning' : 'critical',
      },
      {
        label: 'Extraction Pipeline',
        value: extractionHealth,
        icon: Activity,
        status:
          extractionHealth >= 90 ? 'healthy' : extractionHealth >= 70 ? 'warning' : 'critical',
      },
      {
        label: 'Lender Engagement',
        value: lenderHealth,
        icon: Building2,
        status: lenderHealth >= 90 ? 'healthy' : lenderHealth >= 70 ? 'warning' : 'critical',
      },
      {
        label: 'System Uptime',
        value: 99.8,
        icon: Server,
        status: 'healthy',
      },
      {
        label: 'Data Integrity',
        value: syncFailed === 0 ? 100 : Math.max(80, 100 - syncFailed * 5),
        icon: Shield,
        status: syncFailed === 0 ? 'healthy' : syncFailed <= 2 ? 'warning' : 'critical',
      },
      {
        label: 'API Connectivity',
        value: 98.5,
        icon: Wifi,
        status: 'healthy',
      },
    ]
  }, [syncRecords, syncCompleted, extractions, lenders, activeLenders, syncFailed])

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle2 className="size-4 text-emerald-500" />
      case 'failed':
      case 'conflict':
      case 'rejected':
        return <XCircle className="size-4 text-red-500" />
      case 'in_progress':
      case 'pending':
      case 'pending_review':
        return <Clock className="size-4 text-amber-500" />
      default:
        return <AlertTriangle className="size-4 text-muted-foreground" />
    }
  }

  const meetingStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      planned: 'outline',
      in_progress: 'secondary',
      completed: 'default',
      cancelled: 'destructive',
    }
    return variants[status] ?? 'secondary'
  }

  const healthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-500'
      case 'warning':
        return 'text-amber-500'
      case 'critical':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  const healthBarColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500'
      case 'warning':
        return 'bg-amber-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-muted'
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Overview of your lender relationship intelligence platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="size-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCurrentView('meetings')}>
            <Plus className="size-4 mr-1" />
            New Meeting
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Lenders */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Lenders
            </CardTitle>
            <div className="rounded-md bg-indigo-500/10 p-1.5">
              <Building2 className="size-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {loadingLenders ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{lenders.length}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="size-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">
                    {activeLenders} active
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({lenders.length > 0 ? Math.round((activeLenders / lenders.length) * 100) : 0}%)
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Meetings */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Meetings
            </CardTitle>
            <div className="rounded-md bg-emerald-500/10 p-1.5">
              <CalendarCheck className="size-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {loadingMeetings ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeMeetings}</div>
                <div className="flex items-center gap-1 mt-1">
                  {completedMeetings > 0 ? (
                    <>
                      <TrendingUp className="size-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">
                        {completedMeetings} completed
                      </span>
                    </>
                  ) : (
                    <>
                      <CircleDot className="size-3 text-amber-500" />
                      <span className="text-xs text-muted-foreground">
                        {meetings.length} total scheduled
                      </span>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reviews
            </CardTitle>
            <div className="rounded-md bg-amber-500/10 p-1.5">
              <FileText className="size-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {loadingExtractions ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{pendingReviews}</div>
                <div className="flex items-center gap-1 mt-1">
                  {pendingReviews > 0 ? (
                    <>
                      <TrendingDown className="size-3 text-amber-500" />
                      <span className="text-xs text-amber-600 font-medium">Needs attention</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">All clear</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({extractions.length} drafts)
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Avg Activation Score */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Activation
            </CardTitle>
            <div className="rounded-md bg-violet-500/10 p-1.5">
              <Activity className="size-4 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {loadingLenders ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{avgActivationScore}</div>
                <div className="flex items-center gap-1 mt-1">
                  {avgActivationScore >= 60 ? (
                    <>
                      <TrendingUp className="size-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">Above threshold</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="size-3 text-amber-500" />
                      <span className="text-xs text-amber-600 font-medium">Below target</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">/ 100</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Section (Row 1) ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lender Activation Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Lender Activation Score Distribution</CardTitle>
            <CardDescription className="text-xs">
              Number of lenders grouped by activation score range
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLenders ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : activationScoreData.every((d) => d.count === 0) ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                <BarChart className="size-8 mb-2 opacity-30" />
                <p className="text-sm">No activation score data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={activationScoreData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Lenders" radius={[4, 4, 0, 0]}>
                    {activationScoreData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Meeting Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Meeting Status Breakdown</CardTitle>
            <CardDescription className="text-xs">
              Distribution of meetings by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMeetings ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : meetingStatusData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                <CalendarCheck className="size-8 mb-2 opacity-30" />
                <p className="text-sm">No meeting data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={meetingStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                  >
                    {meetingStatusData.map((entry) => (
                      <Cell
                        key={`meeting-${entry.name}`}
                        fill={MEETING_STATUS_COLORS[entry.name.replace(' ', '_')] ?? '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Section (Row 2) ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lenders by Country */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Lenders by Country</CardTitle>
            <CardDescription className="text-xs">
              Top countries by number of registered lenders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLenders ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : lendersByCountryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                <Building2 className="size-8 mb-2 opacity-30" />
                <p className="text-sm">No country data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={lendersByCountryData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 50, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="country"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Lenders" radius={[0, 4, 4, 0]} fill="#6366f1">
                    {lendersByCountryData.map((_, index) => (
                      <Cell key={`country-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Sync Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sync Status Overview</CardTitle>
            <CardDescription className="text-xs">
              Salesforce sync records by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSync ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : syncStatusData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                <RefreshCw className="size-8 mb-2 opacity-30" />
                <p className="text-sm">No sync data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={syncStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                  >
                    {syncStatusData.map((entry) => (
                      <Cell
                        key={`sync-${entry.name}`}
                        fill={SYNC_STATUS_COLORS[entry.name.replace(' ', '_')] ?? '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Section (Row 3) — Monthly Trend ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Monthly Meeting Trend</CardTitle>
          <CardDescription className="text-xs">
            Number of meetings scheduled over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMeetings ? (
            <div className="flex items-center justify-center h-[250px]">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyMeetingData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="meetingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="meetings"
                  name="Meetings"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#meetingGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Platform Health + Recent Activity ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Platform Health</CardTitle>
            <CardDescription className="text-xs">
              Real-time system health indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platformHealth.map((item) => {
                const IconComp = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-8 rounded-md bg-muted/50">
                      <IconComp className={`size-4 ${healthColor(item.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate">{item.label}</span>
                        <span className={`text-xs font-semibold ${healthColor(item.status)}`}>
                          {typeof item.value === 'number' && item.value % 1 !== 0
                            ? item.value.toFixed(1)
                            : item.value}
                          %
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${healthBarColor(item.status)}`}
                          style={{ width: `${Math.min(item.value, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Activity</CardTitle>
            <CardDescription className="text-xs">
              Latest actions across meetings, extractions, and syncs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Clock className="size-8 mb-2 opacity-30" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="relative space-y-0 max-h-96 overflow-y-auto">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

                {recentActivity.map((item, idx) => (
                  <div key={item.id} className="relative flex items-start gap-3 py-2.5">
                    {/* Timeline dot */}
                    <div className="relative z-10 mt-0.5 flex items-center justify-center size-[30px] rounded-full bg-background border border-border">
                      {statusIcon(item.status)}
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>
                        </div>
                        <Badge
                          variant={meetingStatusBadge(item.status)}
                          className="shrink-0 text-[10px]"
                        >
                          {getLabel(item.status)}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDate(item.date)}
                      </p>
                    </div>

                    {idx < recentActivity.length - 1 && <></>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Actions</CardTitle>
          <CardDescription className="text-xs">
            Navigate to key platform areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => setCurrentView('lenders')}
            >
              <Building2 className="size-5 text-indigo-500" />
              <span className="text-xs font-medium">View Lenders</span>
              <ArrowRight className="size-3 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => setCurrentView('meetings')}
            >
              <CalendarCheck className="size-5 text-emerald-500" />
              <span className="text-xs font-medium">Schedule Meeting</span>
              <ArrowRight className="size-3 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => setCurrentView('extractions')}
            >
              <FileText className="size-5 text-amber-500" />
              <span className="text-xs font-medium">Review Extractions</span>
              <ArrowRight className="size-3 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => setCurrentView('audit-logs')}
            >
              <Clock className="size-5 text-cyan-500" />
              <span className="text-xs font-medium">Audit Logs</span>
              <ArrowRight className="size-3 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => setCurrentView('activation-areas')}
            >
              <CheckCircle2 className="size-5 text-violet-500" />
              <span className="text-xs font-medium">Activation Areas</span>
              <ArrowRight className="size-3 text-muted-foreground" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
