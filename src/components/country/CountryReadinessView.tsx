'use client'

import { useEffect, useState } from 'react'
import { Globe, CheckCircle2, XCircle, FileCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
  rolloutWave?: {
    id: string
    wave: number
    country: string
    status: string
  } | null
}

const CHECKLIST_ITEMS = [
  { key: 'dataMigrationComplete', label: 'Data Migration' },
  { key: 'rolesConfigured', label: 'Roles Configured' },
  { key: 'usersTrained', label: 'Users Trained' },
  { key: 'integrationVerified', label: 'Integration Verified' },
] as const

export function CountryReadinessView() {
  const [data, setData] = useState<CountryReadiness[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/country-readiness')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setData(d) })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [])

  function getReadinessPercent(item: CountryReadiness): number {
    const checks = [
      item.dataMigrationComplete,
      item.rolesConfigured,
      item.usersTrained,
      item.integrationVerified,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }

  function getOverallStats() {
    const total = data.length
    const complete = data.filter((d) => getReadinessPercent(d) === 100).length
    const signed = data.filter((d) => d.signOffDate).length
    return { total, complete, signed }
  }

  const stats = getOverallStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading country readiness...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Globe className="size-4" /> Total Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="size-4" /> Fully Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.complete}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileCheck className="size-4" /> Signed Off
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.signed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Readiness Matrix */}
      {data.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          No country readiness data available.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead>Wave</TableHead>
                      <TableHead className="text-center">Data Migration</TableHead>
                      <TableHead className="text-center">Roles Configured</TableHead>
                      <TableHead className="text-center">Users Trained</TableHead>
                      <TableHead className="text-center">Integration Verified</TableHead>
                      <TableHead className="text-center">Progress</TableHead>
                      <TableHead>Sign-Off</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => {
                      const country = item.rolloutWave?.country ?? 'Unknown'
                      const wave = item.rolloutWave?.wave ?? '—'
                      const pct = getReadinessPercent(item)
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{country}</TableCell>
                          <TableCell>
                            <Badge variant="outline">Wave {wave}</Badge>
                          </TableCell>
                          {CHECKLIST_ITEMS.map((ci) => {
                            const done = item[ci.key]
                            return (
                              <TableCell key={ci.key} className="text-center">
                                {done ? (
                                  <CheckCircle2 className="size-5 text-green-500 mx-auto" />
                                ) : (
                                  <XCircle className="size-5 text-red-500 mx-auto" />
                                )}
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-center">
                            <div className="flex items-center gap-2">
                              <Progress value={pct} className="flex-1">
                                <ProgressLabel className="sr-only">{country} readiness</ProgressLabel>
                                <ProgressValue>{pct}%</ProgressValue>
                                <ProgressTrack>
                                  <ProgressIndicator
                                    style={{ width: `${pct}%` }}
                                    className={pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
                                  />
                                </ProgressTrack>
                              </Progress>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.signOffDate ? (
                              <Badge variant="default">
                                {new Date(item.signOffDate).toLocaleDateString()}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {data.map((item) => {
              const country = item.rolloutWave?.country ?? 'Unknown'
              const wave = item.rolloutWave?.wave ?? '—'
              const pct = getReadinessPercent(item)
              return (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Globe className="size-4" />
                        {country}
                      </CardTitle>
                      <Badge variant="outline">Wave {wave}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {CHECKLIST_ITEMS.map((ci) => {
                        const done = item[ci.key]
                        return (
                          <div key={ci.key} className="flex items-center gap-2 text-sm">
                            {done ? (
                              <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                            ) : (
                              <XCircle className="size-4 text-red-500 shrink-0" />
                            )}
                            <span className={done ? '' : 'text-muted-foreground'}>{ci.label}</span>
                          </div>
                        )
                      })}
                    </div>

                    <Progress value={pct}>
                      <ProgressLabel className="sr-only">{country} readiness</ProgressLabel>
                      <ProgressValue>{pct}%</ProgressValue>
                      <ProgressTrack>
                        <ProgressIndicator
                          style={{ width: `${pct}%` }}
                          className={pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
                        />
                      </ProgressTrack>
                    </Progress>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {item.signOffDate
                          ? `Signed off: ${new Date(item.signOffDate).toLocaleDateString()}`
                          : 'Sign-off pending'}
                      </span>
                      {item.notes && <span className="italic truncate max-w-[160px]">{item.notes}</span>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
