'use client'

import { useEffect, useState } from 'react'
import {
  Calendar,
  Plus,
  Loader2,
  MapPin,
  Building2,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Lender {
  id: string
  name: string
  country: string
  institutionType: string
}

interface Meeting {
  id: string
  title: string
  date: string
  location: string | null
  type: string
  status: string
  country: string
  syncStatus: string
  lender: Lender
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'field_visit', label: 'Field Visit' },
  { value: 'call', label: 'Call' },
  { value: 'hq_meeting', label: 'HQ Meeting' },
  { value: 'conference', label: 'Conference' },
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
    case 'completed': return 'default'
    case 'in_progress': return 'secondary'
    case 'planned': return 'outline'
    case 'cancelled': return 'destructive'
    default: return 'secondary'
  }
}

const syncBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'synced': return 'default'
    case 'pending': return 'secondary'
    case 'failed':
    case 'conflict': return 'destructive'
    default: return 'outline'
  }
}

export function MeetingList() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [lenders, setLenders] = useState<Lender[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')

  // New meeting form
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formLenderId, setFormLenderId] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formType, setFormType] = useState('field_visit')
  const [formCountry, setFormCountry] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (typeFilter !== 'all') params.set('type', typeFilter)
    if (countryFilter !== 'all') params.set('country', countryFilter)

    fetch(`/api/meetings?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && Array.isArray(d)) setMeetings(d) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [statusFilter, typeFilter, countryFilter])

  useEffect(() => {
    fetch('/api/lenders')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLenders(d) })
  }, [])

  const handleCreateMeeting = async () => {
    if (!formLenderId || !formTitle || !formDate || !formCountry) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lenderId: formLenderId,
          title: formTitle,
          date: formDate,
          location: formLocation || null,
          type: formType,
          country: formCountry,
        }),
      })
      if (res.ok) {
        setDialogOpen(false)
        setFormLenderId('')
        setFormTitle('')
        setFormDate('')
        setFormLocation('')
        setFormType('field_visit')
        setFormCountry('')
        // Re-fetch meetings after creating
        setLoading(true)
        fetch('/api/meetings')
          .then((r) => r.json())
          .then((d) => { if (Array.isArray(d)) setMeetings(d) })
          .finally(() => setLoading(false))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meetings</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage lender meetings
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4 mr-1" />
              New Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Meeting</DialogTitle>
              <DialogDescription>
                Schedule a meeting with a lender
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lender">Lender *</Label>
                <Select value={formLenderId} onValueChange={(v) => setFormLenderId(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select lender" />
                  </SelectTrigger>
                  <SelectContent>
                    {lenders.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name} ({l.country})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Meeting title"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formType} onValueChange={(v) => setFormType(v ?? 'field_visit')}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="field_visit">Field Visit</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="hq_meeting">HQ Meeting</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formCountry} onValueChange={(v) => setFormCountry(v ?? '')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.filter((c) => c.value !== 'all').map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="City or venue"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea placeholder="Optional meeting notes..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMeeting}
                disabled={submitting || !formLenderId || !formTitle || !formDate || !formCountry}
              >
                {submitting ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="size-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="w-[150px]">
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
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={(v) => setCountryFilter(v ?? 'all')}>
              <SelectTrigger className="w-[150px]">
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
            {(statusFilter !== 'all' || typeFilter !== 'all' || countryFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all')
                  setTypeFilter('all')
                  setCountryFilter('all')
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
            <Calendar className="size-4" />
            All Meetings
            {!loading && (
              <Badge variant="secondary" className="ml-1">{meetings.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Calendar className="size-8 mb-2" />
              <p className="text-sm">No meetings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[140px]">Lender</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[80px]">Country</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[90px]">Sync</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDate(m.date)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium truncate max-w-[200px]">{m.title}</p>
                        {m.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="size-3" /> {m.location}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span className="text-sm truncate">{m.lender?.name ?? '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {m.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{m.country}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(m.status)} className="text-[10px]">
                          {m.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={syncBadgeVariant(m.syncStatus)} className="text-[10px]">
                          {m.syncStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
