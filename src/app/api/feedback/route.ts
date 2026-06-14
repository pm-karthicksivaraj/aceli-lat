import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/feedback — list with category/status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (status) where.status = status

    const feedback = await db.userFeedback.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('[Feedback] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}

// POST /api/feedback — create
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, category, title, description, priority, status, country } = body

    if (!userId || !category || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, category, title, description' },
        { status: 400 }
      )
    }

    const feedback = await db.userFeedback.create({
      data: {
        userId,
        category,
        title,
        description,
        priority: priority || 'medium',
        status: status || 'submitted',
        country: country || null,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    console.error('[Feedback] POST error:', error)
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 })
  }
}
