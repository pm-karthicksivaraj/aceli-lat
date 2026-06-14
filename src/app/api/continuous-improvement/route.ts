import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const source = searchParams.get('source')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (category) where.category = category
    if (source) where.source = source
    if (status) where.status = status

    const records = await db.continuousImprovementItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('[CONTINUOUS_IMPROVEMENT_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch continuous improvement items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const record = await db.continuousImprovementItem.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[CONTINUOUS_IMPROVEMENT_POST]', error)
    return NextResponse.json({ error: 'Failed to create continuous improvement item' }, { status: 500 })
  }
}
