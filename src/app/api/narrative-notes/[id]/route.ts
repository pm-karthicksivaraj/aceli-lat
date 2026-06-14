import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/narrative-notes/:id — Get narrative note detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const note = await db.narrativeNote.findUnique({
      where: { id },
      include: {
        meeting: {
          select: { id: true, title: true, date: true, country: true },
        },
      },
    })

    if (!note) {
      return NextResponse.json({ error: 'Narrative note not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('[NARRATIVE_NOTE_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch narrative note' }, { status: 500 })
  }
}

// PUT /api/narrative-notes/:id — Update narrative note
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.narrativeNote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Narrative note not found' }, { status: 404 })
    }

    const note = await db.narrativeNote.update({
      where: { id },
      data: {
        ...(body.content !== undefined && { content: body.content }),
        ...(body.area !== undefined && { area: body.area }),
        ...(body.source !== undefined && { source: body.source }),
        ...(body.meetingId !== undefined && { meetingId: body.meetingId }),
      },
      include: {
        meeting: {
          select: { id: true, title: true, date: true, country: true },
        },
      },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('[NARRATIVE_NOTE_PUT]', error)
    return NextResponse.json({ error: 'Failed to update narrative note' }, { status: 500 })
  }
}

// DELETE /api/narrative-notes/:id — Delete narrative note
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.narrativeNote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Narrative note not found' }, { status: 404 })
    }

    await db.narrativeNote.delete({ where: { id } })
    return NextResponse.json({ message: 'Narrative note deleted' })
  } catch (error) {
    console.error('[NARRATIVE_NOTE_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete narrative note' }, { status: 500 })
  }
}
