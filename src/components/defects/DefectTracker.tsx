'use client'

import { useEffect, useState } from 'react'
import { Bug, Plus, Filter } from 'lucide-react'
import { getLabel } from '@/lib/utils'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Defect {
  id: string
  title: string
  description: string
  severity: string
  category: string
  status: string
  assignee: string | null
  country: string | null
  resolution: string | null
  createdAt: string
  updatedAt: string
}

const SEVERITY_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  blocker: 'destructive',
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'destructive',
  in_progress: 'secondary',
  resolved: 'default',
  verified: 'default',
  closed: 'outline',
  wontfix: 'outline',
}

const categories = ['functional', 'performance', 'ux', 'data', 'integration', 'security']
const severities = ['blocker', 'critical', 'high', 'medium', 'low']
const statuses = ['open', 'in_progress', 'resolved', 'verified', 'closed', 'wontfix']

export function DefectTracker() {
  const [data, setData] = useState<Defect[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'medium',
    category: 'functional',
    assignee: '',
    country: '',
  })

  useEffect(() => {
    const params = new URLSearchParams()
    if (filterSeverity !== 'all') params.set('severity', filterSeverity)
    if (filterCategory !== 'all') params.set('category', filterCategory)
    if (filterStatus !== 'all') params.set('status', filterStatus)

    fetch(`/api/defects?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setData(d) })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [filterSeverity, filterCategory, filterStatus])

  async function createDefect() {
    try {
      const body: Record<string, string> = {
        title: form.title,
        description: form.description,
        severity: form.severity,
        category: form.category,
      }
      if (form.assignee) body.assignee = form.assignee
      if (form.country) body.country = form.country
      const res = await fetch('/api/defects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setDialogOpen(false)
        setForm({ title: '', description: '', severity: 'medium', category: 'functional', assignee: '', country: '' })
        // Re-fetch using filter state to trigger useEffect
        const params = new URLSearchParams()
        if (filterSeverity !== 'all') params.set('severity', filterSeverity)
        if (filterCategory !== 'all') params.set('category', filterCategory)
        if (filterStatus !== 'all') params.set('status', filterStatus)
        fetch(`/api/defects?${params.toString()}`)
          .then((r) => r.json())
          .then((d) => { if (Array.isArray(d)) setData(d) })
          .catch(() => { /* ignore */ })
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={filterSeverity} onValueChange={(v) => setFilterSeverity(v ?? 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              {severities.map((s) => (
                <SelectItem key={s} value={s}>{getLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? 'all')}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{getLabel(c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{getLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button><Plus className="size-4" />Report Defect</Button>} />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Report New Defect</DialogTitle>
              <DialogDescription>Fill in the details for the new defect.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="defect-title">Title</Label>
                <Input
                  id="defect-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Defect title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="defect-desc">Description</Label>
                <Textarea
                  id="defect-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the defect"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Severity</Label>
                  <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v ?? 'medium' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {severities.map((s) => (
                        <SelectItem key={s} value={s}>{getLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? 'functional' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{getLabel(c)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="defect-assignee">Assignee</Label>
                  <Input
                    id="defect-assignee"
                    value={form.assignee}
                    onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                    placeholder="Assignee name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="defect-country">Country</Label>
                  <Input
                    id="defect-country"
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createDefect} disabled={!form.title.trim()}>Create Defect</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {severities.map((sev) => {
          const count = data.filter((d) => d.severity === sev).length
          return (
            <Card key={sev}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                  <Bug className="size-3.5" /> {getLabel(sev)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading defects...</div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">No defects found.</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((defect) => (
                    <TableRow key={defect.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{defect.title}</TableCell>
                      <TableCell>
                        <Badge variant={SEVERITY_VARIANTS[defect.severity] ?? 'outline'}>
                          {getLabel(defect.severity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getLabel(defect.category)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[defect.status] ?? 'outline'}>
                          {getLabel(defect.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{defect.assignee ?? '—'}</TableCell>
                      <TableCell>{defect.country ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(defect.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
