'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp,
  FileCheck,
  Package,
  GitBranch,
  ShieldAlert,
  Heart,
  Loader2,
  Weight,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
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

interface ActivationArea {
  id: string
  name: string
  description: string
  category: string
  weight: number
  order: number
}

const CATEGORIES = [
  { value: 'lending_volume', label: 'Lending Volume' },
  { value: 'terms', label: 'Terms' },
  { value: 'products', label: 'Products' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'constraints', label: 'Constraints' },
  { value: 'relationship', label: 'Relationship' },
]

const defaultForm = {
  name: '',
  description: '',
  category: 'lending_volume',
  weight: '1',
  order: '0',
}

const categoryIcon = (category: string) => {
  switch (category) {
    case 'lending_volume': return <TrendingUp className="size-6" />
    case 'terms': return <FileCheck className="size-6" />
    case 'products': return <Package className="size-6" />
    case 'pipeline': return <GitBranch className="size-6" />
    case 'constraints': return <ShieldAlert className="size-6" />
    case 'relationship': return <Heart className="size-6" />
    default: return <Weight className="size-6" />
  }
}

const categoryColor = (category: string) => {
  switch (category) {
    case 'lending_volume': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
    case 'terms': return 'bg-blue-500/10 text-blue-600 border-blue-200'
    case 'products': return 'bg-violet-500/10 text-violet-600 border-violet-200'
    case 'pipeline': return 'bg-amber-500/10 text-amber-600 border-amber-200'
    case 'constraints': return 'bg-red-500/10 text-red-600 border-red-200'
    case 'relationship': return 'bg-pink-500/10 text-pink-600 border-pink-200'
    default: return 'bg-gray-500/10 text-gray-600 border-gray-200'
  }
}

const categoryBgAccent = (category: string) => {
  switch (category) {
    case 'lending_volume': return 'from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background'
    case 'terms': return 'from-blue-50 to-white dark:from-blue-950/20 dark:to-background'
    case 'products': return 'from-violet-50 to-white dark:from-violet-950/20 dark:to-background'
    case 'pipeline': return 'from-amber-50 to-white dark:from-amber-950/20 dark:to-background'
    case 'constraints': return 'from-red-50 to-white dark:from-red-950/20 dark:to-background'
    case 'relationship': return 'from-pink-50 to-white dark:from-pink-950/20 dark:to-background'
    default: return 'from-gray-50 to-white dark:from-gray-950/20 dark:to-background'
  }
}

const categoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    lending_volume: 'Lending Volume',
    terms: 'Terms',
    products: 'Products',
    pipeline: 'Pipeline',
    constraints: 'Constraints',
    relationship: 'Relationship',
  }
  return labels[category] ?? category
}

