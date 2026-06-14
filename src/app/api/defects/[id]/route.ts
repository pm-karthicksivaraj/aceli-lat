import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/defects/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const defect = await db.pilotDefect.findUnique({ where: { id } })

    if (!defect) {
      return NextResponse.json({ error: 'Defect not found' }, { status: 404 })
    }

    return NextResponse.json(defect)
  } catch (error) {
    console.error('[Defects] GET by id error:', error)
    return NextResponse.json({ error: 'Failed to fetch defect' }, { status: 500 })
  }
}

// PUT /api/defects/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.pilotDefect.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Defect not found' }, { status: 404 })
    }

    const defect = await db.pilotDefect.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        severity: body.severity,
        category: body.category,
        status: body.status,
        assignee: body.assignee !== undefined ? (body.assignee || null) : undefined,
        country: body.country !== undefined ? (body.country || null) : undefined,
        resolution: body.resolution !== undefined ? (body.resolution || null) : undefined,
      },
    })

    return NextResponse.json(defect)
  } catch (error) {
    console.error('[Defects] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update defect' }, { status: 500 })
  }
}

// DELETE /api/defects/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.pilotDefect.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Defect not found' }, { status: 404 })
    }

    await db.pilotDefect.delete({ where: { id } })
    return NextResponse.json({ message: 'Defect deleted' })
  } catch (error) {
    console.error('[Defects] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete defect' }, { status: 500 })
  }
}
