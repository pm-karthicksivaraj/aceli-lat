import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const record = await db.month12Review.findUnique({ where: { id } })
    if (!record) {
      return NextResponse.json({ error: 'Month-12 review not found' }, { status: 404 })
    }
    return NextResponse.json(record)
  } catch (error) {
    console.error('[MONTH12_REVIEWS_GET_ID]', error)
    return NextResponse.json({ error: 'Failed to fetch month-12 review' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const record = await db.month12Review.update({ where: { id }, data: body })
    return NextResponse.json(record)
  } catch (error) {
    console.error('[MONTH12_REVIEWS_PUT]', error)
    return NextResponse.json({ error: 'Failed to update month-12 review' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.month12Review.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[MONTH12_REVIEWS_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete month-12 review' }, { status: 500 })
  }
}
