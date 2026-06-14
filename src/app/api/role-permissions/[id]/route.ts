import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/role-permissions/:id — Get role permission detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const rolePermission = await db.rolePermission.findUnique({ where: { id } })

    if (!rolePermission) {
      return NextResponse.json({ error: 'Role permission not found' }, { status: 404 })
    }

    return NextResponse.json(rolePermission)
  } catch (error) {
    console.error('[ROLE_PERMISSION_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch role permission' }, { status: 500 })
  }
}

// PUT /api/role-permissions/:id — Update role permission
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.rolePermission.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Role permission not found' }, { status: 404 })
    }

    const rolePermission = await db.rolePermission.update({
      where: { id },
      data: {
        ...(body.role !== undefined && { role: body.role }),
        ...(body.permissions !== undefined && {
          permissions:
            typeof body.permissions === 'string'
              ? body.permissions
              : JSON.stringify(body.permissions),
        }),
      },
    })

    return NextResponse.json(rolePermission)
  } catch (error: unknown) {
    console.error('[ROLE_PERMISSION_PUT]', error)
    const message =
      error instanceof Error && error.message.includes('Unique')
        ? 'Role already exists'
        : 'Failed to update role permission'
    const status =
      error instanceof Error && error.message.includes('Unique') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/role-permissions/:id — Delete role permission
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.rolePermission.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Role permission not found' }, { status: 404 })
    }

    await db.rolePermission.delete({ where: { id } })
    return NextResponse.json({ message: 'Role permission deleted' })
  } catch (error) {
    console.error('[ROLE_PERMISSION_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete role permission' }, { status: 500 })
  }
}
