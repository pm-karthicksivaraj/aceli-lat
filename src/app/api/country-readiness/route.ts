import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/country-readiness — list with rolloutWaveId filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rolloutWaveId = searchParams.get('rolloutWaveId')

    const where: Record<string, unknown> = {}
    if (rolloutWaveId) where.rolloutWaveId = rolloutWaveId

    const readiness = await db.countryReadiness.findMany({
      where,
      include: { rolloutWave: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(readiness)
  } catch (error) {
    console.error('[CountryReadiness] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch country readiness' }, { status: 500 })
  }
}

// POST /api/country-readiness — create
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      rolloutWaveId,
      dataMigrationComplete,
      rolesConfigured,
      usersTrained,
      integrationVerified,
      signOffDate,
      notes,
    } = body

    if (!rolloutWaveId) {
      return NextResponse.json(
        { error: 'Missing required field: rolloutWaveId' },
        { status: 400 }
      )
    }

    // Verify rollout wave exists
    const wave = await db.rolloutWave.findUnique({ where: { id: rolloutWaveId } })
    if (!wave) {
      return NextResponse.json({ error: 'Rollout wave not found' }, { status: 404 })
    }

    const readiness = await db.countryReadiness.create({
      data: {
        rolloutWaveId,
        dataMigrationComplete: dataMigrationComplete ?? false,
        rolesConfigured: rolesConfigured ?? false,
        usersTrained: usersTrained ?? false,
        integrationVerified: integrationVerified ?? false,
        signOffDate: signOffDate ? new Date(signOffDate) : null,
        notes: notes || null,
      },
      include: { rolloutWave: true },
    })

    return NextResponse.json(readiness, { status: 201 })
  } catch (error) {
    console.error('[CountryReadiness] POST error:', error)
    if (String(error).includes('Unique constraint')) {
      return NextResponse.json({ error: 'Country readiness already exists for this rollout wave' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create country readiness' }, { status: 500 })
  }
}
