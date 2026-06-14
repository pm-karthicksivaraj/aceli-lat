import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/voice-memos — List voice memos with optional meetingId filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('meetingId')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (meetingId) where.meetingId = meetingId
    if (status) where.status = status

    const memos = await db.voiceMemo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        meeting: {
          select: { id: true, title: true, date: true, country: true },
        },
      },
    })

    return NextResponse.json(memos)
  } catch (error) {
    console.error('[VOICE_MEMOS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch voice memos' }, { status: 500 })
  }
}

// POST /api/voice-memos — Create a voice memo
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { meetingId, duration, language, transcript, status, storageUrl } = body

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Missing required field: meetingId' },
        { status: 400 }
      )
    }

    // Verify meeting exists
    const meeting = await db.meeting.findUnique({ where: { id: meetingId } })
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 400 })
    }

    const memo = await db.voiceMemo.create({
      data: {
        meetingId,
        duration: duration ?? null,
        language: language ?? null,
        transcript: transcript ?? null,
        status: status ?? 'recorded',
        storageUrl: storageUrl ?? null,
      },
      include: {
        meeting: {
          select: { id: true, title: true, date: true, country: true },
        },
      },
    })

    return NextResponse.json(memo, { status: 201 })
  } catch (error) {
    console.error('[VOICE_MEMOS_POST]', error)
    return NextResponse.json({ error: 'Failed to create voice memo' }, { status: 500 })
  }
}
