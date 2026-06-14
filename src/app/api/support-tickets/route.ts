import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/support-tickets — list with category/priority/status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (priority) where.priority = priority
    if (status) where.status = status

    const tickets = await db.supportTicket.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('[SupportTickets] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 })
  }
}

// POST /api/support-tickets — create
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, category, priority, status, reporterId, assigneeId, country, resolution } = body

    if (!title || !description || !category || !reporterId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category, reporterId' },
        { status: 400 }
      )
    }

    // Verify reporter exists
    const reporter = await db.user.findUnique({ where: { id: reporterId } })
    if (!reporter) {
      return NextResponse.json({ error: 'Reporter not found' }, { status: 404 })
    }

    const ticket = await db.supportTicket.create({
      data: {
        title,
        description,
        category,
        priority: priority || 'medium',
        status: status || 'open',
        reporterId,
        assigneeId: assigneeId || null,
        country: country || null,
        resolution: resolution || null,
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('[SupportTickets] POST error:', error)
    return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 })
  }
}
