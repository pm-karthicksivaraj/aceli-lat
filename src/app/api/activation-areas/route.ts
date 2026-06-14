import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/activation-areas — List all activation areas
export async function GET() {
  try {
    const areas = await db.activationArea.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(areas)
  } catch (error) {
    console.error('[ACTIVATION_AREAS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch activation areas' }, { status: 500 })
  }
}

// POST /api/activation-areas — Create an activation area
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, category, weight, order } = body

    if (!name || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, category' },
        { status: 400 }
      )
    }

    const area = await db.activationArea.create({
      data: {
        name,
        description,
        category,
        weight: weight ?? 1.0,
        order: order ?? 0,
      },
    })

    return NextResponse.json(area, { status: 201 })
  } catch (error: unknown) {
    console.error('[ACTIVATION_AREAS_POST]', error)
    const message =
      error instanceof Error && error.message.includes('Unique')
        ? 'Activation area with this name already exists'
        : 'Failed to create activation area'
    const status =
      error instanceof Error && error.message.includes('Unique') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
