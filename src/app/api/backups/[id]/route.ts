import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const record = await db.backupRecord.findUnique({ where: { id } })
    if (!record) {
      return NextResponse.json({ error: 'Backup record not found' }, { status: 404 })
    }
    return NextResponse.json(record)
  } catch (error) {
    console.error('[BACKUPS_GET_ID]', error)
    return NextResponse.json({ error: 'Failed to fetch backup record' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const record = await db.backupRecord.update({ where: { id }, data: body })
    return NextResponse.json(record)
  } catch (error) {
    console.error('[BACKUPS_PUT]', error)
    return NextResponse.json({ error: 'Failed to update backup record' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.backupRecord.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[BACKUPS_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete backup record' }, { status: 500 })
  }
}
