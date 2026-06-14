import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/monitoring-alerts/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const alert = await db.monitoringAlert.findUnique({ where: { id } })

    if (!alert) {
      return NextResponse.json({ error: 'Monitoring alert not found' }, { status: 404 })
    }

    return NextResponse.json(alert)
  } catch (error) {
    console.error('[MonitoringAlerts] GET by id error:', error)
    return NextResponse.json({ error: 'Failed to fetch monitoring alert' }, { status: 500 })
  }
}

// PUT /api/monitoring-alerts/:id — update, acknowledge, or resolve
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.monitoringAlert.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Monitoring alert not found' }, { status: 404 })
    }

    // Handle acknowledge action
    if (body.action === 'acknowledge') {
      const alert = await db.monitoringAlert.update({
        where: { id },
        data: { status: 'acknowledged' },
      })
      return NextResponse.json(alert)
    }

    // Handle resolve action
    if (body.action === 'resolve') {
      const alert = await db.monitoringAlert.update({
        where: { id },
        data: {
          status: 'resolved',
          resolvedBy: body.resolvedBy || null,
          resolvedAt: new Date(),
        },
      })
      return NextResponse.json(alert)
    }

    // General update
    const alert = await db.monitoringAlert.update({
      where: { id },
      data: {
        type: body.type,
        severity: body.severity,
        message: body.message,
        entity: body.entity !== undefined ? (body.entity || null) : undefined,
        entityId: body.entityId !== undefined ? (body.entityId || null) : undefined,
        country: body.country !== undefined ? (body.country || null) : undefined,
        status: body.status,
        resolvedBy: body.resolvedBy !== undefined ? (body.resolvedBy || null) : undefined,
        resolvedAt: body.resolvedAt !== undefined ? (body.resolvedAt ? new Date(body.resolvedAt) : null) : undefined,
      },
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('[MonitoringAlerts] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update monitoring alert' }, { status: 500 })
  }
}

// DELETE /api/monitoring-alerts/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.monitoringAlert.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Monitoring alert not found' }, { status: 404 })
    }

    await db.monitoringAlert.delete({ where: { id } })
    return NextResponse.json({ message: 'Monitoring alert deleted' })
  } catch (error) {
    console.error('[MonitoringAlerts] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete monitoring alert' }, { status: 500 })
  }
}
