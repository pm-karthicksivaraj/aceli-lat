'use client'

import { useEffect, useState } from 'react'
import {
  FileText,
  Filter,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Mic,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getLabel } from '@/lib/utils'

interface ExtractionDraft {
  id: string
  area: string
  extractedText: string
  confidence: number
  flags: string | null
  status: string
  createdAt: string
  meeting: {
    id: string
    title: string
    date: string
    country: string
  } | null
  voiceMemo: {
    id: string
    duration: number | null
    language: string | null
    status: string
  } | null
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'needs_followup', label: 'Needs Follow-up' },
]

const AREA_OPTIONS = [
  { value: 'all', label: 'All Areas' },
  { value: 'lending_volume', label: 'Lending Volume' },
  { value: 'terms', label: 'Terms' },
  { value: 'products', label: 'Products' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'constraints', label: 'Constraints' },
  { value: 'relationship', label: 'Relationship' },
]

const statusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'approved': return 'default'
    case 'draft': return 'outline'
    case 'pending_review': return 'secondary'
    case 'rejected': return 'destructive'
    case 'needs_followup': return 'secondary'
    default: return 'outline'
  }
}

const statusIcon = (status: string) => {
  switch (status) {
    case 'approved': return <CheckCircle2 className="size-4 text-emerald-500" />
    case 'rejected': return <XCircle className="size-4 text-red-500" />
    case 'pending_review': return <AlertTriangle className="size-4 text-amber-500" />
    default: return <Clock className="size-4 text-muted-foreground" />
  }
}

const areaLabel = (area: string) => {
  const labels: Record<string, string> = {
    lending_volume: 'Lending Volume',
    terms: 'Terms',
    products: 'Products',
    pipeline: 'Pipeline',
    constraints: 'Constraints',
    relationship: 'Relationship',
  }
  return labels[area] ?? area
}

const confidenceColor = (score: number) => {
  if (score >= 0.8) return 'text-emerald-600'
  if (score >= 0.5) return 'text-amber-600'
  return 'text-red-600'
}

export function ExtractionList() {
  const [drafts, setDrafts] = useState<ExtractionDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (areaFilter !== 'all') params.set('area', areaFilter)

    fetch(`/api/extraction-drafts?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && Array.isArray(d)) setDrafts(d) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [statusFilter, areaFilter])

  const parseFlags = (flags: string | null): string[] => {
    if (!flags) return []
    try {
      const parsed = JSON.parse(flags)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  // Summary stats
  const totalDrafts = drafts.length
  const pendingReview = drafts.filter((d) => d.status === 'pending_review').length
  const lowConfidence = drafts.filter((d) => d.confidence < 0.5).length
  const approved = drafts.filter((d) => d.status === 'approved').length

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Extraction Drafts</h2>
          <p className="text-sm text-muted-foreground">
            AI-extracted insights from meeting notes and voice memos
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalDrafts}</div>
            <p className="text-xs text-muted-foreground">Total Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{pendingReview}</div>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{lowConfidence}</div>
            <p className="text-xs text-muted-foreground">Low Confidence</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">{approved}</div>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="size-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={areaFilter} onValueChange={(v) => setAreaFilter(v ?? 'all')}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                {AREA_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(statusFilter !== 'all' || areaFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all')
                  setAreaFilter('all')
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4" />
            Extraction Drafts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="size-8 mb-2" />
              <p className="text-sm">No extraction drafts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="w-[120px]">Area</TableHead>
                    <TableHead>Extracted Text</TableHead>
                    <TableHead className="w-[120px]">Confidence</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[140px]">Flags</TableHead>
                    <TableHead className="w-[140px]">Meeting</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.map((draft) => {
                    const flags = parseFlags(draft.flags)
                    const confPercent = Math.round(draft.confidence * 100)
                    return (
                      <TableRow key={draft.id}>
                        <TableCell>{statusIcon(draft.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {areaLabel(draft.area)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {draft.extractedText}
                          </p>
                          {draft.voiceMemo && (
                            <div className="flex items-center gap-1 mt-1">
                              <Mic className="size-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">Voice memo</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-medium ${confidenceColor(draft.confidence)}`}>
                                {confPercent}%
                              </span>
                            </div>
                            <Progress value={confPercent} className="h-1" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(draft.status)} className="text-[10px]">
                            {getLabel(draft.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {flags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {flags.slice(0, 2).map((flag, i) => (
                                <Badge key={i} variant="destructive" className="text-[9px]">
                                  {flag}
                                </Badge>
                              ))}
                              {flags.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{flags.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {draft.meeting ? (
                            <div>
                              <p className="text-xs font-medium truncate max-w-[120px]">
                                {draft.meeting.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {draft.meeting.country}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
