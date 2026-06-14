'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/useAppStore'

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
      .then((d) => { if (Array.isArray(d)) setLenders(d) })
      .finally(() => setLoadingLenders(false))

    fetch('/api/meetings')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setMeetings(d) })
      .finally(() => setLoadingMeetings(false))

    fetch('/api/extraction-drafts')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setExtractions(d) })
      .finally(() => setLoadingExtractions(false))

    fetch('/api/sync-records')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setSyncRecords(d) })
      .finally(() => setLoadingSync(false))
  }, [])

  const activeLenders = lenders.filter((l) => l.status === 'active').length
  const activeMeetings = meetings.filter((m) => m.status === 'planned' || m.status === 'in_progress').length
  const pendingReviews = extractions.filter((e) => e.status === 'pending_review' || e.status === 'draft').length
  const syncFailed = syncRecords.filter((s) => s.status === 'failed' || s.status === 'conflict').length
  const syncCompleted = syncRecords.filter((s) => s.status === 'completed').length

  const recentActivity = [
    ...meetings.slice(0, 3).map((m) => ({
      id: m.id,
      type: 'meeting' as const,
      label: m.title,
      sublabel: m.lender?.name ?? 'Unknown lender',
      date: m.date,
      status: m.status,
    })),
    ...extractions.slice(0, 3).map((e) => ({
      id: e.id,
      type: 'extraction' as const,
      label: `Extraction: ${e.area}`,
      sublabel: e.meeting?.title ?? '',
      date: e.createdAt,
      status: e.status,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)

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

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Lenders</CardTitle>
            <Building2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingLenders ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{lenders.length}</div>
                <p className="text-xs text-muted-foreground">{activeLenders} active</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Meetings</CardTitle>
            <CalendarCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingMeetings ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeMeetings}</div>
                <p className="text-xs text-muted-foreground">{meetings.length} total</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingExtractions ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{pendingReviews}</div>
                <p className="text-xs text-muted-foreground">{extractions.length} total drafts</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sync Status</CardTitle>
            <RefreshCw className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSync ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{syncCompleted}</div>
                <p className="text-xs text-muted-foreground">
                  {syncFailed > 0 ? (
                    <span className="text-red-500">{syncFailed} failed</span>
                  ) : (
                    'All synced'
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Clock className="size-8 mb-2" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    {statusIcon(item.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>
                    </div>
                    <Badge variant={meetingStatusBadge(item.status)} className="shrink-0 text-[10px]">
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => setCurrentView('lenders')}
            >
              <Building2 className="size-4 text-primary" />
              <span className="flex-1 text-left">View Lenders</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => setCurrentView('meetings')}
            >
              <CalendarCheck className="size-4 text-primary" />
              <span className="flex-1 text-left">Schedule Meeting</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => setCurrentView('extractions')}
            >
              <FileText className="size-4 text-primary" />
              <span className="flex-1 text-left">Review Extractions</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Button>
            <Separator className="my-2" />
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => setCurrentView('audit-logs')}
            >
              <Clock className="size-4 text-primary" />
              <span className="flex-1 text-left">View Audit Logs</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => setCurrentView('activation-areas')}
            >
              <CheckCircle2 className="size-4 text-primary" />
              <span className="flex-1 text-left">Activation Areas</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
