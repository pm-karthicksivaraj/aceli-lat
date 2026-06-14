import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/extraction-drafts — List extraction drafts with optional status/meetingId filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('meetingId')
    const status = searchParams.get('status')
    const area = searchParams.get('area')

    const where: Record<string, string> = {}
    if (meetingId) where.meetingId = meetingId
    if (status) where.status = status
    if (area) where.area = area

    const drafts = await db.extractionDraft.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        meeting: {
          select: { id: true, title: true, date: true, country: true },
        },
        voiceMemo: {
          select: { id: true, duration: true, language: true, status: true },
        },
      },
    })

    return NextResponse.json(drafts)
  } catch (error) {
    console.error('[EXTRACTION_DRAFTS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch extraction drafts' }, { status: 500 })
  }
}

// POST /api/extraction-drafts — Create an extraction draft
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { meetingId, voiceMemoId, area, extractedText, confidence, flags, status } = body

    if (!meetingId || !area || !extractedText) {
      return NextResponse.json(
        { error: 'Missing required fields: meetingId, area, extractedText' },
        { status: 400 }
      )
    }

    // Verify meeting exists
    const meeting = await db.meeting.findUnique({ where: { id: meetingId } })
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 400 })
    }

    // Verify voice memo exists if provided
    if (voiceMemoId) {
      const voiceMemo = await db.voiceMemo.findUnique({ where: { id: voiceMemoId } })
      if (!voiceMemo) {
        return NextResponse.json({ error: 'Voice memo not found' }, { status: 400 })
      }
    }

    const draft = await db.extractionDraft.create({
      data: {
        meetingId,
        voiceMemoId: voiceMemoId ?? null,
        area,
        extractedText,
        confidence: confidence ?? 0,
        flags: flags ?? null,
        status: status ?? 'draft',
      },
      include: {
        meeting: {
          select: { id: true, title: true, date: true, country: true },
        },
        voiceMemo: {
          select: { id: true, duration: true, language: true, status: true },
        },
      },
    })

    return NextResponse.json(draft, { status: 201 })
  } catch (error: unknown) {
    console.error('[EXTRACTION_DRAFTS_POST]', error)
    const message =
      error instanceof Error && error.message.includes('Unique')
        ? 'Extraction draft for this voice memo already exists'
        : 'Failed to create extraction draft'
    const status =
      error instanceof Error && error.message.includes('Unique') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
