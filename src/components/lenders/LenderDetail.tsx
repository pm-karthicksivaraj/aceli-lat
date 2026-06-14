'use client'

import { useEffect, useState } from 'react'
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Loader2,
  Calendar,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/store/useAppStore'

interface Lender {
  id: string
  name: string
  institutionType: string
  country: string
  region: string | null
  contactPerson: string | null
  contactEmail: string | null
  contactPhone: string | null
  portfolioSize: number | null
  activationScore: number
  status: string
  source: string
  salesforceId: string | null
  lastSyncAt: string | null
  createdAt: string
  meetings: Meeting[]
}

interface Meeting {
  id: string
  title: string
  date: string
  location: string | null
  type: string
  status: string
  country: string
}

interface Scorecard {
  id: string
  period: string
  lendingVolume: number
  termsAlignment: number
  productFit: number
  pipelineStrength: number
  constraintResolution: number
  relationshipHealth: number
  overallScore: number
  reviewedAt: string | null
}

interface SyncRecord {
  id: string
  entity: string
  entityId: string
  direction: string
  status: string
  createdAt: string
  lastAttemptAt: string | null
  errorMessage: string | null
  retryCount: number
}

const statusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'active': return 'default'
    case 'dormant': return 'secondary'
    case 'exited': return 'destructive'
    default: return 'outline'
  }
}

const meetingStatusBadge = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'planned': return 'outline'
    case 'in_progress': return 'secondary'
    case 'completed': return 'default'
    case 'cancelled': return 'destructive'
    default: return 'secondary'
  }
}

const syncStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="size-4 text-emerald-500" />
    case 'failed':
    case 'conflict': return <XCircle className="size-4 text-red-500" />
    default: return <Clock className="size-4 text-amber-500" />
  }
}

const institutionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    bank: 'Bank',
    microfinance: 'Microfinance',
    dfi: 'Development Finance Institution',
    cooperative: 'Cooperative',
    nbfi: 'Non-Bank Financial Institution',
  }
  return labels[type] ?? type
}

interface LenderDetailProps {
  lenderId: string
}

