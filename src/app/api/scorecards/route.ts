import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/scorecards — list with optional lenderId/period filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lenderId = searchParams.get('lenderId')
    const period = searchParams.get('period')

    const where: Record<string, string> = {}
    if (lenderId) where.lenderId = lenderId
    if (period) where.period = period

    const scorecards = await db.scorecard.findMany({
      where,
      include: {
        lender: { select: { id: true, name: true, institutionType: true, country: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(scorecards)
  } catch (error) {
    console.error('[scorecards] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch scorecards' }, { status: 500 })
  }
}

// POST /api/scorecards — create a new scorecard
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      lenderId,
      period,
      lendingVolume,
      termsAlignment,
      productFit,
      pipelineStrength,
      constraintResolution,
      relationshipHealth,
      overallScore,
      reviewedAt,
    } = body

    if (!lenderId || !period) {
      return NextResponse.json(
        { error: 'lenderId and period are required' },
        { status: 400 }
      )
    }

    const newScorecard = await db.scorecard.create({
      data: {
        lenderId,
        period,
        lendingVolume: lendingVolume ?? 0,
        termsAlignment: termsAlignment ?? 0,
        productFit: productFit ?? 0,
        pipelineStrength: pipelineStrength ?? 0,
        constraintResolution: constraintResolution ?? 0,
        relationshipHealth: relationshipHealth ?? 0,
        overallScore: overallScore ?? 0,
        reviewedAt: reviewedAt ? new Date(reviewedAt) : null,
      },
      include: {
        lender: { select: { id: true, name: true, institutionType: true, country: true } },
      },
    })

    return NextResponse.json(newScorecard, { status: 201 })
  } catch (error) {
    console.error('[scorecards] POST error:', error)
    return NextResponse.json({ error: 'Failed to create scorecard' }, { status: 500 })
  }
}
