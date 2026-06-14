import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const record = await db.knownIssue.findUnique({ where: { id } })
    if (!record) {
      return NextResponse.json({ error: 'Known issue not found' }, { status: 404 })
    }
    return NextResponse.json(record)
  } catch (error) {
    console.error('[KNOWN_ISSUES_GET_ID]', error)
    return NextResponse.json({ error: 'Failed to fetch known issue' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const record = await db.knownIssue.update({ where: { id }, data: body })
    return NextResponse.json(record)
  } catch (error) {
    console.error('[KNOWN_ISSUES_PUT]', error)
    return NextResponse.json({ error: 'Failed to update known issue' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.knownIssue.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[KNOWN_ISSUES_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete known issue' }, { status: 500 })
  }
}
