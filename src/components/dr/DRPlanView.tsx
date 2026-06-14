'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert, Clock, Target, ListChecks, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DRStep {
  order: number
  action: string
  responsible: string
}

interface DRPlan {
  id: string
  name: string
  description: string
  rtoMinutes: number
  rpoMinutes: number
  strategy: string
  status: string
  lastTestDate: string | null
  nextTestDate: string | null
  responsibleTeam: string | null
  steps: string | null
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  approved: { label: 'Approved', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  tested: { label: 'Tested', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

const STRATEGY_LABELS: Record<string, string> = {
  active_passive: 'Active-Passive',
  active_active: 'Active-Active',
  backup_restore: 'Backup & Restore',
}

function parseSteps(steps: string | null): DRStep[] {
  if (!steps) return []
  try {
    return JSON.parse(steps)
  } catch {
    return []
  }
}

export function DRPlanView() {
  const [data, setData] = useState<DRPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    fetch(`/api/dr-plans?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [statusFilter])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">DR Plans</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-4 w-48 rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
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
          <ShieldAlert className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Disaster Recovery Plans</h2>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="tested">Tested</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* DR Plan Cards */}
      {data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No DR plans found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((plan) => {
            const badge = STATUS_BADGE[plan.status] ?? STATUS_BADGE.draft
            const steps = parseSteps(plan.steps)

            return (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* RTO / RPO */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/50 px-3 py-2 flex items-center gap-2">
                      <Target className="size-4 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">RTO</div>
                        <div className="text-sm font-semibold">{plan.rtoMinutes} min</div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2 flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">RPO</div>
                        <div className="text-sm font-semibold">{plan.rpoMinutes} min</div>
                      </div>
                    </div>
                  </div>

                  {/* Strategy */}
                  <div className="text-sm">
                    <span className="text-muted-foreground">Strategy: </span>
                    <span className="font-medium">{STRATEGY_LABELS[plan.strategy] ?? plan.strategy}</span>
                  </div>

                  {/* Test dates */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span>Last test: {plan.lastTestDate ? new Date(plan.lastTestDate).toLocaleDateString() : 'Never'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span>Next test: {plan.nextTestDate ? new Date(plan.nextTestDate).toLocaleDateString() : 'Not scheduled'}</span>
                    </div>
                  </div>

                  {/* Steps */}
                  {steps.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <ListChecks className="size-3.5" />
                        Recovery Steps
                      </div>
                      <div className="space-y-1">
                        {steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm rounded bg-muted/30 px-2 py-1.5">
                            <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                              {step.order ?? idx + 1}
                            </span>
                            <div>
                              <div>{step.action}</div>
                              {step.responsible && (
                                <div className="text-xs text-muted-foreground">Responsible: {step.responsible}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Responsible team */}
                  {plan.responsibleTeam && (
                    <div className="text-xs text-muted-foreground">
                      Team: {plan.responsibleTeam}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
