import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/lenders/:id — Get lender detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const lender = await db.lender.findUnique({
      where: { id },
      include: {
        meetings: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    })

    if (!lender) {
      return NextResponse.json({ error: 'Lender not found' }, { status: 404 })
    }

    return NextResponse.json(lender)
  } catch (error) {
    console.error('[LENDER_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch lender' }, { status: 500 })
  }
}

// PUT /api/lenders/:id — Update lender
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.lender.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Lender not found' }, { status: 404 })
    }

    const lender = await db.lender.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.institutionType !== undefined && { institutionType: body.institutionType }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.region !== undefined && { region: body.region }),
        ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson }),
        ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
        ...(body.portfolioSize !== undefined && { portfolioSize: body.portfolioSize }),
        ...(body.activationScore !== undefined && { activationScore: body.activationScore }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.source !== undefined && { source: body.source }),
        ...(body.salesforceId !== undefined && { salesforceId: body.salesforceId }),
        ...(body.lastSyncAt !== undefined && {
          lastSyncAt: body.lastSyncAt ? new Date(body.lastSyncAt) : null,
        }),
      },
    })

    return NextResponse.json(lender)
  } catch (error: unknown) {
    console.error('[LENDER_PUT]', error)
    const message =
      error instanceof Error && error.message.includes('Unique')
        ? 'Lender with this Salesforce ID already exists'
        : 'Failed to update lender'
    const status =
      error instanceof Error && error.message.includes('Unique') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/lenders/:id — Delete lender
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.lender.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Lender not found' }, { status: 404 })
    }

    await db.lender.delete({ where: { id } })
    return NextResponse.json({ message: 'Lender deleted' })
  } catch (error) {
    console.error('[LENDER_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete lender' }, { status: 500 })
  }
}
