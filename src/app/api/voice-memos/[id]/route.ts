import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/voice-memos/:id — Get voice memo detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const memo = await db.voiceMemo.findUnique({
      where: { id },
      include: {
        meeting: {
          select: { id: true, title: true, date: true, country: true },
        },
      },
    })

    if (!memo) {
      return NextResponse.json({ error: 'Voice memo not found' }, { status: 404 })
    }

    return NextResponse.json(memo)
  } catch (error) {
    console.error('[VOICE_MEMO_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch voice memo' }, { status: 500 })
  }
}

// PUT /api/voice-memos/:id — Update voice memo
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.voiceMemo.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Voice memo not found' }, { status: 404 })
    }

    const memo = await db.voiceMemo.update({
      where: { id },
      data: {
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.language !== undefined && { language: body.language }),
        ...(body.transcript !== undefined && { transcript: body.transcript }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.storageUrl !== undefined && { storageUrl: body.storageUrl }),
        ...(body.meetingId !== undefined && { meetingId: body.meetingId }),
      },
      include: {
        meeting: {
          select: { id: true, title: true, date: true, country: true },
        },
      },
    })

    return NextResponse.json(memo)
  } catch (error) {
    console.error('[VOICE_MEMO_PUT]', error)
    return NextResponse.json({ error: 'Failed to update voice memo' }, { status: 500 })
  }
}

// DELETE /api/voice-memos/:id — Delete voice memo
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.voiceMemo.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Voice memo not found' }, { status: 404 })
    }

    await db.voiceMemo.delete({ where: { id } })
    return NextResponse.json({ message: 'Voice memo deleted' })
  } catch (error) {
    console.error('[VOICE_MEMO_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete voice memo' }, { status: 500 })
  }
}
