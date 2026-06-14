import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/rollout-waves/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const wave = await db.rolloutWave.findUnique({
      where: { id },
      include: { countryReadiness: true },
    })

    if (!wave) {
      return NextResponse.json({ error: 'Rollout wave not found' }, { status: 404 })
    }

    return NextResponse.json(wave)
  } catch (error) {
    console.error('[RolloutWaves] GET by id error:', error)
    return NextResponse.json({ error: 'Failed to fetch rollout wave' }, { status: 500 })
  }
}

// PUT /api/rollout-waves/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.rolloutWave.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Rollout wave not found' }, { status: 404 })
    }

    const wave = await db.rolloutWave.update({
      where: { id },
      data: {
        wave: body.wave !== undefined ? parseInt(String(body.wave), 10) : undefined,
        country: body.country,
        status: body.status,
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
        endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
        config: body.config !== undefined ? (body.config || null) : undefined,
      },
      include: { countryReadiness: true },
    })

    return NextResponse.json(wave)
  } catch (error) {
    console.error('[RolloutWaves] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update rollout wave' }, { status: 500 })
  }
}

// DELETE /api/rollout-waves/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.rolloutWave.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Rollout wave not found' }, { status: 404 })
    }

    await db.rolloutWave.delete({ where: { id } })
    return NextResponse.json({ message: 'Rollout wave deleted' })
  } catch (error) {
    console.error('[RolloutWaves] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete rollout wave' }, { status: 500 })
  }
}
