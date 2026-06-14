import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/kpis — list with kpiName/country/period filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const kpiName = searchParams.get('kpiName')
    const country = searchParams.get('country')
    const period = searchParams.get('period')

    const where: Record<string, unknown> = {}
    if (kpiName) where.kpiName = kpiName
    if (country) where.country = country
    if (period) where.period = period

    const kpis = await db.kPIMeasurement.findMany({
      where,
      include: { lender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(kpis)
  } catch (error) {
    console.error('[KPIs] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 })
  }
}

// POST /api/kpis — create
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { kpiName, lenderId, country, period, baseline, actual, target, unit, source } = body

    if (!kpiName || !country || !period || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields: kpiName, country, period, unit' },
        { status: 400 }
      )
    }

    const kpi = await db.kPIMeasurement.create({
      data: {
        kpiName,
        lenderId: lenderId || null,
        country,
        period,
        baseline: baseline ?? null,
        actual: actual ?? null,
        target: target ?? null,
        unit,
        source: source || 'system',
      },
      include: { lender: { select: { id: true, name: true } } },
    })

    return NextResponse.json(kpi, { status: 201 })
  } catch (error) {
    console.error('[KPIs] POST error:', error)
    return NextResponse.json({ error: 'Failed to create KPI' }, { status: 500 })
  }
}
