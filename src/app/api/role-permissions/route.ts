import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/role-permissions — List all role permissions
export async function GET() {
  try {
    const permissions = await db.rolePermission.findMany({
      orderBy: { role: 'asc' },
    })
    return NextResponse.json(permissions)
  } catch (error) {
    console.error('[ROLE_PERMISSIONS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch role permissions' }, { status: 500 })
  }
}

// POST /api/role-permissions — Create a role permission
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { role, permissions } = body

    if (!role || !permissions) {
      return NextResponse.json(
        { error: 'Missing required fields: role, permissions' },
        { status: 400 }
      )
    }

    const rolePermission = await db.rolePermission.create({
      data: {
        role,
        permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions),
      },
    })

    return NextResponse.json(rolePermission, { status: 201 })
  } catch (error: unknown) {
    console.error('[ROLE_PERMISSIONS_POST]', error)
    const message =
      error instanceof Error && error.message.includes('Unique')
        ? 'Role already exists'
        : 'Failed to create role permission'
    const status =
      error instanceof Error && error.message.includes('Unique') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
