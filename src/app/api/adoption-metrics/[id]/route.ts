import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const record = await db.adoptionMetric.findUnique({ where: { id } })
    if (!record) {
      return NextResponse.json({ error: 'Adoption metric not found' }, { status: 404 })
    }
    return NextResponse.json(record)
  } catch (error) {
    console.error('[ADOPTION_METRICS_GET_ID]', error)
    return NextResponse.json({ error: 'Failed to fetch adoption metric' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const record = await db.adoptionMetric.update({ where: { id }, data: body })
    return NextResponse.json(record)
  } catch (error) {
    console.error('[ADOPTION_METRICS_PUT]', error)
    return NextResponse.json({ error: 'Failed to update adoption metric' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.adoptionMetric.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADOPTION_METRICS_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete adoption metric' }, { status: 500 })
  }
}
