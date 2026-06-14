'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  ChevronRight,
  ChevronDown,
  Loader2,
  Award,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue } from '@/components/ui/progress'

interface Scorecard {
  id: string
  lenderId: string
  period: string
  lendingVolume: number
  termsAlignment: number
  productFit: number
  pipelineStrength: number
  constraintResolution: number
  relationshipHealth: number
  overallScore: number
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  lender?: {
    id: string
    name: string
    country: string
  }
}

const DIMENSIONS = [
  { key: 'lendingVolume', label: 'Lending Volume', color: 'bg-emerald-500' },
  { key: 'termsAlignment', label: 'Terms Alignment', color: 'bg-teal-500' },
  { key: 'productFit', label: 'Product Fit', color: 'bg-cyan-500' },
  { key: 'pipelineStrength', label: 'Pipeline Strength', color: 'bg-sky-500' },
  { key: 'constraintResolution', label: 'Constraint Resolution', color: 'bg-indigo-500' },
  { key: 'relationshipHealth', label: 'Relationship Health', color: 'bg-violet-500' },
] as const

type DimensionKey = (typeof DIMENSIONS)[number]['key']

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function scoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 80) return 'default'
  if (score >= 60) return 'secondary'
  return 'destructive'
}

export function ScorecardView() {
  const [scorecards, setScorecards] = useState<Scorecard[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/scorecards')
        if (res.ok && !cancelled) {
          const data = await res.json()
          setScorecards(Array.isArray(data) ? data : data.items ?? [])
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

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading scorecards…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="size-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Scorecards</h2>
          <p className="text-sm text-muted-foreground">
            {scorecards.length} scorecard{scorecards.length !== 1 ? 's' : ''} across lenders
          </p>
        </div>
      </div>

      {scorecards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No scorecards available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {scorecards.map((sc) => {
            const isExpanded = expandedId === sc.id
            return (
              <Card key={sc.id}>
                {/* Summary row */}
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleExpand(sc.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">
                          {sc.lender?.name ?? `Lender ${sc.lenderId.slice(-6)}`}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>{sc.period}</span>
                          {sc.lender?.country && (
                            <Badge variant="outline" className="text-[10px]">
                              {sc.lender.country}
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className={`size-4 ${scoreColor(sc.overallScore)}`} />
                        <span className={`text-lg font-bold tabular-nums ${scoreColor(sc.overallScore)}`}>
                          {sc.overallScore.toFixed(1)}
                        </span>
                      </div>
                      <Badge variant={scoreBadgeVariant(sc.overallScore)}>
                        {sc.overallScore >= 80 ? 'Strong' : sc.overallScore >= 60 ? 'Moderate' : 'Needs Attention'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded dimension detail */}
                {isExpanded && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="border-t pt-4" />
                    <div className="grid gap-3">
                      {DIMENSIONS.map((dim) => {
                        const value = sc[dim.key as DimensionKey]
                        return (
                          <div key={dim.key} className="space-y-1.5">
                            <Progress value={value}>
                              <div className="flex items-center justify-between w-full">
                                <ProgressLabel className="text-xs">{dim.label}</ProgressLabel>
                                <ProgressValue className="text-xs tabular-nums">
                                  {value.toFixed(1)}
                                </ProgressValue>
                              </div>
                              <ProgressTrack className="h-2">
                                <ProgressIndicator
                                  className={dim.color}
                                  style={{ width: `${Math.min(100, value)}%` }}
                                />
                              </ProgressTrack>
                            </Progress>
                          </div>
                        )
                      })}
                    </div>
                    {sc.reviewedAt && (
                      <p className="text-xs text-muted-foreground pt-2">
                        Last reviewed: {new Date(sc.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex justify-end pt-2">
                      <Button size="sm" variant="outline">
                        View Full Details
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
