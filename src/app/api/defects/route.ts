import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/defects — list with severity/category/status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (severity) where.severity = severity
    if (category) where.category = category
    if (status) where.status = status

    const defects = await db.pilotDefect.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(defects)
  } catch (error) {
    console.error('[Defects] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch defects' }, { status: 500 })
  }
}

// POST /api/defects — create
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, severity, category, status, assignee, country, resolution } = body

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category' },
        { status: 400 }
      )
    }

    const defect = await db.pilotDefect.create({
      data: {
        title,
        description,
        severity: severity || 'medium',
        category,
        status: status || 'open',
        assignee: assignee || null,
        country: country || null,
        resolution: resolution || null,
      },
    })

    return NextResponse.json(defect, { status: 201 })
  } catch (error) {
    console.error('[Defects] POST error:', error)
    return NextResponse.json({ error: 'Failed to create defect' }, { status: 500 })
  }
}
