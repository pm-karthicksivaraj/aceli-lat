import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const record = await db.warrantyPeriod.findUnique({ where: { id } })
    if (!record) {
      return NextResponse.json({ error: 'Warranty period not found' }, { status: 404 })
    }
    return NextResponse.json(record)
  } catch (error) {
    console.error('[WARRANTY_GET_ID]', error)
    return NextResponse.json({ error: 'Failed to fetch warranty period' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const record = await db.warrantyPeriod.update({ where: { id }, data: body })
    return NextResponse.json(record)
  } catch (error) {
    console.error('[WARRANTY_PUT]', error)
    return NextResponse.json({ error: 'Failed to update warranty period' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.warrantyPeriod.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[WARRANTY_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete warranty period' }, { status: 500 })
  }
}
