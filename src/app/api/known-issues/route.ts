import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (severity) where.severity = severity
    if (category) where.category = category
    if (status) where.status = status

    const records = await db.knownIssue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('[KNOWN_ISSUES_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch known issues' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const record = await db.knownIssue.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[KNOWN_ISSUES_POST]', error)
    return NextResponse.json({ error: 'Failed to create known issue' }, { status: 500 })
  }
}
