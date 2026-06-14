import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/review-decisions — list with optional extractionId/reviewerId filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const extractionId = searchParams.get('extractionId')
    const reviewerId = searchParams.get('reviewerId')

    const where: Record<string, string> = {}
    if (extractionId) where.extractionId = extractionId
    if (reviewerId) where.reviewerId = reviewerId

    const decisions = await db.reviewDecision.findMany({
      where,
      include: {
        extraction: true,
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { reviewedAt: 'desc' },
    })

    return NextResponse.json(decisions)
  } catch (error) {
    console.error('[review-decisions] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch review decisions' }, { status: 500 })
  }
}

// POST /api/review-decisions — create a new review decision
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { extractionId, reviewerId, decision, originalText, editedText, rationale } = body

    if (!extractionId || !reviewerId || !decision) {
      return NextResponse.json(
        { error: 'extractionId, reviewerId, and decision are required' },
        { status: 400 }
      )
    }

    const validDecisions = ['approved', 'rejected', 'needs_followup', 'edited']
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        { error: `decision must be one of: ${validDecisions.join(', ')}` },
        { status: 400 }
      )
    }

    const newDecision = await db.reviewDecision.create({
      data: {
        extractionId,
        reviewerId,
        decision,
        originalText: originalText ?? null,
        editedText: editedText ?? null,
        rationale: rationale ?? null,
      },
      include: {
        extraction: true,
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return NextResponse.json(newDecision, { status: 201 })
  } catch (error) {
    console.error('[review-decisions] POST error:', error)
    return NextResponse.json({ error: 'Failed to create review decision' }, { status: 500 })
  }
}
