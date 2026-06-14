import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/feedback/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const feedback = await db.userFeedback.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('[Feedback] GET by id error:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}

// PUT /api/feedback/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.userFeedback.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    const feedback = await db.userFeedback.update({
      where: { id },
      data: {
        category: body.category,
        title: body.title,
        description: body.description,
        priority: body.priority,
        status: body.status,
        country: body.country !== undefined ? (body.country || null) : undefined,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('[Feedback] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
  }
}

// DELETE /api/feedback/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.userFeedback.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    await db.userFeedback.delete({ where: { id } })
    return NextResponse.json({ message: 'Feedback deleted' })
  } catch (error) {
    console.error('[Feedback] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 })
  }
}
