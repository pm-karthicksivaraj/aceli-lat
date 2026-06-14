import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/sync-records/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const record = await db.syncRecord.findUnique({ where: { id } })

    if (!record) {
      return NextResponse.json({ error: 'Sync record not found' }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('[sync-records/[id]] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch sync record' }, { status: 500 })
  }
}

// PUT /api/sync-records/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.syncRecord.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Sync record not found' }, { status: 404 })
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'conflict']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (body.status !== undefined) data.status = body.status
    if (body.salesforceId !== undefined) data.salesforceId = body.salesforceId
    if (body.payload !== undefined) data.payload = body.payload
    if (body.errorMessage !== undefined) data.errorMessage = body.errorMessage
    if (body.retryCount !== undefined) data.retryCount = body.retryCount
    if (body.lastAttemptAt !== undefined) data.lastAttemptAt = new Date(body.lastAttemptAt)

    const updated = await db.syncRecord.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[sync-records/[id]] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update sync record' }, { status: 500 })
  }
}

// DELETE /api/sync-records/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.syncRecord.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Sync record not found' }, { status: 404 })
    }

    await db.syncRecord.delete({ where: { id } })

    return NextResponse.json({ message: 'Sync record deleted' })
  } catch (error) {
    console.error('[sync-records/[id]] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete sync record' }, { status: 500 })
  }
}
