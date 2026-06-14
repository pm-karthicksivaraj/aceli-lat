import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/benchmarking/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const feed = await db.benchmarkingFeed.findUnique({ where: { id } })

    if (!feed) {
      return NextResponse.json({ error: 'Benchmarking feed not found' }, { status: 404 })
    }

    return NextResponse.json(feed)
  } catch (error) {
    console.error('[benchmarking/[id]] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch benchmarking feed' }, { status: 500 })
  }
}

// PUT /api/benchmarking/[id] — validate/publish or update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.benchmarkingFeed.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Benchmarking feed not found' }, { status: 404 })
    }

    const validStatuses = ['pending', 'validated', 'published', 'rejected']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (body.country !== undefined) data.country = body.country
    if (body.period !== undefined) data.period = body.period
    if (body.metric !== undefined) data.metric = body.metric
    if (body.value !== undefined) data.value = parseFloat(String(body.value))
    if (body.source !== undefined) data.source = body.source
    if (body.feedDate !== undefined) data.feedDate = new Date(body.feedDate)
    if (body.status !== undefined) data.status = body.status

    // If validating or publishing, set validatedBy and validatedAt
    if (body.status === 'validated' || body.status === 'published') {
      if (body.validatedBy) data.validatedBy = body.validatedBy
      data.validatedAt = new Date()
    }

    const updated = await db.benchmarkingFeed.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[benchmarking/[id]] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update benchmarking feed' }, { status: 500 })
  }
}

// DELETE /api/benchmarking/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.benchmarkingFeed.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Benchmarking feed not found' }, { status: 404 })
    }

    await db.benchmarkingFeed.delete({ where: { id } })

    return NextResponse.json({ message: 'Benchmarking feed deleted' })
  } catch (error) {
    console.error('[benchmarking/[id]] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete benchmarking feed' }, { status: 500 })
  }
}
