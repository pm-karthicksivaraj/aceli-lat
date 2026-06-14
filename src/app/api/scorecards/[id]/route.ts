import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/scorecards/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const scorecard = await db.scorecard.findUnique({
      where: { id },
      include: {
        lender: { select: { id: true, name: true, institutionType: true, country: true } },
      },
    })

    if (!scorecard) {
      return NextResponse.json({ error: 'Scorecard not found' }, { status: 404 })
    }

    return NextResponse.json(scorecard)
  } catch (error) {
    console.error('[scorecards/[id]] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch scorecard' }, { status: 500 })
  }
}

// PUT /api/scorecards/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.scorecard.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Scorecard not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.period !== undefined) data.period = body.period
    if (body.lendingVolume !== undefined) data.lendingVolume = body.lendingVolume
    if (body.termsAlignment !== undefined) data.termsAlignment = body.termsAlignment
    if (body.productFit !== undefined) data.productFit = body.productFit
    if (body.pipelineStrength !== undefined) data.pipelineStrength = body.pipelineStrength
    if (body.constraintResolution !== undefined) data.constraintResolution = body.constraintResolution
    if (body.relationshipHealth !== undefined) data.relationshipHealth = body.relationshipHealth
    if (body.overallScore !== undefined) data.overallScore = body.overallScore
    if (body.reviewedAt !== undefined) data.reviewedAt = body.reviewedAt ? new Date(body.reviewedAt) : null

    const updated = await db.scorecard.update({
      where: { id },
      data,
      include: {
        lender: { select: { id: true, name: true, institutionType: true, country: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[scorecards/[id]] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update scorecard' }, { status: 500 })
  }
}

// DELETE /api/scorecards/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.scorecard.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Scorecard not found' }, { status: 404 })
    }

    await db.scorecard.delete({ where: { id } })

    return NextResponse.json({ message: 'Scorecard deleted' })
  } catch (error) {
    console.error('[scorecards/[id]] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete scorecard' }, { status: 500 })
  }
}
