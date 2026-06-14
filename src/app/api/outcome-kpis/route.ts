import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const period = searchParams.get('period')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (category) where.category = category
    if (period) where.period = period
    if (status) where.status = status

    const records = await db.outcomeKPI.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('[OUTCOME_KPIS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch outcome KPIs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const record = await db.outcomeKPI.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[OUTCOME_KPIS_POST]', error)
    return NextResponse.json({ error: 'Failed to create outcome KPI' }, { status: 500 })
  }
}
