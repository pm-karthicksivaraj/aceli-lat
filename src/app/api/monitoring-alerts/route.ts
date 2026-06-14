import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/monitoring-alerts — list with type/severity/status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (severity) where.severity = severity
    if (status) where.status = status

    const alerts = await db.monitoringAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('[MonitoringAlerts] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch monitoring alerts' }, { status: 500 })
  }
}

// POST /api/monitoring-alerts — create
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, severity, message, entity, entityId, country, status } = body

    if (!type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, message' },
        { status: 400 }
      )
    }

    const alert = await db.monitoringAlert.create({
      data: {
        type,
        severity: severity || 'warning',
        message,
        entity: entity || null,
        entityId: entityId || null,
        country: country || null,
        status: status || 'active',
      },
    })

    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    console.error('[MonitoringAlerts] POST error:', error)
    return NextResponse.json({ error: 'Failed to create monitoring alert' }, { status: 500 })
  }
}
