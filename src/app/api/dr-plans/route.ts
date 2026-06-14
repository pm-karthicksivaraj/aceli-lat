import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (status) where.status = status

    const records = await db.dRPlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('[DR_PLANS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch DR plans' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const record = await db.dRPlan.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[DR_PLANS_POST]', error)
    return NextResponse.json({ error: 'Failed to create DR plan' }, { status: 500 })
  }
}
