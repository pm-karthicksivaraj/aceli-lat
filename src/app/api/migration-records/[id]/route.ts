import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/migration-records/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const record = await db.migrationRecord.findUnique({ where: { id } })

    if (!record) {
      return NextResponse.json({ error: 'Migration record not found' }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('[migration-records/[id]] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch migration record' }, { status: 500 })
  }
}

// PUT /api/migration-records/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.migrationRecord.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Migration record not found' }, { status: 404 })
    }

    const validStatuses = ['mapped', 'validated', 'migrated', 'failed', 'skipped']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (body.targetType !== undefined) data.targetType = body.targetType
    if (body.targetId !== undefined) data.targetId = body.targetId
    if (body.status !== undefined) data.status = body.status
    if (body.sourceData !== undefined) data.sourceData = body.sourceData
    if (body.validationNotes !== undefined) data.validationNotes = body.validationNotes
    if (body.migratedBy !== undefined) data.migratedBy = body.migratedBy
    if (body.migratedAt !== undefined) data.migratedAt = body.migratedAt ? new Date(body.migratedAt) : null

    // If status is migrated, set migratedAt if not provided
    if (body.status === 'migrated' && !body.migratedAt) {
      data.migratedAt = new Date()
    }

    const updated = await db.migrationRecord.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[migration-records/[id]] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update migration record' }, { status: 500 })
  }
}

// DELETE /api/migration-records/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.migrationRecord.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Migration record not found' }, { status: 404 })
    }

    await db.migrationRecord.delete({ where: { id } })

    return NextResponse.json({ message: 'Migration record deleted' })
  } catch (error) {
    console.error('[migration-records/[id]] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete migration record' }, { status: 500 })
  }
}
