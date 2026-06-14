import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/exceptions/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const exception = await db.exceptionQueue.findUnique({ where: { id } })

    if (!exception) {
      return NextResponse.json({ error: 'Exception not found' }, { status: 404 })
    }

    return NextResponse.json(exception)
  } catch (error) {
    console.error('[exceptions/[id]] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch exception' }, { status: 500 })
  }
}

// PUT /api/exceptions/[id] — update status, resolve
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.exceptionQueue.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Exception not found' }, { status: 404 })
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'dismissed']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const validSeverities = ['low', 'medium', 'high', 'critical']
    if (body.severity && !validSeverities.includes(body.severity)) {
      return NextResponse.json(
        { error: `severity must be one of: ${validSeverities.join(', ')}` },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (body.status !== undefined) data.status = body.status
    if (body.severity !== undefined) data.severity = body.severity
    if (body.message !== undefined) data.message = body.message

    // If resolving, set resolvedBy and resolvedAt
    if (body.status === 'resolved' || body.status === 'dismissed') {
      if (body.resolvedBy) data.resolvedBy = body.resolvedBy
      data.resolvedAt = new Date()
    }

    const updated = await db.exceptionQueue.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[exceptions/[id]] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update exception' }, { status: 500 })
  }
}

// DELETE /api/exceptions/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.exceptionQueue.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Exception not found' }, { status: 404 })
    }

    await db.exceptionQueue.delete({ where: { id } })

    return NextResponse.json({ message: 'Exception deleted' })
  } catch (error) {
    console.error('[exceptions/[id]] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete exception' }, { status: 500 })
  }
}
