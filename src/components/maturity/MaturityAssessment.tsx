'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Target, Lightbulb } from 'lucide-react'
import { getLabel } from '@/lib/utils'
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

interface ServiceMaturity {
  id: string
  dimension: string
  currentLevel: number
  targetLevel: number
  description: string
  evidence: string | null
  recommendations: string | null
  assessedAt: string
}

const DIMENSION_META: Record<string, { icon: string; color: string }> = {
  reliability: { icon: '🛡️', color: 'bg-emerald-500' },
  performance: { icon: '⚡', color: 'bg-amber-500' },
  security: { icon: '🔒', color: 'bg-red-500' },
  observability: { icon: '👁️', color: 'bg-sky-500' },
  support: { icon: '🤝', color: 'bg-violet-500' },
  documentation: { icon: '📖', color: 'bg-pink-500' },
}

const LEVEL_LABELS = ['', 'Initial', 'Repeatable', 'Defined', 'Managed', 'Optimizing']

function getLevelColor(level: number): string {
  if (level <= 1) return 'bg-red-500'
  if (level === 2) return 'bg-orange-500'
  if (level === 3) return 'bg-amber-500'
  if (level === 4) return 'bg-emerald-500'
  return 'bg-sky-500'
}

export function MaturityAssessment() {
  const [data, setData] = useState<ServiceMaturity[]>([])
  const [loading, setLoading] = useState(true)
  const [dimensionFilter, setDimensionFilter] = useState('all')

  useEffect(() => {
    const params = new URLSearchParams()
    if (dimensionFilter !== 'all') params.set('dimension', dimensionFilter)
    fetch(`/api/maturity?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [dimensionFilter])

  // Compute average maturity
  const avgCurrent = data.length > 0
    ? data.reduce((sum, d) => sum + d.currentLevel, 0) / data.length
    : 0
  const avgTarget = data.length > 0
    ? data.reduce((sum, d) => sum + d.targetLevel, 0) / data.length
    : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Maturity Assessment</h2>
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
          <BarChart3 className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Maturity Assessment</h2>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dimensionFilter} onValueChange={(v) => setDimensionFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[150px]">
              <SelectValue placeholder="Dimension" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dimensions</SelectItem>
              <SelectItem value="reliability">Reliability</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="observability">Observability</SelectItem>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="documentation">Documentation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
                <TrendingUp className="size-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{avgCurrent.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Avg Current Level</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
                <Target className="size-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{avgTarget.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Avg Target Level</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
                <BarChart3 className="size-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{data.length}</div>
                <div className="text-xs text-muted-foreground">Dimensions Assessed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maturity Grid */}
      {data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No maturity assessments found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => {
            const meta = DIMENSION_META[item.dimension] ?? { icon: '📊', color: 'bg-slate-500' }
            const gap = item.targetLevel - item.currentLevel
            const progressPct = Math.round((item.currentLevel / 5) * 100)

            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>{meta.icon}</span>
                      {getLabel(item.dimension)}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      Level {item.currentLevel}/{item.targetLevel}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Level bars */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Current: {LEVEL_LABELS[item.currentLevel] ?? `Level ${item.currentLevel}`}</span>
                        <span className="font-medium">{item.currentLevel}/5</span>
                      </div>
                      <Progress value={progressPct}>
                        <ProgressTrack className="h-2">
                          <ProgressIndicator className={getLevelColor(item.currentLevel)} />
                        </ProgressTrack>
                      </Progress>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Target: {LEVEL_LABELS[item.targetLevel] ?? `Level ${item.targetLevel}`}</span>
                        <span className="font-medium">{item.targetLevel}/5</span>
                      </div>
                      <Progress value={(item.targetLevel / 5) * 100}>
                        <ProgressTrack className="h-2">
                          <ProgressIndicator className="bg-primary/40" />
                        </ProgressTrack>
                      </Progress>
                    </div>
                  </div>

                  {/* Gap indicator */}
                  {gap > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Gap: <span className="font-medium text-amber-600">{gap} level{gap > 1 ? 's' : ''}</span> to target
                    </div>
                  )}

                  {/* Evidence */}
                  {item.evidence && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Evidence: </span>
                      <span className="line-clamp-2">{item.evidence}</span>
                    </div>
                  )}

                  {/* Recommendations */}
                  {item.recommendations && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 p-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                        <Lightbulb className="size-3" />
                        Recommendations
                      </div>
                      <p className="text-xs text-amber-900/70 dark:text-amber-300/70 line-clamp-3">
                        {item.recommendations}
                      </p>
                    </div>
                  )}

                  {/* Assessed date */}
                  <div className="text-[10px] text-muted-foreground">
                    Assessed: {new Date(item.assessedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
