import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/users/:id — Get user detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await db.user.findUnique({ where: { id } })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('[USER_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PUT /api/users/:id — Update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = await db.user.update({
      where: { id },
      data: {
        ...(body.email !== undefined && { email: body.email }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
        ...(body.active !== undefined && { active: body.active }),
      },
    })

    return NextResponse.json(user)
  } catch (error: unknown) {
    console.error('[USER_PUT]', error)
    const message =
      error instanceof Error && error.message.includes('Unique')
        ? 'Email already exists'
        : 'Failed to update user'
    const status =
      error instanceof Error && error.message.includes('Unique') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/users/:id — Delete user
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await db.user.delete({ where: { id } })
    return NextResponse.json({ message: 'User deleted' })
  } catch (error) {
    console.error('[USER_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
