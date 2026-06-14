import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/meetings — List meetings with optional lenderId/status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lenderId = searchParams.get('lenderId')
    const status = searchParams.get('status')
    const country = searchParams.get('country')
    const type = searchParams.get('type')

    const where: Record<string, string> = {}
    if (lenderId) where.lenderId = lenderId
    if (status) where.status = status
    if (country) where.country = country
    if (type) where.type = type

    const meetings = await db.meeting.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        lender: {
          select: { id: true, name: true, country: true, institutionType: true },
        },
      },
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error('[MEETINGS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
  }
}

// POST /api/meetings — Create a meeting
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lenderId, userId, title, date, location, type, country, status, syncStatus } = body

    if (!lenderId || !title || !date || !country) {
      return NextResponse.json(
        { error: 'Missing required fields: lenderId, title, date, country' },
        { status: 400 }
      )
    }

    // Verify lender exists
    const lender = await db.lender.findUnique({ where: { id: lenderId } })
    if (!lender) {
      return NextResponse.json({ error: 'Lender not found' }, { status: 400 })
    }

    const meeting = await db.meeting.create({
      data: {
        lenderId,
        userId: userId ?? null,
        title,
        date: new Date(date),
        location: location ?? null,
        type: type ?? 'field_visit',
        country,
        status: status ?? 'planned',
        syncStatus: syncStatus ?? 'synced',
      },
      include: {
        lender: {
          select: { id: true, name: true, country: true, institutionType: true },
        },
      },
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error('[MEETINGS_POST]', error)
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }
}
