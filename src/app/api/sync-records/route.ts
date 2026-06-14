import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/sync-records — list with optional entity/status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (entity) where.entity = entity
    if (status) where.status = status

    const records = await db.syncRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('[sync-records] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch sync records' }, { status: 500 })
  }
}

// POST /api/sync-records — create a new sync record
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { entity, entityId, direction, status, salesforceId, payload, errorMessage, retryCount, lastAttemptAt } = body

    if (!entity || !entityId || !direction) {
      return NextResponse.json(
        { error: 'entity, entityId, and direction are required' },
        { status: 400 }
      )
    }

    const validDirections = ['lat_to_sf', 'sf_to_lat']
    if (!validDirections.includes(direction)) {
      return NextResponse.json(
        { error: `direction must be one of: ${validDirections.join(', ')}` },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'conflict']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const newRecord = await db.syncRecord.create({
      data: {
        entity,
        entityId,
        direction,
        status: status ?? 'pending',
        salesforceId: salesforceId ?? null,
        payload: payload ?? null,
        errorMessage: errorMessage ?? null,
        retryCount: retryCount ?? 0,
        lastAttemptAt: lastAttemptAt ? new Date(lastAttemptAt) : null,
      },
    })

    return NextResponse.json(newRecord, { status: 201 })
  } catch (error) {
    console.error('[sync-records] POST error:', error)
    return NextResponse.json({ error: 'Failed to create sync record' }, { status: 500 })
  }
}
