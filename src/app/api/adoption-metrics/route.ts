import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric')
    const country = searchParams.get('country')
    const period = searchParams.get('period')

    const where: Record<string, string> = {}
    if (metric) where.metric = metric
    if (country) where.country = country
    if (period) where.period = period

    const records = await db.adoptionMetric.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('[ADOPTION_METRICS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch adoption metrics' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const record = await db.adoptionMetric.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[ADOPTION_METRICS_POST]', error)
    return NextResponse.json({ error: 'Failed to create adoption metric' }, { status: 500 })
  }
}
