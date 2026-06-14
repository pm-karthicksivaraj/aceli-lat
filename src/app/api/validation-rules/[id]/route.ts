import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/validation-rules/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const rule = await db.validationRule.findUnique({ where: { id } })

    if (!rule) {
      return NextResponse.json({ error: 'Validation rule not found' }, { status: 404 })
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error('[validation-rules/[id]] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch validation rule' }, { status: 500 })
  }
}

// PUT /api/validation-rules/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.validationRule.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Validation rule not found' }, { status: 404 })
    }

    const validRules = ['required', 'range', 'format', 'unique', 'custom']
    if (body.rule && !validRules.includes(body.rule)) {
      return NextResponse.json(
        { error: `rule must be one of: ${validRules.join(', ')}` },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (body.entity !== undefined) data.entity = body.entity
    if (body.field !== undefined) data.field = body.field
    if (body.rule !== undefined) data.rule = body.rule
    if (body.parameters !== undefined) data.parameters = body.parameters
    if (body.message !== undefined) data.message = body.message
    if (body.active !== undefined) data.active = body.active

    const updated = await db.validationRule.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[validation-rules/[id]] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update validation rule' }, { status: 500 })
  }
}

// DELETE /api/validation-rules/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.validationRule.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Validation rule not found' }, { status: 404 })
    }

    await db.validationRule.delete({ where: { id } })

    return NextResponse.json({ message: 'Validation rule deleted' })
  } catch (error) {
    console.error('[validation-rules/[id]] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete validation rule' }, { status: 500 })
  }
}
