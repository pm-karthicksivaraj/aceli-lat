import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/lenders — List lenders with optional country/status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const status = searchParams.get('status')
    const institutionType = searchParams.get('institutionType')

    const where: Record<string, string> = {}
    if (country) where.country = country
    if (status) where.status = status
    if (institutionType) where.institutionType = institutionType

    const lenders = await db.lender.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(lenders)
  } catch (error) {
    console.error('[LENDERS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch lenders' }, { status: 500 })
  }
}

// POST /api/lenders — Create a lender
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      institutionType,
      country,
      region,
      contactPerson,
      contactEmail,
      contactPhone,
      portfolioSize,
      activationScore,
      status,
      source,
      salesforceId,
      lastSyncAt,
    } = body

    if (!name || !institutionType || !country) {
      return NextResponse.json(
        { error: 'Missing required fields: name, institutionType, country' },
        { status: 400 }
      )
    }

    const lender = await db.lender.create({
      data: {
        name,
        institutionType,
        country,
        region: region ?? null,
        contactPerson: contactPerson ?? null,
        contactEmail: contactEmail ?? null,
        contactPhone: contactPhone ?? null,
        portfolioSize: portfolioSize ?? null,
        activationScore: activationScore ?? 0,
        status: status ?? 'active',
        source: source ?? 'lat',
        salesforceId: salesforceId ?? null,
        lastSyncAt: lastSyncAt ? new Date(lastSyncAt) : null,
      },
    })

    return NextResponse.json(lender, { status: 201 })
  } catch (error: unknown) {
    console.error('[LENDERS_POST]', error)
    const message =
      error instanceof Error && error.message.includes('Unique')
        ? 'Lender with this Salesforce ID already exists'
        : 'Failed to create lender'
    const status =
      error instanceof Error && error.message.includes('Unique') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
