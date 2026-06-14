import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/meetings/:id — Get meeting detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const meeting = await db.meeting.findUnique({
      where: { id },
      include: {
        lender: {
          select: { id: true, name: true, country: true, institutionType: true },
        },
        narratives: { orderBy: { createdAt: 'desc' } },
        voiceMemos: { orderBy: { createdAt: 'desc' } },
        extractions: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    return NextResponse.json(meeting)
  } catch (error) {
    console.error('[MEETING_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 })
  }
}

// PUT /api/meetings/:id — Update meeting
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.meeting.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const meeting = await db.meeting.update({
      where: { id },
      data: {
        ...(body.lenderId !== undefined && { lenderId: body.lenderId }),
        ...(body.userId !== undefined && { userId: body.userId }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.date !== undefined && { date: new Date(body.date) }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.syncStatus !== undefined && { syncStatus: body.syncStatus }),
      },
      include: {
        lender: {
          select: { id: true, name: true, country: true, institutionType: true },
        },
      },
    })

    return NextResponse.json(meeting)
  } catch (error) {
    console.error('[MEETING_PUT]', error)
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 })
  }
}

// DELETE /api/meetings/:id — Delete meeting
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.meeting.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    await db.meeting.delete({ where: { id } })
    return NextResponse.json({ message: 'Meeting deleted' })
  } catch (error) {
    console.error('[MEETING_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 })
  }
}
