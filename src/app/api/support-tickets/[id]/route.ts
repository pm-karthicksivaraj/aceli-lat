import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/support-tickets/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ticket = await db.supportTicket.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Support ticket not found' }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('[SupportTickets] GET by id error:', error)
    return NextResponse.json({ error: 'Failed to fetch support ticket' }, { status: 500 })
  }
}

// PUT /api/support-tickets/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.supportTicket.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Support ticket not found' }, { status: 404 })
    }

    const ticket = await db.supportTicket.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority,
        status: body.status,
        assigneeId: body.assigneeId !== undefined ? (body.assigneeId || null) : undefined,
        country: body.country !== undefined ? (body.country || null) : undefined,
        resolution: body.resolution !== undefined ? (body.resolution || null) : undefined,
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('[SupportTickets] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update support ticket' }, { status: 500 })
  }
}

// DELETE /api/support-tickets/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.supportTicket.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Support ticket not found' }, { status: 404 })
    }

    await db.supportTicket.delete({ where: { id } })
    return NextResponse.json({ message: 'Support ticket deleted' })
  } catch (error) {
    console.error('[SupportTickets] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete support ticket' }, { status: 500 })
  }
}
