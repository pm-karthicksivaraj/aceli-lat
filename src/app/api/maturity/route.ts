import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dimension = searchParams.get('dimension')

    const where: Record<string, string> = {}
    if (dimension) where.dimension = dimension

    const records = await db.serviceMaturity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('[MATURITY_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch service maturity records' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const record = await db.serviceMaturity.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[MATURITY_POST]', error)
    return NextResponse.json({ error: 'Failed to create service maturity record' }, { status: 500 })
  }
}