export function LenderDetail({ lenderId }: LenderDetailProps) {
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  const [lender, setLender] = useState<Lender | null>(null)
  const [scorecards, setScorecards] = useState<Scorecard[]>([])
  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingScorecards, setLoadingScorecards] = useState(true)
  const [loadingSync, setLoadingSync] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/lenders/${lenderId}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d && !d.error) setLender(d) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [lenderId])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/scorecards?lenderId=${lenderId}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && Array.isArray(d)) setScorecards(d) })
      .finally(() => { if (!cancelled) setLoadingScorecards(false) })
    return () => { cancelled = true }
  }, [lenderId])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/sync-records?entity=lender&entityId=${lenderId}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && Array.isArray(d)) setSyncRecords(d) })
      .finally(() => { if (!cancelled) setLoadingSync(false) })
    return () => { cancelled = true }
  }, [lenderId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!lender) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Building2 className="size-10 mb-3" />
        <p className="text-sm">Lender not found</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setCurrentView('lenders')}>
          <ArrowLeft className="size-4 mr-1" /> Back to Lenders
        </Button>
      </div>
    )
  }

  const scorePercent = Math.min(Math.round(lender.activationScore), 100)

  const latestScorecard = scorecards[0]

  const scorecardDimensions = latestScorecard
    ? [
        { name: 'Lending Volume', value: latestScorecard.lendingVolume },
        { name: 'Terms Alignment', value: latestScorecard.termsAlignment },
        { name: 'Product Fit', value: latestScorecard.productFit },
        { name: 'Pipeline Strength', value: latestScorecard.pipelineStrength },
        { name: 'Constraint Resolution', value: latestScorecard.constraintResolution },
        { name: 'Relationship Health', value: latestScorecard.relationshipHealth },
      ]
    : []

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView('lenders')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{lender.name}</h2>
            <Badge variant={statusBadgeVariant(lender.status)}>{lender.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {institutionTypeLabel(lender.institutionType)} · {lender.country}
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lender.contactPerson && (
                  <div className="flex items-center gap-3">
                    <Building2 className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{lender.contactPerson}</p>
                      <p className="text-xs text-muted-foreground">Contact Person</p>
                    </div>
                  </div>
                )}
                {lender.contactEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{lender.contactEmail}</p>
                      <p className="text-xs text-muted-foreground">Email</p>
                    </div>
                  </div>
                )}
                {lender.contactPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{lender.contactPhone}</p>
                      <p className="text-xs text-muted-foreground">Phone</p>
                    </div>
                  </div>
                )}
                <Separator />
                <div className="flex items-center gap-3">
                  <MapPin className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {lender.country}{lender.region ? `, ${lender.region}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">Location</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activation Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{scorePercent}%</span>
                  <Badge variant={scorePercent >= 70 ? 'default' : scorePercent >= 40 ? 'secondary' : 'destructive'}>
                    {scorePercent >= 70 ? 'High' : scorePercent >= 40 ? 'Medium' : 'Low'}
                  </Badge>
                </div>
                <Progress value={scorePercent} className="h-2" />
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Source</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">{lender.source}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Portfolio Size</p>
                    <p className="font-medium mt-1">
                      {lender.portfolioSize ? `$${(lender.portfolioSize / 1000000).toFixed(1)}M` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Salesforce ID</p>
                    <p className="font-medium mt-1 truncate">{lender.salesforceId ?? 'Not linked'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium mt-1">{new Date(lender.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4" />
                Recent Meetings
                <Badge variant="secondary" className="text-[10px]">
                  {lender.meetings?.length ?? 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!lender.meetings || lender.meetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Calendar className="size-8 mb-2" />
                  <p className="text-sm">No meetings recorded</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {lender.meetings.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
                        <Calendar className="size-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.date).toLocaleDateString()} · {m.type.replace('_', ' ')}
                          {m.location && ` · ${m.location}`}
                        </p>
                      </div>
                      <Badge variant={meetingStatusBadge(m.status)} className="shrink-0 text-[10px]">
                        {m.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scorecard Tab */}
        <TabsContent value="scorecard" className="mt-4">
          {loadingScorecards ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : !latestScorecard ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center text-muted-foreground">
                <Globe className="size-8 mb-2" />
                <p className="text-sm">No scorecard data available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Overall Score — {latestScorecard.period}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold">
                      {Math.round(latestScorecard.overallScore)}%
                    </span>
                    <Badge variant={latestScorecard.overallScore >= 70 ? 'default' : 'secondary'}>
                      {latestScorecard.overallScore >= 70 ? 'Strong' : 'Needs Improvement'}
                    </Badge>
                  </div>
                  <Progress value={Math.min(latestScorecard.overallScore, 100)} className="h-3" />
                  {latestScorecard.reviewedAt && (
                    <p className="text-xs text-muted-foreground">
                      Reviewed: {new Date(latestScorecard.reviewedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dimension Scores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scorecardDimensions.map((dim) => (
                    <div key={dim.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{dim.name}</span>
                        <span className="font-medium">{Math.round(dim.value)}%</span>
                      </div>
                      <Progress value={Math.min(dim.value, 100)} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Sync Status Tab */}
        <TabsContent value="sync" className="mt-4">
          {loadingSync ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : syncRecords.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center text-muted-foreground">
                <RefreshCw className="size-8 mb-2" />
                <p className="text-sm">No sync records</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="size-4" />
                  Salesforce Sync History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {syncRecords.map((rec) => (
                    <div key={rec.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      {syncStatusIcon(rec.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium capitalize">{rec.entity}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {rec.direction === 'lat_to_sf' ? 'LAT → SF' : 'SF → LAT'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(rec.createdAt).toLocaleString()}
                          {rec.lastAttemptAt && ` · Last: ${new Date(rec.lastAttemptAt).toLocaleString()}`}
                          {rec.retryCount > 0 && ` · ${rec.retryCount} retries`}
                        </p>
                        {rec.errorMessage && (
                          <p className="text-xs text-red-500 mt-1 truncate">{rec.errorMessage}</p>
                        )}
                      </div>
                      <Badge
                        variant={rec.status === 'completed' ? 'default' : rec.status === 'failed' ? 'destructive' : 'secondary'}
                        className="text-[10px] shrink-0"
                      >
                        {rec.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
