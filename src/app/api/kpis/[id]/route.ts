import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/kpis/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const kpi = await db.kPIMeasurement.findUnique({
      where: { id },
      include: { lender: { select: { id: true, name: true } } },
    })

    if (!kpi) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 })
    }

    return NextResponse.json(kpi)
  } catch (error) {
    console.error('[KPIs] GET by id error:', error)
    return NextResponse.json({ error: 'Failed to fetch KPI' }, { status: 500 })
  }
}

// PUT /api/kpis/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.kPIMeasurement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 })
    }

    const kpi = await db.kPIMeasurement.update({
      where: { id },
      data: {
        kpiName: body.kpiName,
        lenderId: body.lenderId !== undefined ? (body.lenderId || null) : undefined,
        country: body.country,
        period: body.period,
        baseline: body.baseline !== undefined ? body.baseline : undefined,
        actual: body.actual !== undefined ? body.actual : undefined,
        target: body.target !== undefined ? body.target : undefined,
        unit: body.unit,
        source: body.source,
      },
      include: { lender: { select: { id: true, name: true } } },
    })

    return NextResponse.json(kpi)
  } catch (error) {
    console.error('[KPIs] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update KPI' }, { status: 500 })
  }
}

// DELETE /api/kpis/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.kPIMeasurement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 })
    }

    await db.kPIMeasurement.delete({ where: { id } })
    return NextResponse.json({ message: 'KPI deleted' })
  } catch (error) {
    console.error('[KPIs] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete KPI' }, { status: 500 })
  }
}
