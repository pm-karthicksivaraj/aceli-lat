'use client'

import { useEffect, useState } from 'react'
import { Wrench, Plus, Tag, Calendar } from 'lucide-react'
import { getLabel } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface MaintenanceItem {
  id: string
  title: string
  description: string
  category: string
  priority: string
  effort: string
  status: string
  targetDate: string | null
  completedAt: string | null
  notes: string | null
}

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const EFFORT_BADGE: Record<string, string> = {
  small: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  large: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_BADGE: Record<string, string> = {
  backlog: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  planned: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  deferred: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
}

const CATEGORY_LABELS: Record<string, string> = {
  feature: 'Feature',
  enhancement: 'Enhancement',
  tech_debt: 'Tech Debt',
  security: 'Security',
  compliance: 'Compliance',
  performance: 'Performance',
}

const CATEGORIES = ['feature', 'enhancement', 'tech_debt', 'security', 'compliance', 'performance']

export function MaintenanceRoadmap() {
  const [data, setData] = useState<MaintenanceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'enhancement',
    priority: 'medium',
    effort: 'medium',
    notes: '',
  })

  function fetchData() {
    const params = new URLSearchParams()
    if (categoryFilter !== 'all') params.set('category', categoryFilter)
    if (priorityFilter !== 'all') params.set('priority', priorityFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    fetch(`/api/maintenance?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, priorityFilter, statusFilter])

  async function handleCreate() {
    await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setDialogOpen(false)
    setForm({ title: '', description: '', category: 'enhancement', priority: 'medium', effort: 'medium', notes: '' })
    fetchData()
  }

  // Group by category
  const grouped = CATEGORIES.reduce<Record<string, MaintenanceItem[]>>((acc, cat) => {
    const items = data.filter((item) => item.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Maintenance Roadmap</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="deferred">Deferred</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm"><Plus className="size-4" />Add Item</Button>} />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Maintenance Item</DialogTitle>
                <DialogDescription>Create a new maintenance or improvement item.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="mt-title">Title</Label>
                  <Input id="mt-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Item title" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mt-desc">Description</Label>
                  <Textarea id="mt-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the item" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? 'enhancement' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v ?? 'medium' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Effort</Label>
                    <Select value={form.effort} onValueChange={(v) => setForm((f) => ({ ...f, effort: v ?? 'medium' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mt-notes">Notes</Label>
                  <Input id="mt-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!form.title}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grouped Items */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-32 rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="h-8 rounded bg-muted" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No maintenance items found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="size-4 text-primary" />
                  {CATEGORY_LABELS[category] ?? category}
                  <Badge variant="outline" className="ml-1 text-[10px]">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-lg border px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={PRIORITY_BADGE[item.priority] ?? PRIORITY_BADGE.medium}>
                          {item.priority}
                        </Badge>
                        <Badge className={EFFORT_BADGE[item.effort] ?? EFFORT_BADGE.medium}>
                          {item.effort}
                        </Badge>
                        <Badge className={STATUS_BADGE[item.status] ?? STATUS_BADGE.backlog}>
                          {getLabel(item.status)}
                        </Badge>
                        {item.targetDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="size-3" />
                            {new Date(item.targetDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
