'use client'

import { useEffect, useState } from 'react'
import { Ticket, Plus, Filter } from 'lucide-react'
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

interface SupportTicket {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  reporterId: string
  assigneeId: string | null
  country: string | null
  resolution: string | null
  createdAt: string
  updatedAt: string
  reporter?: { id: string; name: string; email: string } | null
}

const PRIORITY_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'destructive',
  assigned: 'secondary',
  in_progress: 'secondary',
  resolved: 'default',
  closed: 'outline',
}

const categories = ['technical', 'access', 'data', 'integration', 'training', 'other']
const priorities = ['low', 'medium', 'high', 'critical']
const statuses = ['open', 'assigned', 'in_progress', 'resolved', 'closed']

export function SupportTicketView() {
  const [data, setData] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'technical',
    priority: 'medium',
    country: '',
    reporterId: '',
  })

  useEffect(() => {
    const params = new URLSearchParams()
    if (filterCategory !== 'all') params.set('category', filterCategory)
    if (filterPriority !== 'all') params.set('priority', filterPriority)
    if (filterStatus !== 'all') params.set('status', filterStatus)

    fetch(`/api/support-tickets?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setData(d) })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [filterCategory, filterPriority, filterStatus])

  async function createTicket() {
    try {
      const body: Record<string, string> = {
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        reporterId: form.reporterId || 'default-user',
      }
      if (form.country) body.country = form.country
      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setDialogOpen(false)
        setForm({ title: '', description: '', category: 'technical', priority: 'medium', country: '', reporterId: '' })
        // Re-fetch
        const params = new URLSearchParams()
        if (filterCategory !== 'all') params.set('category', filterCategory)
        if (filterPriority !== 'all') params.set('priority', filterPriority)
        if (filterStatus !== 'all') params.set('status', filterStatus)
        fetch(`/api/support-tickets?${params.toString()}`)
          .then((r) => r.json())
          .then((d) => { if (Array.isArray(d)) setData(d) })
          .catch(() => { /* ignore */ })
      }
    } catch {
      // ignore
    }
  }

  const openCount = data.filter((d) => d.status === 'open').length
  const inProgressCount = data.filter((d) => d.status === 'in_progress' || d.status === 'assigned').length
  const resolvedCount = data.filter((d) => d.status === 'resolved' || d.status === 'closed').length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Ticket className="size-4" /> Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{openCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{resolvedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="size-4 text-muted-foreground" />
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
          <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v ?? 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {priorities.map((p) => (
                <SelectItem key={p} value={p}>{getLabel(p)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
            <SelectTrigger className="w-36">
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
          <DialogTrigger render={<Button><Plus className="size-4" />New Ticket</Button>} />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>Describe your issue or request for support.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="ticket-title">Title</Label>
                <Input
                  id="ticket-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ticket-desc">Description</Label>
                <Textarea
                  id="ticket-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Provide details about the issue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? 'technical' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{getLabel(c)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v ?? 'medium' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p} value={p}>{getLabel(p)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ticket-country">Country</Label>
                <Input
                  id="ticket-country"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  placeholder="Country (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createTicket} disabled={!form.title.trim()}>Create Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading tickets...</div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">No support tickets found.</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{ticket.title}</TableCell>
                      <TableCell>
                        <Badge variant={PRIORITY_VARIANTS[ticket.priority] ?? 'outline'}>
                          {getLabel(ticket.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getLabel(ticket.category)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[ticket.status] ?? 'outline'}>
                          {getLabel(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.reporter?.name ?? '—'}</TableCell>
                      <TableCell>{ticket.country ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString()}
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
