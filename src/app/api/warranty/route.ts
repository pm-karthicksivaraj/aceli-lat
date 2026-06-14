import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (country) where.country = country
    if (status) where.status = status

    const records = await db.warrantyPeriod.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('[WARRANTY_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch warranty periods' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const record = await db.warrantyPeriod.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[WARRANTY_POST]', error)
    return NextResponse.json({ error: 'Failed to create warranty period' }, { status: 500 })
  }
}
