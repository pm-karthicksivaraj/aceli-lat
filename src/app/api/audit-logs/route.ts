import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/audit-logs — List audit logs with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    const where: Record<string, string> = {}
    if (entity) where.entity = entity
    if (userId) where.userId = userId
    if (action) where.action = action

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('[AUDIT_LOGS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

// POST /api/audit-logs — Create an audit log entry
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, action, entity, entityId, details, ipAddress } = body

    if (!userId || !action || !entity) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, action, entity' },
        { status: 400 }
      )
    }

    const log = await db.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ?? null,
        details: details ?? null,
        ipAddress: ipAddress ?? null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('[AUDIT_LOGS_POST]', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}
