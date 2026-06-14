'use client'

import { useEffect, useState } from 'react'
import { Briefcase, Eye, CheckCircle2, Send, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ExecutiveReviewPack {
  id: string
  title: string
  description: string
  section: string
  audience: string
  status: string
  content: string | null
  dataSources: string | null
  author: string | null
}

const SECTION_LABELS: Record<string, string> = {
  overview: 'Overview',
  kpi_dashboard: 'KPI Dashboard',
  country_highlights: 'Country Highlights',
  risk_assessment: 'Risk Assessment',
  financial_impact: 'Financial Impact',
  strategic_recommendations: 'Strategic Recommendations',
}

const AUDIENCE_LABELS: Record<string, string> = {
  board: 'Board',
  executive: 'Executive',
  program_team: 'Program Team',
  donors: 'Donors',
}

const AUDIENCE_COLORS: Record<string, string> = {
  board: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  executive: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  program_team: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  donors: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: <FileText className="size-3" /> },
  reviewed: { label: 'Reviewed', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: <Eye className="size-3" /> },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <CheckCircle2 className="size-3" /> },
  published: { label: 'Published', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', icon: <Send className="size-3" /> },
}

export function ExecutiveReviewView() {
  const [data, setData] = useState<ExecutiveReviewPack[]>([])
  const [loading, setLoading] = useState(true)
  const [sectionFilter, setSectionFilter] = useState('all')
  const [audienceFilter, setAudienceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const params = new URLSearchParams()
    if (sectionFilter !== 'all') params.set('section', sectionFilter)
    if (audienceFilter !== 'all') params.set('audience', audienceFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    fetch(`/api/executive-review?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [sectionFilter, audienceFilter, statusFilter])

  function parseDataSources(raw: string | null): string[] {
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  function parseContent(raw: string | null): Record<string, unknown> | null {
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  // Group by section
  const grouped = data.reduce<Record<string, ExecutiveReviewPack[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Briefcase className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Executive Review Pack</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-4 w-48 rounded bg-muted" />
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
          <Briefcase className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Executive Review Pack</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={sectionFilter} onValueChange={(v) => setSectionFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[150px]">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {Object.entries(SECTION_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={audienceFilter} onValueChange={(v) => setAudienceFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Audiences</SelectItem>
              {Object.entries(AUDIENCE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards grouped by section */}
      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No executive review packs found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                {SECTION_LABELS[section] ?? section.replace(/_/g, ' ')}
                <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((pack) => {
                  const statusBadge = STATUS_BADGE[pack.status] ?? STATUS_BADGE.draft
                  const audienceBadge = AUDIENCE_COLORS[pack.audience] ?? 'bg-slate-100 text-slate-700'
                  const content = parseContent(pack.content)
                  const dataSources = parseDataSources(pack.dataSources)
                  const contentPreview = content
                    ? Object.entries(content).slice(0, 3).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')
                    : pack.description

                  return (
                    <Card key={pack.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm leading-tight">{pack.title}</CardTitle>
                          <Badge className={`${statusBadge.className} gap-1`}>
                            {statusBadge.icon}
                            {statusBadge.label}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2 text-xs">
                          {pack.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Audience */}
                        <div className="flex items-center gap-2">
                          <Badge className={audienceBadge}>
                            {AUDIENCE_LABELS[pack.audience] ?? pack.audience}
                          </Badge>
                        </div>

                        {/* Content preview */}
                        {contentPreview && (
                          <div className="rounded-lg bg-muted/50 px-3 py-2">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Content Preview</div>
                            <p className="text-xs line-clamp-3">{contentPreview}</p>
                          </div>
                        )}

                        {/* Data sources */}
                        {dataSources.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Sources: </span>
                            {dataSources.join(', ')}
                          </div>
                        )}

                        {/* Author */}
                        {pack.author && (
                          <div className="text-xs text-muted-foreground">
                            Author: {pack.author}
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
