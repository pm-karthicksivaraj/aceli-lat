import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/narrative-notes — List narrative notes with optional meetingId filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('meetingId')
    const area = searchParams.get('area')
    const source = searchParams.get('source')

    const where: Record<string, string> = {}
    if (meetingId) where.meetingId = meetingId
    if (area) where.area = area
    if (source) where.source = source

    const notes = await db.narrativeNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        meeting: {
          select: { id: true, title: true, date: true, country: true },
        },
      },
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('[NARRATIVE_NOTES_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch narrative notes' }, { status: 500 })
  }
}

// POST /api/narrative-notes — Create a narrative note
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { meetingId, content, area, source } = body

    if (!meetingId || !content || !area) {
      return NextResponse.json(
        { error: 'Missing required fields: meetingId, content, area' },
        { status: 400 }
      )
    }

    // Verify meeting exists
    const meeting = await db.meeting.findUnique({ where: { id: meetingId } })
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 400 })
    }

    const note = await db.narrativeNote.create({
      data: {
        meetingId,
        content,
        area,
        source: source ?? 'typed',
      },
      include: {
        meeting: {
          select: { id: true, title: true, date: true, country: true },
        },
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('[NARRATIVE_NOTES_POST]', error)
    return NextResponse.json({ error: 'Failed to create narrative note' }, { status: 500 })
  }
}
