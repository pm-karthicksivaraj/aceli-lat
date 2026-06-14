import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/validation-rules — list all rules
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity')
    const active = searchParams.get('active')

    const where: Record<string, unknown> = {}
    if (entity) where.entity = entity
    if (active !== null && active !== undefined) where.active = active === 'true'

    const rules = await db.validationRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('[validation-rules] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch validation rules' }, { status: 500 })
  }
}

// POST /api/validation-rules — create a new validation rule
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { entity, field, rule, parameters, message, active } = body

    if (!entity || !field || !rule || !message) {
      return NextResponse.json(
        { error: 'entity, field, rule, and message are required' },
        { status: 400 }
      )
    }

    const validRules = ['required', 'range', 'format', 'unique', 'custom']
    if (!validRules.includes(rule)) {
      return NextResponse.json(
        { error: `rule must be one of: ${validRules.join(', ')}` },
        { status: 400 }
      )
    }

    const newRule = await db.validationRule.create({
      data: {
        entity,
        field,
        rule,
        parameters: parameters ?? null,
        message,
        active: active ?? true,
      },
    })

    return NextResponse.json(newRule, { status: 201 })
  } catch (error) {
    console.error('[validation-rules] POST error:', error)
    return NextResponse.json({ error: 'Failed to create validation rule' }, { status: 500 })
  }
}
