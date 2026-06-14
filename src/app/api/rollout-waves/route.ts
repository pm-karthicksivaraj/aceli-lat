import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/rollout-waves — list with wave/country/status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wave = searchParams.get('wave')
    const country = searchParams.get('country')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (wave) where.wave = parseInt(wave, 10)
    if (country) where.country = country
    if (status) where.status = status

    const waves = await db.rolloutWave.findMany({
      where,
      include: { countryReadiness: true },
      orderBy: [{ wave: 'asc' }, { country: 'asc' }],
    })

    return NextResponse.json(waves)
  } catch (error) {
    console.error('[RolloutWaves] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch rollout waves' }, { status: 500 })
  }
}

// POST /api/rollout-waves — create
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { wave, country, status, startDate, endDate, config } = body

    if (wave === undefined || !country) {
      return NextResponse.json(
        { error: 'Missing required fields: wave, country' },
        { status: 400 }
      )
    }

    const rolloutWave = await db.rolloutWave.create({
      data: {
        wave: parseInt(String(wave), 10),
        country,
        status: status || 'planned',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        config: config || null,
      },
      include: { countryReadiness: true },
    })

    return NextResponse.json(rolloutWave, { status: 201 })
  } catch (error) {
    console.error('[RolloutWaves] POST error:', error)
    return NextResponse.json({ error: 'Failed to create rollout wave' }, { status: 500 })
  }
}
