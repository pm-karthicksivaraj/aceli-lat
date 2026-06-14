import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const record = await db.outcomeKPI.findUnique({ where: { id } })
    if (!record) {
      return NextResponse.json({ error: 'Outcome KPI not found' }, { status: 404 })
    }
    return NextResponse.json(record)
  } catch (error) {
    console.error('[OUTCOME_KPIS_GET_ID]', error)
    return NextResponse.json({ error: 'Failed to fetch outcome KPI' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const record = await db.outcomeKPI.update({ where: { id }, data: body })
    return NextResponse.json(record)
  } catch (error) {
    console.error('[OUTCOME_KPIS_PUT]', error)
    return NextResponse.json({ error: 'Failed to update outcome KPI' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.outcomeKPI.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[OUTCOME_KPIS_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete outcome KPI' }, { status: 500 })
  }
}
