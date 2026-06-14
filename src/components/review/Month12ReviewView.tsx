'use client'

import { useEffect, useState } from 'react'
import { FileText, Save, CheckCircle2, Eye, Send } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Month12Review {
  id: string
  section: string
  title: string
  content: string
  status: string
  author: string | null
  reviewer: string | null
  reviewDate: string | null
  approvalDate: string | null
}

const SECTION_LABELS: Record<string, string> = {
  executive_summary: 'Executive Summary',
  kpi_outcomes: 'KPI Outcomes',
  adoption_analysis: 'Adoption Analysis',
  impact_stories: 'Impact Stories',
  lessons_learned: 'Lessons Learned',
  recommendations: 'Recommendations',
  next_steps: 'Next Steps',
}

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: <FileText className="size-3" /> },
  reviewed: { label: 'Reviewed', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: <Eye className="size-3" /> },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <CheckCircle2 className="size-3" /> },
  published: { label: 'Published', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', icon: <Send className="size-3" /> },
}

const SECTIONS = Object.keys(SECTION_LABELS)

export function Month12ReviewView() {
  const [data, setData] = useState<Month12Review[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('executive_summary')
  const [editing, setEditing] = useState<Record<string, { title: string; content: string }>>({})

  useEffect(() => {
    fetch('/api/month12-reviews')
      .then((r) => r.json())
      .then((d) => {
        const items = Array.isArray(d) ? d : []
        setData(items)
        // Initialize editing state
        const editState: Record<string, { title: string; content: string }> = {}
        items.forEach((item: Month12Review) => {
          editState[item.section] = { title: item.title, content: item.content }
        })
        setEditing(editState)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  function getSectionData(section: string): Month12Review | undefined {
    return data.find((d) => d.section === section)
  }

  async function handleSave(section: string) {
    const edit = editing[section]
    if (!edit) return
    const existing = getSectionData(section)

    if (existing) {
      await fetch(`/api/month12-reviews/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edit),
      })
    } else {
      const res = await fetch('/api/month12-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, ...edit }),
      })
      const newItem = await res.json()
      setData((prev) => [...prev, newItem])
    }

    // Refresh data
    fetch('/api/month12-reviews')
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
  }

  async function handleStatusChange(section: string, newStatus: string) {
    const existing = getSectionData(section)
    if (!existing) return
    await fetch(`/api/month12-reviews/${existing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetch('/api/month12-reviews')
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Month-12 Review</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Month-12 Review</h2>
      </div>

      {/* Section Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList variant="line" className="flex-wrap">
          {SECTIONS.map((section) => {
            const sectionData = getSectionData(section)
            const status = sectionData?.status ?? 'draft'
            return (
              <TabsTrigger key={section} value={section}>
                {SECTION_LABELS[section]}
                {sectionData && (
                  <span className={`ml-1.5 inline-block size-1.5 rounded-full ${
                    status === 'published' ? 'bg-violet-500'
                    : status === 'approved' ? 'bg-emerald-500'
                    : status === 'reviewed' ? 'bg-sky-500'
                    : 'bg-slate-400'
                  }`} />
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {SECTIONS.map((section) => {
          const sectionData = getSectionData(section)
          const status = sectionData?.status ?? 'draft'
          const badge = STATUS_BADGE[status] ?? STATUS_BADGE.draft
          const edit = editing[section] ?? { title: '', content: '' }

          return (
            <TabsContent key={section} value={section}>
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base">{SECTION_LABELS[section]}</CardTitle>
                      <CardDescription>
                        {sectionData?.author ? `Author: ${sectionData.author}` : 'No author assigned'}
                        {sectionData?.reviewDate && (
                          <span className="ml-2">· Reviewed: {new Date(sectionData.reviewDate).toLocaleDateString()}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${badge.className} gap-1`}>
                        {badge.icon}
                        {badge.label}
                      </Badge>
                      <Select value={status} onValueChange={(v) => handleStatusChange(section, v)}>
                        <SelectTrigger size="sm" className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`review-title-${section}`}>Section Title</Label>
                    <Input
                      id={`review-title-${section}`}
                      value={edit.title}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [section]: { ...prev[section], title: e.target.value },
                        }))
                      }
                      placeholder="Section title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`review-content-${section}`}>Content</Label>
                    <Textarea
                      id={`review-content-${section}`}
                      value={edit.content}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [section]: { ...prev[section], content: e.target.value },
                        }))
                      }
                      placeholder="Write the review content for this section..."
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {sectionData?.approvalDate && (
                        <span>Approved: {new Date(sectionData.approvalDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    <Button size="sm" onClick={() => handleSave(section)}>
                      <Save className="size-4" />
                      Save Section
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
