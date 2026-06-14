import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/country-configs/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const config = await db.countryConfig.findUnique({ where: { id } })

    if (!config) {
      return NextResponse.json({ error: 'Country config not found' }, { status: 404 })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('[CountryConfigs] GET by id error:', error)
    return NextResponse.json({ error: 'Failed to fetch country config' }, { status: 500 })
  }
}

// PUT /api/country-configs/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.countryConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Country config not found' }, { status: 404 })
    }

    const config = await db.countryConfig.update({
      where: { id },
      data: {
        country: body.country,
        config: body.config,
        active: body.active !== undefined ? body.active : undefined,
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('[CountryConfigs] PUT error:', error)
    if (String(error).includes('Unique constraint')) {
      return NextResponse.json({ error: 'Country config already exists for this country' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update country config' }, { status: 500 })
  }
}

// DELETE /api/country-configs/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.countryConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Country config not found' }, { status: 404 })
    }

    await db.countryConfig.delete({ where: { id } })
    return NextResponse.json({ message: 'Country config deleted' })
  } catch (error) {
    console.error('[CountryConfigs] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete country config' }, { status: 500 })
  }
}
