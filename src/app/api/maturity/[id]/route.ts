import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const record = await db.serviceMaturity.findUnique({ where: { id } })
    if (!record) {
      return NextResponse.json({ error: 'Service maturity record not found' }, { status: 404 })
    }
    return NextResponse.json(record)
  } catch (error) {
    console.error('[MATURITY_GET_ID]', error)
    return NextResponse.json({ error: 'Failed to fetch service maturity record' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const record = await db.serviceMaturity.update({ where: { id }, data: body })
    return NextResponse.json(record)
  } catch (error) {
    console.error('[MATURITY_PUT]', error)
    return NextResponse.json({ error: 'Failed to update service maturity record' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.serviceMaturity.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[MATURITY_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete service maturity record' }, { status: 500 })
  }
}
