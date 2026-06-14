'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Plus, Filter } from 'lucide-react'
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

interface FeedbackItem {
  id: string
  category: string
  title: string
  description: string
  priority: string
  status: string
  country: string | null
  createdAt: string
  updatedAt: string
  user?: { id: string; name: string; email: string } | null
}

const CATEGORY_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  bug: 'destructive',
  feature: 'default',
  ux: 'secondary',
  workflow: 'outline',
  other: 'outline',
}

const PRIORITY_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  submitted: 'outline',
  reviewed: 'secondary',
  planned: 'secondary',
  implemented: 'default',
  dismissed: 'outline',
}

const categories = ['bug', 'feature', 'ux', 'workflow', 'other']
const priorities = ['low', 'medium', 'high']
const statuses = ['submitted', 'reviewed', 'planned', 'implemented', 'dismissed']

export function FeedbackView() {
  const [data, setData] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    country: '',
    userId: '',
  })

  useEffect(() => {
    const params = new URLSearchParams()
    if (filterCategory !== 'all') params.set('category', filterCategory)
    if (filterStatus !== 'all') params.set('status', filterStatus)

    fetch(`/api/feedback?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setData(d) })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [filterCategory, filterStatus])

  async function createFeedback() {
    try {
      const body: Record<string, string> = {
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        userId: form.userId || 'default-user',
      }
      if (form.country) body.country = form.country
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setDialogOpen(false)
        setForm({ title: '', description: '', category: 'other', priority: 'medium', country: '', userId: '' })
        // Re-fetch
        const params = new URLSearchParams()
        if (filterCategory !== 'all') params.set('category', filterCategory)
        if (filterStatus !== 'all') params.set('status', filterStatus)
        fetch(`/api/feedback?${params.toString()}`)
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
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? 'all')}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
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
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button><Plus className="size-4" />Submit Feedback</Button>} />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit Feedback</DialogTitle>
              <DialogDescription>Share your feedback, suggestions, or bug reports.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="fb-title">Title</Label>
                <Input
                  id="fb-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Brief title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fb-desc">Description</Label>
                <Textarea
                  id="fb-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your feedback"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? 'other' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
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
                        <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fb-country">Country</Label>
                <Input
                  id="fb-country"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  placeholder="Country (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createFeedback} disabled={!form.title.trim()}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading feedback...</div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">No feedback found.</div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {data.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MessageSquare className="size-4 text-muted-foreground" />
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={CATEGORY_VARIANTS[item.category] ?? 'outline'}>
                      {item.category}
                    </Badge>
                    <Badge variant={PRIORITY_VARIANTS[item.priority] ?? 'outline'}>
                      {item.priority}
                    </Badge>
                    <Badge variant={STATUS_VARIANTS[item.status] ?? 'outline'}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {item.user && <span>By: {item.user.name}</span>}
                  {item.country && <span>Country: {item.country}</span>}
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
