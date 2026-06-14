'use client'

import { useEffect, useState } from 'react'
import { Waves, MapPin, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue } from '@/components/ui/progress'

interface RolloutWave {
  id: string
  wave: number
  country: string
  status: string
  startDate: string | null
  endDate: string | null
  config: string | null
  createdAt: string
  updatedAt: string
  countryReadiness?: CountryReadiness | null
}

interface CountryReadiness {
  id: string
  rolloutWaveId: string
  dataMigrationComplete: boolean
  rolesConfigured: boolean
  usersTrained: boolean
  integrationVerified: boolean
  signOffDate: string | null
  notes: string | null
  updatedAt: string
}

const WAVE_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  in_progress: 'secondary',
  planned: 'outline',
  on_hold: 'destructive',
}

export function RolloutWaveView() {
  const [waves, setWaves] = useState<RolloutWave[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rollout-waves')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setWaves(d) })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [])

  function getReadinessPercent(r: CountryReadiness | null | undefined): number {
    if (!r) return 0
    const items = [r.dataMigrationComplete, r.rolesConfigured, r.usersTrained, r.integrationVerified]
    return Math.round((items.filter(Boolean).length / items.length) * 100)
  }

  const wave1 = waves.filter((w) => w.wave === 1)
  const wave2 = waves.filter((w) => w.wave === 2)

  function renderWaveGroup(label: string, items: RolloutWave[]) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Waves className="size-5 text-primary" />
          <h3 className="text-lg font-semibold">{label}</h3>
          <Badge variant="secondary">{items.length} countries</Badge>
        </div>

        {items.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No countries assigned yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((wave) => {
              const readiness = wave.countryReadiness
              const pct = getReadinessPercent(readiness)
              return (
                <Card key={wave.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <MapPin className="size-4" />
                        {wave.country}
                      </CardTitle>
                      <Badge variant={WAVE_STATUS_VARIANTS[wave.status] ?? 'outline'}>
                        {wave.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Dates */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {wave.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          Start: {new Date(wave.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {wave.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          End: {new Date(wave.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Readiness Checklist */}
                    {readiness ? (
                      <div className="space-y-3">
                        <div className="text-xs font-medium uppercase text-muted-foreground">
                          Country Readiness
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: 'Data Migration', done: readiness.dataMigrationComplete },
                            { label: 'Roles Configured', done: readiness.rolesConfigured },
                            { label: 'Users Trained', done: readiness.usersTrained },
                            { label: 'Integration Verified', done: readiness.integrationVerified },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2 text-sm">
                              {item.done ? (
                                <CheckCircle2 className="size-4 text-green-500" />
                              ) : (
                                <XCircle className="size-4 text-red-500" />
                              )}
                              <span className={item.done ? '' : 'text-muted-foreground'}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Progress */}
                        <Progress value={pct}>
                          <ProgressLabel className="sr-only">{wave.country} readiness</ProgressLabel>
                          <ProgressValue>{pct}%</ProgressValue>
                          <ProgressTrack>
                            <ProgressIndicator
                              style={{ width: `${pct}%` }}
                              className={pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
                            />
                          </ProgressTrack>
                        </Progress>

                        {/* Sign-off */}
                        {readiness.signOffDate && (
                          <div className="text-xs text-muted-foreground">
                            Signed off: {new Date(readiness.signOffDate).toLocaleDateString()}
                          </div>
                        )}
                        {readiness.notes && (
                          <div className="text-xs text-muted-foreground italic">
                            {readiness.notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No readiness checklist available
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading rollout waves...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {renderWaveGroup('Wave 1 — Pilot', wave1)}
      {renderWaveGroup('Wave 2 — Multi-Country', wave2)}
    </div>
  )
}
