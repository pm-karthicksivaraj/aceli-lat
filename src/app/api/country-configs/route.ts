import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/country-configs — list
export async function GET() {
  try {
    const configs = await db.countryConfig.findMany({
      orderBy: { country: 'asc' },
    })

    return NextResponse.json(configs)
  } catch (error) {
    console.error('[CountryConfigs] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch country configs' }, { status: 500 })
  }
}

// POST /api/country-configs — create
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { country, config, active } = body

    if (!country || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: country, config' },
        { status: 400 }
      )
    }

    const countryConfig = await db.countryConfig.create({
      data: {
        country,
        config,
        active: active !== undefined ? active : true,
      },
    })

    return NextResponse.json(countryConfig, { status: 201 })
  } catch (error) {
    console.error('[CountryConfigs] POST error:', error)
    if (String(error).includes('Unique constraint')) {
      return NextResponse.json({ error: 'Country config already exists for this country' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create country config' }, { status: 500 })
  }
}
