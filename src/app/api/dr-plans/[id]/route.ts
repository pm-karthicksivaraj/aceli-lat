import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const record = await db.dRPlan.findUnique({ where: { id } })
    if (!record) {
      return NextResponse.json({ error: 'DR plan not found' }, { status: 404 })
    }
    return NextResponse.json(record)
  } catch (error) {
    console.error('[DR_PLANS_GET_ID]', error)
    return NextResponse.json({ error: 'Failed to fetch DR plan' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const record = await db.dRPlan.update({ where: { id }, data: body })
    return NextResponse.json(record)
  } catch (error) {
    console.error('[DR_PLANS_PUT]', error)
    return NextResponse.json({ error: 'Failed to update DR plan' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.dRPlan.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DR_PLANS_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete DR plan' }, { status: 500 })
  }
}
