import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/users — List all users
export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('[USERS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/users — Create a user
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, role, country, avatar, active } = body

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, role' },
        { status: 400 }
      )
    }

    const user = await db.user.create({
      data: {
        email,
        name,
        role,
        country: country ?? null,
        avatar: avatar ?? null,
        active: active ?? true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: unknown) {
    console.error('[USERS_POST]', error)
    const message =
      error instanceof Error && error.message.includes('Unique')
        ? 'Email already exists'
        : 'Failed to create user'
    const status =
      error instanceof Error && error.message.includes('Unique') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
