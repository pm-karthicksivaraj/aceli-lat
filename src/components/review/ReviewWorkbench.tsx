'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ClipboardCheck,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Pencil,
  AlertTriangle,
  Clock,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

interface ExtractionDraft {
  id: string
  meetingId: string
  area: string
  extractedText: string
  confidence: number
  flags: string | null
  status: string
  createdAt: string
  updatedAt: string
  meeting?: {
    id: string
    title: string
    country: string
    lender?: { id: string; name: string }
  }
  reviews?: Array<{
    id: string
    decision: string
    rationale: string | null
    reviewedAt: string
    reviewer?: { name: string }
  }>
}

const AREA_LABELS: Record<string, string> = {
  lending_volume: 'Lending Volume',
  terms: 'Terms Alignment',
  products: 'Product Fit',
  pipeline: 'Pipeline Strength',
  constraints: 'Constraint Resolution',
  relationship: 'Relationship Health',
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-emerald-600'
  if (confidence >= 0.5) return 'text-amber-600'
  return 'text-red-600'
}

function parseFlags(flags: string | null): string[] {
  if (!flags) return []
  try {
    return JSON.parse(flags)
  } catch {
    return flags ? [flags] : []
  }
}

export function ReviewWorkbench() {
  const [drafts, setDrafts] = useState<ExtractionDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDraft, setSelectedDraft] = useState<ExtractionDraft | null>(null)
  const [reviewDecision, setReviewDecision] = useState<string>('')
  const [rationale, setRationale] = useState('')
  const [editedText, setEditedText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const fetchDraftsRef = useRef<() => Promise<void>>()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/extraction-drafts?status=pending_review')
        if (res.ok && !cancelled) {
          const data = await res.json()
          setDrafts(Array.isArray(data) ? data : data.items ?? [])
        }
      } catch {
        // ignore fetch errors in demo
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    fetchDraftsRef.current = load
    return () => { cancelled = true }
  }, [])

  async function refetchDrafts() {
    try {
      setLoading(true)
      const res = await fetch('/api/extraction-drafts?status=pending_review')
      if (res.ok) {
        const data = await res.json()
        setDrafts(Array.isArray(data) ? data : data.items ?? [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  function openReview(draft: ExtractionDraft, decision: string) {
    setSelectedDraft(draft)
    setReviewDecision(decision)
    setRationale('')
    setEditedText(draft.extractedText)
    setDialogOpen(true)
  }

  async function submitReview() {
    if (!selectedDraft) return
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        extractionId: selectedDraft.id,
        reviewerId: 'current-user',
        decision: reviewDecision,
        rationale,
      }
      if (reviewDecision === 'edited') {
        body.originalText = selectedDraft.extractedText
        body.editedText = editedText
      }
      await fetch('/api/review-decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setDialogOpen(false)
      refetchDrafts()
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading drafts for review…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardCheck className="size-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Review Workbench</h2>
          <p className="text-sm text-muted-foreground">
            {drafts.length} extraction draft{drafts.length !== 1 ? 's' : ''} pending review
          </p>
        </div>
      </div>

      {/* Draft cards */}
      {drafts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No drafts pending review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {drafts.map((draft) => {
            const flags = parseFlags(draft.flags)
            return (
              <Card key={draft.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {draft.meeting?.lender?.name ?? 'Unknown Lender'}
                      </CardTitle>
                      <CardDescription>
                        {draft.meeting?.title ?? `Meeting ${draft.meetingId.slice(-6)}`}
                        {draft.meeting?.country && (
                          <Badge variant="outline" className="ml-2">
                            {draft.meeting.country}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{AREA_LABELS[draft.area] ?? draft.area}</Badge>
                      <Badge variant="outline" className={confidenceColor(draft.confidence)}>
                        {Math.round(draft.confidence * 100)}% confidence
                      </Badge>
                      <Badge variant="ghost" className="text-muted-foreground">
                        <Clock className="mr-1 size-3" />
                        {new Date(draft.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Extracted text */}
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {draft.extractedText}
                    </p>
                  </div>

                  {/* Flags */}
                  {flags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {flags.map((flag, i) => (
                        <Badge key={i} variant="destructive" className="text-xs">
                          <AlertTriangle className="mr-1 size-3" />
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => openReview(draft, 'approved')}>
                      <ThumbsUp className="mr-1.5 size-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openReview(draft, 'rejected')}
                    >
                      <ThumbsDown className="mr-1.5 size-3.5" />
                      Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openReview(draft, 'needs_followup')}>
                      <RotateCcw className="mr-1.5 size-3.5" />
                      Request Follow-up
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openReview(draft, 'edited')}>
                      <Pencil className="mr-1.5 size-3.5" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Review dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {reviewDecision === 'approved' && 'Approve Extraction'}
              {reviewDecision === 'rejected' && 'Reject Extraction'}
              {reviewDecision === 'needs_followup' && 'Request Follow-up'}
              {reviewDecision === 'edited' && 'Edit & Approve Extraction'}
            </DialogTitle>
            <DialogDescription>
              Review the extracted text for{' '}
              <span className="font-medium">{selectedDraft?.meeting?.lender?.name ?? 'this draft'}</span>{' '}
              — {AREA_LABELS[selectedDraft?.area ?? ''] ?? selectedDraft?.area}
            </DialogDescription>
          </DialogHeader>

          {/* Show original text */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Original Text</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {selectedDraft?.extractedText}
            </p>
          </div>

          {/* Editable text for edit mode */}
          {reviewDecision === 'edited' && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Edited Text</p>
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={5}
                className="resize-y"
              />
            </div>
          )}

          {/* Rationale */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Rationale {reviewDecision !== 'approved' && '(required)'}
            </p>
            <Textarea
              placeholder="Provide your reasoning for this decision…"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              onClick={submitReview}
              disabled={
                submitting ||
                (reviewDecision !== 'approved' && !rationale.trim()) ||
                (reviewDecision === 'edited' && !editedText.trim())
              }
            >
              {submitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
