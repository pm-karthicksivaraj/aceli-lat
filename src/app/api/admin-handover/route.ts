import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/admin-handover — list with section/status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (section) where.section = section
    if (status) where.status = status

    const items = await db.adminHandover.findMany({
      where,
      orderBy: [{ section: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('[AdminHandover] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch admin handover items' }, { status: 500 })
  }
}

// POST /api/admin-handover — create
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { section, status, assignee, completionDate, verificationDate, notes } = body

    if (!section) {
      return NextResponse.json(
        { error: 'Missing required field: section' },
        { status: 400 }
      )
    }

    const item = await db.adminHandover.create({
      data: {
        section,
        status: status || 'pending',
        assignee: assignee || null,
        completionDate: completionDate ? new Date(completionDate) : null,
        verificationDate: verificationDate ? new Date(verificationDate) : null,
        notes: notes || null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[AdminHandover] POST error:', error)
    return NextResponse.json({ error: 'Failed to create admin handover item' }, { status: 500 })
  }
}
