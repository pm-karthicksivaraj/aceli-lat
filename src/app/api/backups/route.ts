import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (type) where.type = type
    if (status) where.status = status

    const records = await db.backupRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('[BACKUPS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch backups' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const record = await db.backupRecord.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[BACKUPS_POST]', error)
    return NextResponse.json({ error: 'Failed to create backup record' }, { status: 500 })
  }
}