export function ActivationAreaView() {
  const [areas, setAreas] = useState<ActivationArea[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<ActivationArea | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchAreas = useCallback(() => {
    fetch('/api/activation-areas')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setAreas(d) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAreas() }, [fetchAreas])

  function openEdit(area: ActivationArea) {
    setEditingArea(area)
    setForm({
      name: area.name,
      description: area.description,
      category: area.category,
      weight: String(area.weight),
      order: String(area.order),
    })
    setEditOpen(true)
  }

  async function handleCreate() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/activation-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          weight: parseFloat(form.weight) || 1,
          order: parseInt(form.order, 10) || 0,
        }),
      })
      if (res.ok) {
        setCreateOpen(false)
        fetchAreas()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit() {
    if (!editingArea) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/activation-areas/${editingArea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          weight: parseFloat(form.weight) || 1,
          order: parseInt(form.order, 10) || 0,
        }),
      })
      if (res.ok) {
        setEditOpen(false)
        setEditingArea(null)
        fetchAreas()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this activation area?')) return
    try {
      const res = await fetch(`/api/activation-areas/${id}`, { method: 'DELETE' })
      if (res.ok) fetchAreas()
    } catch { /* ignore */ }
  }

  const totalWeight = areas.reduce((sum, a) => sum + a.weight, 0)

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activation Areas</h2>
          <p className="text-sm text-muted-foreground">
            The six dimensions of lender activation scoring and intelligence
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={(open) => { if (open) setForm(defaultForm); setCreateOpen(open) }}>
          <DialogTrigger render={<Button size="sm"><Plus className="size-4 mr-1" />Create Area</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Activation Area</DialogTitle>
              <DialogDescription>Add a new activation area dimension.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="aa-name">Name</Label>
                <Input id="aa-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Area name" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="aa-desc">Description</Label>
                <Textarea id="aa-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
              </div>
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v ?? 'lending_volume' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="aa-weight">Weight</Label>
                  <Input id="aa-weight" type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="aa-order">Order</Label>
                  <Input id="aa-order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button onClick={handleCreate} disabled={submitting || !form.name}>
                {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : areas.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-muted-foreground">
            <Weight className="size-10 mb-3" />
            <p className="text-sm">No activation areas defined</p>
            <p className="text-xs mt-1">Click &ldquo;Create Area&rdquo; to add one</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Weight Distribution</h3>
                <Badge variant="outline" className="text-[10px]">
                  Total: {totalWeight.toFixed(1)}
                </Badge>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden">
                {areas.map((area) => {
                  const pct = totalWeight > 0 ? (area.weight / totalWeight) * 100 : 0
                  const colorMap: Record<string, string> = {
                    lending_volume: 'bg-emerald-500',
                    terms: 'bg-blue-500',
                    products: 'bg-violet-500',
                    pipeline: 'bg-amber-500',
                    constraints: 'bg-red-500',
                    relationship: 'bg-pink-500',
                  }
                  return (
                    <div
                      key={area.id}
                      className={`${colorMap[area.category] ?? 'bg-gray-500'} transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`${categoryLabel(area.category)}: ${pct.toFixed(1)}%`}
                    />
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {areas.map((area) => (
                  <div key={area.id} className="flex items-center gap-1.5">
                    <div
                      className={`size-2 rounded-full ${
                        area.category === 'lending_volume' ? 'bg-emerald-500' :
                        area.category === 'terms' ? 'bg-blue-500' :
                        area.category === 'products' ? 'bg-violet-500' :
                        area.category === 'pipeline' ? 'bg-amber-500' :
                        area.category === 'constraints' ? 'bg-red-500' :
                        'bg-pink-500'
                      }`}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {categoryLabel(area.category)} ({(totalWeight > 0 ? (area.weight / totalWeight) * 100 : 0).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Area Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area, index) => {
              const weightPct = totalWeight > 0 ? (area.weight / totalWeight) * 100 : 0
              return (
                <Card
                  key={area.id}
                  className={`bg-gradient-to-br ${categoryBgAccent(area.category)} border transition-shadow hover:shadow-md`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`flex size-12 items-center justify-center rounded-xl border ${categoryColor(area.category)}`}
                      >
                        {categoryIcon(area.category)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          #{index + 1}
                        </Badge>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(area)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(area.id)}>
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg mb-1">{area.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {area.description}
                    </p>

                    {/* Weight Visualization */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Weight</span>
                        <span className="text-xs font-medium">{area.weight.toFixed(1)} ({weightPct.toFixed(0)}%)</span>
                      </div>
                      <Progress value={weightPct} className="h-2" />
                    </div>

                    {/* Category Badge */}
                    <div className="mt-3">
                      <Badge className={`text-[10px] border ${categoryColor(area.category)}`}>
                        {categoryLabel(area.category)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Area Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {areas.map((area) => (
                  <div key={area.id} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className={`flex size-10 items-center justify-center rounded-lg border ${categoryColor(area.category)} shrink-0`}>
                      {categoryIcon(area.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{area.name}</h4>
                        <Badge variant="outline" className="text-[10px]">
                          {categoryLabel(area.category)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {area.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{area.weight.toFixed(1)}</p>
                      <p className="text-[10px] text-muted-foreground">weight</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(area)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(area.id)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Activation Area</DialogTitle>
            <DialogDescription>Update the activation area details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="aa-edit-name">Name</Label>
              <Input id="aa-edit-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="aa-edit-desc">Description</Label>
              <Textarea id="aa-edit-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v ?? 'lending_volume' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="aa-edit-weight">Weight</Label>
                <Input id="aa-edit-weight" type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="aa-edit-order">Order</Label>
                <Input id="aa-edit-order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={handleEdit} disabled={submitting || !form.name}>
              {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
