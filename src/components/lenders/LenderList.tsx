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
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

interface LenderForm {
  name: string
  institutionType: string
  country: string
  region: string
  contactPerson: string
  contactEmail: string
  portfolioSize: string
  source: string
}

const EMPTY_FORM: LenderForm = {
  name: '',
  institutionType: 'bank',
  country: 'Kenya',
  region: '',
  contactPerson: '',
  contactEmail: '',
  portfolioSize: '',
  source: 'manual',
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

const INSTITUTION_TYPE_OPTIONS = [
  { value: 'bank', label: 'Bank' },
  { value: 'microfinance', label: 'Microfinance' },
  { value: 'dfi', label: 'DFI' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'nbfi', label: 'NBFI' },
]

const COUNTRY_FORM_OPTIONS = [
  { value: 'Kenya', label: 'Kenya' },
  { value: 'Uganda', label: 'Uganda' },
  { value: 'Tanzania', label: 'Tanzania' },
  { value: 'Nigeria', label: 'Nigeria' },
  { value: 'Ghana', label: 'Ghana' },
  { value: 'Ethiopia', label: 'Ethiopia' },
  { value: 'Rwanda', label: 'Rwanda' },
]

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'google_sheets', label: 'Google Sheets' },
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

  // Create / Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLender, setEditingLender] = useState<Lender | null>(null)
  const [form, setForm] = useState<LenderForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingLender, setDeletingLender] = useState<Lender | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchLenders = () => {
    setLoading(true)
    fetch('/api/lenders')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLenders(d) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetch('/api/lenders')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLenders(d) })
      .finally(() => setLoading(false))
  }, [])

  // Open dialog for creating a new lender
  const openCreateDialog = () => {
    setEditingLender(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setDialogOpen(true)
  }

  // Open dialog for editing an existing lender
  const openEditDialog = (lender: Lender) => {
    setEditingLender(lender)
    setForm({
      name: lender.name,
      institutionType: lender.institutionType,
      country: lender.country,
      region: lender.region ?? '',
      contactPerson: lender.contactPerson ?? '',
      contactEmail: lender.contactEmail ?? '',
      portfolioSize: lender.portfolioSize != null ? String(lender.portfolioSize) : '',
      source: lender.source,
    })
    setFormError('')
    setDialogOpen(true)
  }

  // Submit handler for create/edit
  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setFormError('Name is required')
      return
    }

    setSubmitting(true)
    setFormError('')

    const payload = {
      name: form.name.trim(),
      institutionType: form.institutionType,
      country: form.country,
      region: form.region.trim() || null,
      contactPerson: form.contactPerson.trim() || null,
      contactEmail: form.contactEmail.trim() || null,
      portfolioSize: form.portfolioSize ? parseFloat(form.portfolioSize) : null,
      source: form.source,
    }

    try {
      if (editingLender) {
        // Update existing lender
        const res = await fetch(`/api/lenders/${editingLender.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update lender')
        }
      } else {
        // Create new lender
        const res = await fetch('/api/lenders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create lender')
        }
      }

      setDialogOpen(false)
      fetchLenders()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete handler
  const handleDelete = async () => {
    if (!deletingLender) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/lenders/${deletingLender.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete lender')
      }

      setDeleteDialogOpen(false)
      setDeletingLender(null)
      fetchLenders()
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleting(false)
    }
  }

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
        <div className="flex items-center gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button size="sm">
                  <Plus className="size-4 mr-1" />
                  Add Lender
                </Button>
              }
              onClick={openCreateDialog}
            />

            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLender ? 'Edit Lender' : 'Add Lender'}
                </DialogTitle>
                <DialogDescription>
                  {editingLender
                    ? 'Update lender details below.'
                    : 'Fill in the details to create a new lender.'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                {/* Name */}
                <div className="grid gap-2">
                  <Label htmlFor="lender-name">Name *</Label>
                  <Input
                    id="lender-name"
                    placeholder="Lender name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                {/* Institution Type */}
                <div className="grid gap-2">
                  <Label htmlFor="lender-type">Institution Type</Label>
                  <Select
                    value={form.institutionType}
                    onValueChange={(v) => setForm({ ...form, institutionType: v ?? 'bank' })}
                  >
                    <SelectTrigger id="lender-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTITUTION_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Country */}
                <div className="grid gap-2">
                  <Label htmlFor="lender-country">Country</Label>
                  <Select
                    value={form.country}
                    onValueChange={(v) => setForm({ ...form, country: v ?? 'Kenya' })}
                  >
                    <SelectTrigger id="lender-country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_FORM_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Region */}
                <div className="grid gap-2">
                  <Label htmlFor="lender-region">Region</Label>
                  <Input
                    id="lender-region"
                    placeholder="e.g. East Africa"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                  />
                </div>

                {/* Contact Person */}
                <div className="grid gap-2">
                  <Label htmlFor="lender-contact">Contact Person</Label>
                  <Input
                    id="lender-contact"
                    placeholder="Contact name"
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  />
                </div>

                {/* Contact Email */}
                <div className="grid gap-2">
                  <Label htmlFor="lender-email">Contact Email</Label>
                  <Input
                    id="lender-email"
                    type="email"
                    placeholder="email@example.com"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  />
                </div>

                {/* Portfolio Size */}
                <div className="grid gap-2">
                  <Label htmlFor="lender-portfolio">Portfolio Size</Label>
                  <Input
                    id="lender-portfolio"
                    type="number"
                    placeholder="e.g. 5000000"
                    value={form.portfolioSize}
                    onChange={(e) => setForm({ ...form, portfolioSize: e.target.value })}
                  />
                </div>

                {/* Source */}
                <div className="grid gap-2">
                  <Label htmlFor="lender-source">Source</Label>
                  <Select
                    value={form.source}
                    onValueChange={(v) => setForm({ ...form, source: v ?? 'manual' })}
                  >
                    <SelectTrigger id="lender-source">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Error message */}
                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}
              </div>

              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="size-4 mr-1 animate-spin" />}
                  {editingLender ? 'Save Changes' : 'Create Lender'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Badge variant="outline" className="w-fit">
            {filtered.length} lender{filtered.length !== 1 ? 's' : ''}
          </Badge>
        </div>
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
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(lender)
                        }}
                        aria-label={`Edit ${lender.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingLender(lender)
                          setDeleteDialogOpen(true)
                        }}
                        aria-label={`Delete ${lender.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lender</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingLender?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="size-4 mr-1 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
