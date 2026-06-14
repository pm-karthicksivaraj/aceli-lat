import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/review-decisions/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const decision = await db.reviewDecision.findUnique({
      where: { id },
      include: {
        extraction: true,
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    if (!decision) {
      return NextResponse.json({ error: 'Review decision not found' }, { status: 404 })
    }

    return NextResponse.json(decision)
  } catch (error) {
    console.error('[review-decisions/[id]] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch review decision' }, { status: 500 })
  }
}

// PUT /api/review-decisions/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.reviewDecision.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Review decision not found' }, { status: 404 })
    }

    const validDecisions = ['approved', 'rejected', 'needs_followup', 'edited']
    if (body.decision && !validDecisions.includes(body.decision)) {
      return NextResponse.json(
        { error: `decision must be one of: ${validDecisions.join(', ')}` },
        { status: 400 }
      )
    }

    const updated = await db.reviewDecision.update({
      where: { id },
      data: {
        decision: body.decision,
        originalText: body.originalText,
        editedText: body.editedText,
        rationale: body.rationale,
      },
      include: {
        extraction: true,
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[review-decisions/[id]] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update review decision' }, { status: 500 })
  }
}

// DELETE /api/review-decisions/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.reviewDecision.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Review decision not found' }, { status: 404 })
    }

    await db.reviewDecision.delete({ where: { id } })

    return NextResponse.json({ message: 'Review decision deleted' })
  } catch (error) {
    console.error('[review-decisions/[id]] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete review decision' }, { status: 500 })
  }
}
