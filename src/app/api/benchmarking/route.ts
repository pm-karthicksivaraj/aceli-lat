import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/benchmarking — list with optional country/period/status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const period = searchParams.get('period')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (country) where.country = country
    if (period) where.period = period
    if (status) where.status = status

    const feeds = await db.benchmarkingFeed.findMany({
      where,
      orderBy: { feedDate: 'desc' },
    })

    return NextResponse.json(feeds)
  } catch (error) {
    console.error('[benchmarking] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch benchmarking feeds' }, { status: 500 })
  }
}

// POST /api/benchmarking — create a new benchmarking feed entry
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { country, period, metric, value, source, feedDate, status } = body

    if (!country || !period || !metric || value === undefined || value === null) {
      return NextResponse.json(
        { error: 'country, period, metric, and value are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'validated', 'published', 'rejected']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const newFeed = await db.benchmarkingFeed.create({
      data: {
        country,
        period,
        metric,
        value: parseFloat(String(value)),
        source: source ?? 'lat',
        feedDate: feedDate ? new Date(feedDate) : new Date(),
        status: status ?? 'pending',
      },
    })

    return NextResponse.json(newFeed, { status: 201 })
  } catch (error) {
    console.error('[benchmarking] POST error:', error)
    return NextResponse.json({ error: 'Failed to create benchmarking feed' }, { status: 500 })
  }
}
