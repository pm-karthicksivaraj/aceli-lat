'use client'

import { useEffect, useState } from 'react'
import { ClipboardCheck, Shield, Database, Link2, Activity, Headphones, GraduationCap } from 'lucide-react'
import { getLabel } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress, ProgressTrack, ProgressIndicator, ProgressLabel } from '@/components/ui/progress'

interface HandoverItem {
  id: string
  section: string
  status: string
  assignee: string | null
  completionDate: string | null
  verificationDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

const SECTION_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  system_access: { label: 'System Access', icon: Shield },
  data_management: { label: 'Data Management', icon: Database },
  integrations: { label: 'Integrations', icon: Link2 },
  monitoring: { label: 'Monitoring', icon: Activity },
  support: { label: 'Support', icon: Headphones },
  training: { label: 'Training', icon: GraduationCap },
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  in_progress: 'secondary',
  completed: 'default',
  verified: 'default',
}

const SECTION_ORDER = ['system_access', 'data_management', 'integrations', 'monitoring', 'support', 'training']

export function AdminHandoverView() {
  const [data, setData] = useState<HandoverItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin-handover')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setData(d) })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [])

  function getSectionProgress(section: string): number {
    const items = data.filter((d) => d.section === section)
    if (items.length === 0) return 0
    const completed = items.filter((d) => d.status === 'completed' || d.status === 'verified').length
    return Math.round((completed / items.length) * 100)
  }

  function getOverallProgress(): number {
    if (data.length === 0) return 0
    const completed = data.filter((d) => d.status === 'completed' || d.status === 'verified').length
    return Math.round((completed / data.length) * 100)
  }

  const overallPct = getOverallProgress()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading handover checklist...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5" />
            Admin Handover Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={overallPct}>
            <ProgressLabel>Overall Completion</ProgressLabel>
            <ProgressTrack>
              <ProgressIndicator
                style={{ width: `${overallPct}%` }}
                className={overallPct === 100 ? 'bg-green-500' : 'bg-primary'}
              />
            </ProgressTrack>
          </Progress>
          <span className="text-sm font-medium tabular-nums">{overallPct}%</span>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{data.filter((d) => d.status === 'verified').length} verified</span>
            <span>{data.filter((d) => d.status === 'completed').length} completed</span>
            <span>{data.filter((d) => d.status === 'in_progress').length} in progress</span>
            <span>{data.filter((d) => d.status === 'pending').length} pending</span>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SECTION_ORDER.map((sectionKey) => {
          const config = SECTION_CONFIG[sectionKey]
          if (!config) return null
          const Icon = config.icon
          const sectionItems = data.filter((d) => d.section === sectionKey)
          const pct = getSectionProgress(sectionKey)

          return (
            <Card key={sectionKey}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className="size-4" />
                    {config.label}
                  </CardTitle>
                  <Badge variant={pct === 100 ? 'default' : 'secondary'}>{pct}%</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Section progress bar */}
                <Progress value={pct}>
                  <ProgressLabel className="sr-only">{config.label} progress</ProgressLabel>
                  <ProgressTrack>
                    <ProgressIndicator
                      style={{ width: `${pct}%` }}
                      className={pct === 100 ? 'bg-green-500' : 'bg-primary'}
                    />
                  </ProgressTrack>
                </Progress>
                <span className="text-sm font-medium tabular-nums">{pct}%</span>

                {/* Items */}
                {sectionItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No items in this section.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sectionItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{item.assignee || `Item ${item.id.slice(-4)}`}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.assignee && <span>Assignee: {item.assignee}</span>}
                            {item.notes && <span> · {item.notes}</span>}
                          </div>
                        </div>
                        <Badge variant={STATUS_VARIANTS[item.status] ?? 'outline'}>
                          {getLabel(item.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dates summary */}
                {sectionItems.length > 0 && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {sectionItems.some((i) => i.completionDate) && (
                      <span>
                        Last completed: {new Date(
                          sectionItems.filter((i) => i.completionDate).sort((a, b) =>
                            new Date(b.completionDate as string).getTime() - new Date(a.completionDate as string).getTime()
                          )[0]?.completionDate as string
                        ).toLocaleDateString()}
                      </span>
                    )}
                    {sectionItems.some((i) => i.verificationDate) && (
                      <span>
                        Last verified: {new Date(
                          sectionItems.filter((i) => i.verificationDate).sort((a, b) =>
                            new Date(b.verificationDate as string).getTime() - new Date(a.verificationDate as string).getTime()
                          )[0]?.verificationDate as string
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
