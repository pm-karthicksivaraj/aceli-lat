'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Plus } from 'lucide-react'
import { getLabel } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ContinuousImprovementItem {
  id: string
  title: string
  description: string
  category: string
  source: string
  priority: string
  impact: string | null
  effort: string | null
  status: string
  owner: string | null
  targetDate: string | null
  completedAt: string | null
  outcomes: string | null
}

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_BADGE: Record<string, string> = {
  identified: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  analyzed: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  planned: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  in_progress: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  implemented: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  verified: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  closed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const CATEGORY_LABELS: Record<string, string> = {
  process: 'Process',
  technology: 'Technology',
  training: 'Training',
  data_quality: 'Data Quality',
  user_experience: 'User Experience',
  integration: 'Integration',
}

const SOURCE_LABELS: Record<string, string> = {
  feedback: 'Feedback',
  incident: 'Incident',
  review: 'Review',
  observation: 'Observation',
  benchmark: 'Benchmark',
}

export function ContinuousImprovementView() {
  const [data, setData] = useState<ContinuousImprovementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'process',
    source: 'feedback',
    priority: 'medium',
    impact: '',
    effort: '',
  })

  function fetchData() {
    const params = new URLSearchParams()
    if (categoryFilter !== 'all') params.set('category', categoryFilter)
    if (sourceFilter !== 'all') params.set('source', sourceFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    fetch(`/api/continuous-improvement?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, sourceFilter, statusFilter])

  async function handleCreate() {
    const body: Record<string, string> = {
      title: form.title,
      description: form.description,
      category: form.category,
      source: form.source,
      priority: form.priority,
    }
    if (form.impact) body.impact = form.impact
    if (form.effort) body.effort = form.effort

    await fetch('/api/continuous-improvement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setDialogOpen(false)
    setForm({ title: '', description: '', category: 'process', source: 'feedback', priority: 'medium', impact: '', effort: '' })
    fetchData()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Continuous Improvement</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[120px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="identified">Identified</SelectItem>
              <SelectItem value="analyzed">Analyzed</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="implemented">Implemented</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm"><Plus className="size-4" />Add Item</Button>} />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Improvement Item</DialogTitle>
                <DialogDescription>Identify a new continuous improvement opportunity.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="ci-title">Title</Label>
                  <Input id="ci-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Improvement title" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ci-desc">Description</Label>
                  <Textarea id="ci-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the improvement" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? 'process' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Source</Label>
                    <Select value={form.source} onValueChange={(v) => setForm((f) => ({ ...f, source: v ?? 'feedback' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                    <Label>Impact</Label>
                    <Select value={form.impact} onValueChange={(v) => setForm((f) => ({ ...f, impact: v ?? '' }))}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Effort</Label>
                    <Select value={form.effort} onValueChange={(v) => setForm((f) => ({ ...f, effort: v ?? '' }))}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No improvement items found.</div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {item.description}
                          </div>
                          {item.outcomes && (
                            <div className="text-xs text-emerald-600 mt-0.5 line-clamp-1">
                              Outcome: {item.outcomes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-xs">
                        {CATEGORY_LABELS[item.category] ?? getLabel(item.category)}
                      </TableCell>
                      <TableCell className="capitalize text-xs">
                        {SOURCE_LABELS[item.source] ?? item.source}
                      </TableCell>
                      <TableCell>
                        <Badge className={PRIORITY_BADGE[item.priority] ?? PRIORITY_BADGE.medium}>
                          {item.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[item.status] ?? STATUS_BADGE.identified}>
                          {getLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.owner ?? '—'}</TableCell>
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
