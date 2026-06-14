'use client'

import { useEffect, useState } from 'react'
import {
  Building2,
  Search,
  MapPin,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/useAppStore'

interface Lender {
  id: string
  name: string
  institutionType: string
  country: string
  region: string | null
  contactPerson: string | null
  contactEmail: string | null
  activationScore: number
  status: string
  portfolioSize: number | null
  source: string
  lastSyncAt: string | null
  createdAt: string
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'dormant', label: 'Dormant' },
  { value: 'exited', label: 'Exited' },
]

const COUNTRY_OPTIONS = [
  { value: 'all', label: 'All Countries' },
  { value: 'Kenya', label: 'Kenya' },
  { value: 'Uganda', label: 'Uganda' },
  { value: 'Tanzania', label: 'Tanzania' },
  { value: 'Nigeria', label: 'Nigeria' },
  { value: 'Ghana', label: 'Ghana' },
  { value: 'Ethiopia', label: 'Ethiopia' },
  { value: 'Rwanda', label: 'Rwanda' },
]

const statusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'active': return 'default'
    case 'dormant': return 'secondary'
    case 'exited': return 'destructive'
    default: return 'outline'
  }
}

const institutionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    bank: 'Bank',
    microfinance: 'Microfinance',
    dfi: 'DFI',
    cooperative: 'Cooperative',
    nbfi: 'NBFI',
  }
  return labels[type] ?? type
}

export function LenderList() {
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  const [lenders, setLenders] = useState<Lender[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/lenders')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLenders(d) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = lenders.filter((l) => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false
    if (countryFilter !== 'all' && l.country !== countryFilter) return false
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lenders</h2>
          <p className="text-sm text-muted-foreground">
            Manage lender relationships and activation status
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {filtered.length} lender{filtered.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search lenders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={countryFilter}
              onValueChange={(v) => setCountryFilter(v ?? 'all')}
            >
              <SelectTrigger className="w-[160px]">
                <Globe className="size-4 mr-1" />
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v ?? 'all')}
            >
              <SelectTrigger className="w-[140px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Lender Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Building2 className="size-10 mb-3" />
          <p className="text-sm">No lenders found</p>
          <p className="text-xs">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lender) => {
            const isExpanded = expandedId === lender.id
            const scorePercent = Math.min(Math.round(lender.activationScore), 100)

            return (
              <Card
                key={lender.id}
                className="transition-shadow hover:shadow-md cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : lender.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <Building2 className="size-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{lender.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {institutionTypeLabel(lender.institutionType)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={statusBadgeVariant(lender.status)} className="text-[10px]">
                        {lender.status}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {lender.country}
                    {lender.region && <span> · {lender.region}</span>}
                  </div>

                  {/* Activation Score */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Activation Score</span>
                      <span className="text-xs font-medium">{scorePercent}%</span>
                    </div>
                    <Progress value={scorePercent} className="h-1.5" />
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-2 text-xs">
                        {lender.contactPerson && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Contact</span>
                            <span className="font-medium">{lender.contactPerson}</span>
                          </div>
                        )}
                        {lender.contactEmail && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email</span>
                            <span className="font-medium truncate ml-2">{lender.contactEmail}</span>
                          </div>
                        )}
                        {lender.portfolioSize !== null && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Portfolio</span>
                            <span className="font-medium">
                              ${(lender.portfolioSize / 1000000).toFixed(1)}M
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Source</span>
                          <Badge variant="outline" className="text-[10px]">{lender.source}</Badge>
                        </div>
                        {lender.lastSyncAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Sync</span>
                            <span>{new Date(lender.lastSyncAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentView('lenders')
                        }}
                      >
                        View Full Profile
                      </Button>
                    </>
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
