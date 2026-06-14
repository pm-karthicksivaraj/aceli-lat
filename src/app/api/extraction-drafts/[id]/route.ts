import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/extraction-drafts/:id — Get extraction draft detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const draft = await db.extractionDraft.findUnique({
      where: { id },
      include: {
        meeting: {
          select: { id: true, title: true, date: true, country: true },
        },
        voiceMemo: {
          select: { id: true, duration: true, language: true, status: true },
        },
        reviews: {
          include: {
            reviewer: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { reviewedAt: 'desc' },
        },
      },
    })

    if (!draft) {
      return NextResponse.json({ error: 'Extraction draft not found' }, { status: 404 })
    }

    return NextResponse.json(draft)
  } catch (error) {
    console.error('[EXTRACTION_DRAFT_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch extraction draft' }, { status: 500 })
  }
}

// PUT /api/extraction-drafts/:id — Update extraction draft
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.extractionDraft.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Extraction draft not found' }, { status: 404 })
    }

    const draft = await db.extractionDraft.update({
      where: { id },
      data: {
        ...(body.meetingId !== undefined && { meetingId: body.meetingId }),
        ...(body.voiceMemoId !== undefined && { voiceMemoId: body.voiceMemoId }),
        ...(body.area !== undefined && { area: body.area }),
        ...(body.extractedText !== undefined && { extractedText: body.extractedText }),
        ...(body.confidence !== undefined && { confidence: body.confidence }),
        ...(body.flags !== undefined && { flags: body.flags }),
        ...(body.status !== undefined && { status: body.status }),
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

    return NextResponse.json(draft)
  } catch (error: unknown) {
    console.error('[EXTRACTION_DRAFT_PUT]', error)
    const message =
      error instanceof Error && error.message.includes('Unique')
        ? 'Extraction draft for this voice memo already exists'
        : 'Failed to update extraction draft'
    const status =
      error instanceof Error && error.message.includes('Unique') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/extraction-drafts/:id — Delete extraction draft
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.extractionDraft.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Extraction draft not found' }, { status: 404 })
    }

    await db.extractionDraft.delete({ where: { id } })
    return NextResponse.json({ message: 'Extraction draft deleted' })
  } catch (error) {
    console.error('[EXTRACTION_DRAFT_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete extraction draft' }, { status: 500 })
  }
}
