import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const record = await db.executiveReviewPack.findUnique({ where: { id } })
    if (!record) {
      return NextResponse.json({ error: 'Executive review pack not found' }, { status: 404 })
    }
    return NextResponse.json(record)
  } catch (error) {
    console.error('[EXECUTIVE_REVIEW_GET_ID]', error)
    return NextResponse.json({ error: 'Failed to fetch executive review pack' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const record = await db.executiveReviewPack.update({ where: { id }, data: body })
    return NextResponse.json(record)
  } catch (error) {
    console.error('[EXECUTIVE_REVIEW_PUT]', error)
    return NextResponse.json({ error: 'Failed to update executive review pack' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.executiveReviewPack.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[EXECUTIVE_REVIEW_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete executive review pack' }, { status: 500 })
  }
}
