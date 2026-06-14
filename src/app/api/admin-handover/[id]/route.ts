import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/admin-handover/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await db.adminHandover.findUnique({ where: { id } })

    if (!item) {
      return NextResponse.json({ error: 'Admin handover item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('[AdminHandover] GET by id error:', error)
    return NextResponse.json({ error: 'Failed to fetch admin handover item' }, { status: 500 })
  }
}

// PUT /api/admin-handover/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.adminHandover.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Admin handover item not found' }, { status: 404 })
    }

    const item = await db.adminHandover.update({
      where: { id },
      data: {
        section: body.section,
        status: body.status,
        assignee: body.assignee !== undefined ? (body.assignee || null) : undefined,
        completionDate: body.completionDate !== undefined ? (body.completionDate ? new Date(body.completionDate) : null) : undefined,
        verificationDate: body.verificationDate !== undefined ? (body.verificationDate ? new Date(body.verificationDate) : null) : undefined,
        notes: body.notes !== undefined ? (body.notes || null) : undefined,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('[AdminHandover] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update admin handover item' }, { status: 500 })
  }
}

// DELETE /api/admin-handover/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.adminHandover.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Admin handover item not found' }, { status: 404 })
    }

    await db.adminHandover.delete({ where: { id } })
    return NextResponse.json({ message: 'Admin handover item deleted' })
  } catch (error) {
    console.error('[AdminHandover] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete admin handover item' }, { status: 500 })
  }
}
