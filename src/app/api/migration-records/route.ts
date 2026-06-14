import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/migration-records — list with optional sourceType/status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sourceType = searchParams.get('sourceType')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (sourceType) where.sourceType = sourceType
    if (status) where.status = status

    const records = await db.migrationRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('[migration-records] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch migration records' }, { status: 500 })
  }
}

// POST /api/migration-records — create a new migration record
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      sourceType,
      sourceId,
      targetType,
      targetId,
      entity,
      status,
      sourceData,
      validationNotes,
      migratedBy,
      migratedAt,
    } = body

    if (!sourceType || !targetType || !entity) {
      return NextResponse.json(
        { error: 'sourceType, targetType, and entity are required' },
        { status: 400 }
      )
    }

    const validSourceTypes = ['google_sheets', 'salesforce', 'manual']
    if (!validSourceTypes.includes(sourceType)) {
      return NextResponse.json(
        { error: `sourceType must be one of: ${validSourceTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const validStatuses = ['mapped', 'validated', 'migrated', 'failed', 'skipped']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const newRecord = await db.migrationRecord.create({
      data: {
        sourceType,
        sourceId: sourceId ?? null,
        targetType,
        targetId: targetId ?? null,
        entity,
        status: status ?? 'mapped',
        sourceData: sourceData ?? null,
        validationNotes: validationNotes ?? null,
        migratedBy: migratedBy ?? null,
        migratedAt: migratedAt ? new Date(migratedAt) : null,
      },
    })

    return NextResponse.json(newRecord, { status: 201 })
  } catch (error) {
    console.error('[migration-records] POST error:', error)
    return NextResponse.json({ error: 'Failed to create migration record' }, { status: 500 })
  }
}
