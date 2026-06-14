import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/exceptions — list with optional type/severity/status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (type) where.type = type
    if (severity) where.severity = severity
    if (status) where.status = status

    const exceptions = await db.exceptionQueue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(exceptions)
  } catch (error) {
    console.error('[exceptions] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch exceptions' }, { status: 500 })
  }
}

// POST /api/exceptions — create a new exception
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { entity, entityId, type, severity, message, status } = body

    if (!entity || !entityId || !type || !message) {
      return NextResponse.json(
        { error: 'entity, entityId, type, and message are required' },
        { status: 400 }
      )
    }

    const validTypes = ['missing_field', 'low_confidence', 'conflict', 'invalid_transition', 'sync_failed', 'reviewer_rejection']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const validSeverities = ['low', 'medium', 'high', 'critical']
    if (severity && !validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `severity must be one of: ${validSeverities.join(', ')}` },
        { status: 400 }
      )
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'dismissed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const newException = await db.exceptionQueue.create({
      data: {
        entity,
        entityId,
        type,
        severity: severity ?? 'medium',
        message,
        status: status ?? 'open',
      },
    })

    return NextResponse.json(newException, { status: 201 })
  } catch (error) {
    console.error('[exceptions] POST error:', error)
    return NextResponse.json({ error: 'Failed to create exception' }, { status: 500 })
  }
}
