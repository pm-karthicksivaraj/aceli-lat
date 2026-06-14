import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (category) where.category = category
    if (priority) where.priority = priority
    if (status) where.status = status

    const records = await db.maintenanceItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('[MAINTENANCE_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch maintenance items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const record = await db.maintenanceItem.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[MAINTENANCE_POST]', error)
    return NextResponse.json({ error: 'Failed to create maintenance item' }, { status: 500 })
  }
}
