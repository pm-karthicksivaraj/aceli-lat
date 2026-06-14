import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/activation-areas/:id — Get activation area detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const area = await db.activationArea.findUnique({ where: { id } })

    if (!area) {
      return NextResponse.json({ error: 'Activation area not found' }, { status: 404 })
    }

    return NextResponse.json(area)
  } catch (error) {
    console.error('[ACTIVATION_AREA_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch activation area' }, { status: 500 })
  }
}

// PUT /api/activation-areas/:id — Update activation area
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.activationArea.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Activation area not found' }, { status: 404 })
    }

    const area = await db.activationArea.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.weight !== undefined && { weight: body.weight }),
        ...(body.order !== undefined && { order: body.order }),
      },
    })

    return NextResponse.json(area)
  } catch (error: unknown) {
    console.error('[ACTIVATION_AREA_PUT]', error)
    const message =
      error instanceof Error && error.message.includes('Unique')
        ? 'Activation area with this name already exists'
        : 'Failed to update activation area'
    const status =
      error instanceof Error && error.message.includes('Unique') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/activation-areas/:id — Delete activation area
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.activationArea.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Activation area not found' }, { status: 404 })
    }

    await db.activationArea.delete({ where: { id } })
    return NextResponse.json({ message: 'Activation area deleted' })
  } catch (error) {
    console.error('[ACTIVATION_AREA_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete activation area' }, { status: 500 })
  }
}
