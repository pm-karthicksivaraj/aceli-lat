import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/country-readiness/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const readiness = await db.countryReadiness.findUnique({
      where: { id },
      include: { rolloutWave: true },
    })

    if (!readiness) {
      return NextResponse.json({ error: 'Country readiness not found' }, { status: 404 })
    }

    return NextResponse.json(readiness)
  } catch (error) {
    console.error('[CountryReadiness] GET by id error:', error)
    return NextResponse.json({ error: 'Failed to fetch country readiness' }, { status: 500 })
  }
}

// PUT /api/country-readiness/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.countryReadiness.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Country readiness not found' }, { status: 404 })
    }

    const readiness = await db.countryReadiness.update({
      where: { id },
      data: {
        dataMigrationComplete: body.dataMigrationComplete !== undefined ? body.dataMigrationComplete : undefined,
        rolesConfigured: body.rolesConfigured !== undefined ? body.rolesConfigured : undefined,
        usersTrained: body.usersTrained !== undefined ? body.usersTrained : undefined,
        integrationVerified: body.integrationVerified !== undefined ? body.integrationVerified : undefined,
        signOffDate: body.signOffDate !== undefined ? (body.signOffDate ? new Date(body.signOffDate) : null) : undefined,
        notes: body.notes !== undefined ? (body.notes || null) : undefined,
      },
      include: { rolloutWave: true },
    })

    return NextResponse.json(readiness)
  } catch (error) {
    console.error('[CountryReadiness] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update country readiness' }, { status: 500 })
  }
}

// DELETE /api/country-readiness/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.countryReadiness.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Country readiness not found' }, { status: 404 })
    }

    await db.countryReadiness.delete({ where: { id } })
    return NextResponse.json({ message: 'Country readiness deleted' })
  } catch (error) {
    console.error('[CountryReadiness] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete country readiness' }, { status: 500 })
  }
}
