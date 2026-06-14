import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')
    const country = searchParams.get('country')

    const where: Record<string, string> = {}
    if (severity) where.severity = severity
    if (status) where.status = status
    if (country) where.country = country

    const records = await db.incidentResponse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('[INCIDENTS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const record = await db.incidentResponse.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[INCIDENTS_POST]', error)
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 })
  }
}
