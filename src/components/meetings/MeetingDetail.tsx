'use client'

import { useEffect, useState } from 'react'
import {
  Calendar,
  ArrowLeft,
  MapPin,
  Mic,
  FileText,
  Plus,
  Loader2,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Globe,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/store/useAppStore'

interface NarrativeNote {
  id: string
  content: string
  area: string
  source: string
  createdAt: string
}

interface VoiceMemo {
  id: string
  duration: number | null
  language: string | null
  transcript: string | null
  status: string
  createdAt: string
}

interface ExtractionDraft {
  id: string
  area: string
  extractedText: string
  confidence: number
  flags: string | null
  status: string
  createdAt: string
  voiceMemo: {
    id: string
    duration: number | null
    language: string | null
  } | null
}

interface MeetingDetail {
  id: string
  title: string
  date: string
  location: string | null
  type: string
  status: string
  country: string
  syncStatus: string
  lender: {
    id: string
    name: string
    country: string
    institutionType: string
  }
  narratives: NarrativeNote[]
  voiceMemos: VoiceMemo[]
  extractions: ExtractionDraft[]
}

const areaLabel = (area: string) => {
  const labels: Record<string, string> = {
    lending_volume: 'Lending Volume',
    terms: 'Terms',
    products: 'Products',
    pipeline: 'Pipeline',
    constraints: 'Constraints',
    relationship: 'Relationship',
  }
  return labels[area] ?? area
}

const statusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'completed': return 'default'
    case 'in_progress': return 'secondary'
    case 'planned': return 'outline'
    case 'cancelled': return 'destructive'
    default: return 'secondary'
  }
}

const extractionStatusIcon = (status: string) => {
  switch (status) {
    case 'approved': return <CheckCircle2 className="size-4 text-emerald-500" />
    case 'rejected': return <XCircle className="size-4 text-red-500" />
    case 'pending_review': return <AlertTriangle className="size-4 text-amber-500" />
    default: return <Clock className="size-4 text-muted-foreground" />
  }
}

const confidenceColor = (score: number) => {
  if (score >= 0.8) return 'text-emerald-600'
  if (score >= 0.5) return 'text-amber-600'
  return 'text-red-600'
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface MeetingDetailProps {
  meetingId: string
}

export function MeetingDetail({ meetingId }: MeetingDetailProps) {
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Add note form
  const [noteContent, setNoteContent] = useState('')
  const [noteArea, setNoteArea] = useState('relationship')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/meetings/${meetingId}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d && !d.error) setMeeting(d) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [meetingId])

  const handleAddNote = async () => {
    if (!noteContent.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/narrative-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          content: noteContent,
          area: noteArea,
          source: 'typed',
        }),
      })
      if (res.ok) {
        const newNote = await res.json()
        setMeeting((prev) => prev ? {
          ...prev,
          narratives: [newNote, ...prev.narratives],
        } : prev)
        setNoteContent('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Calendar className="size-10 mb-3" />
        <p className="text-sm">Meeting not found</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setCurrentView('meetings')}>
          <ArrowLeft className="size-4 mr-1" /> Back to Meetings
        </Button>
      </div>
    )
  }

  const parseFlags = (flags: string | null): string[] => {
    if (!flags) return []
    try {
      const parsed = JSON.parse(flags)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView('meetings')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight">{meeting.title}</h2>
            <Badge variant={statusBadgeVariant(meeting.status)}>
              {meeting.status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="text-[10px] capitalize">
              {meeting.type.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {new Date(meeting.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {meeting.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Globe className="size-3.5" />
              {meeting.country}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="size-3.5" />
              {meeting.lender?.name ?? 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Notes & Memos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Note Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="size-4" />
                Add Narrative Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Label htmlFor="noteArea" className="shrink-0">Area</Label>
                <Select value={noteArea} onValueChange={(v) => setNoteArea(v ?? 'relationship')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lending_volume">Lending Volume</SelectItem>
                    <SelectItem value="terms">Terms</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="pipeline">Pipeline</SelectItem>
                    <SelectItem value="constraints">Constraints</SelectItem>
                    <SelectItem value="relationship">Relationship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                id="noteContent"
                placeholder="Enter your notes about this meeting..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={submitting || !noteContent.trim()}
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin mr-1" />
                  ) : (
                    <Send className="size-4 mr-1" />
                  )}
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Narrative Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4" />
                Narrative Notes
                <Badge variant="secondary" className="text-[10px]">
                  {meeting.narratives?.length ?? 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!meeting.narratives || meeting.narratives.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileText className="size-8 mb-2" />
                  <p className="text-sm">No notes yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {meeting.narratives.map((n) => (
                    <div key={n.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[10px]">
                          {areaLabel(n.area)}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {n.source.replace('_', ' ')}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voice Memos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mic className="size-4" />
                Voice Memos
                <Badge variant="secondary" className="text-[10px]">
                  {meeting.voiceMemos?.length ?? 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!meeting.voiceMemos || meeting.voiceMemos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Mic className="size-8 mb-2" />
                  <p className="text-sm">No voice memos</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {meeting.voiceMemos.map((vm) => (
                    <div key={vm.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <Mic className="size-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{formatDuration(vm.duration)}</span>
                          {vm.language && (
                            <Badge variant="outline" className="text-[10px]">{vm.language}</Badge>
                          )}
                          <Badge
                            variant={vm.status === 'transcribed' ? 'default' : 'secondary'}
                            className="text-[10px]"
                          >
                            {vm.status}
                          </Badge>
                        </div>
                        {vm.transcript && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {vm.transcript}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Extraction Drafts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4" />
                Extraction Drafts
                <Badge variant="secondary" className="text-[10px]">
                  {meeting.extractions?.length ?? 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!meeting.extractions || meeting.extractions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileText className="size-8 mb-2" />
                  <p className="text-sm">No extractions yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {meeting.extractions.map((ex) => {
                    const flags = parseFlags(ex.flags)
                    const confPercent = Math.round(ex.confidence * 100)
                    return (
                      <div key={ex.id} className="p-3 rounded-lg border">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            {extractionStatusIcon(ex.status)}
                            <Badge variant="outline" className="text-[10px]">
                              {areaLabel(ex.area)}
                            </Badge>
                          </div>
                          <Badge
                            variant={ex.status === 'approved' ? 'default' : ex.status === 'rejected' ? 'destructive' : 'secondary'}
                            className="text-[10px] shrink-0"
                          >
                            {ex.status.replace('_', ' ')}
                          </Badge>
                        </div>

                        {/* Confidence Score */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Confidence</span>
                            <span className={`text-xs font-medium ${confidenceColor(ex.confidence)}`}>
                              {confPercent}%
                            </span>
                          </div>
                          <Progress value={confPercent} className="h-1.5" />
                        </div>

                        {/* Extracted Text */}
                        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3 mb-2">
                          {ex.extractedText}
                        </p>

                        {/* Flags */}
                        {flags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {flags.map((flag, i) => (
                              <Badge key={i} variant="destructive" className="text-[9px]">
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Source memo info */}
                        {ex.voiceMemo && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-[10px] text-muted-foreground">
                              From voice memo · {formatDuration(ex.voiceMemo.duration)}
                              {ex.voiceMemo.language && ` · ${ex.voiceMemo.language}`}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
