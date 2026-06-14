import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')
    const audience = searchParams.get('audience')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (section) where.section = section
    if (audience) where.audience = audience
    if (status) where.status = status

    const records = await db.executiveReviewPack.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('[EXECUTIVE_REVIEW_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch executive review packs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const record = await db.executiveReviewPack.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[EXECUTIVE_REVIEW_POST]', error)
    return NextResponse.json({ error: 'Failed to create executive review pack' }, { status: 500 })
  }
}
