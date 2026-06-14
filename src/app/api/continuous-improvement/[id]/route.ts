import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const record = await db.continuousImprovementItem.findUnique({ where: { id } })
    if (!record) {
      return NextResponse.json({ error: 'Continuous improvement item not found' }, { status: 404 })
    }
    return NextResponse.json(record)
  } catch (error) {
    console.error('[CONTINUOUS_IMPROVEMENT_GET_ID]', error)
    return NextResponse.json({ error: 'Failed to fetch continuous improvement item' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const record = await db.continuousImprovementItem.update({ where: { id }, data: body })
    return NextResponse.json(record)
  } catch (error) {
    console.error('[CONTINUOUS_IMPROVEMENT_PUT]', error)
    return NextResponse.json({ error: 'Failed to update continuous improvement item' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.continuousImprovementItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CONTINUOUS_IMPROVEMENT_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete continuous improvement item' }, { status: 500 })
  }
}
