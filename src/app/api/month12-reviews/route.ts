import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (section) where.section = section
    if (status) where.status = status

    const records = await db.month12Review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('[MONTH12_REVIEWS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch month-12 reviews' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const record = await db.month12Review.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[MONTH12_REVIEWS_POST]', error)
    return NextResponse.json({ error: 'Failed to create month-12 review' }, { status: 500 })
  }
}
