import { NextRequest, NextResponse } from 'next/server'
import { runDailyPipelineWithTimeout } from '@/lib/pipeline'

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return authHeader === `Bearer ${cronSecret}`
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let date: Date = new Date()

  try {
    const body = await req.json().catch(() => ({}))
    if (body.date) {
      const parsed = new Date(body.date)
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: `Invalid date: "${body.date}". Use ISO format e.g. "2024-01-15"` },
          { status: 400 }
        )
      }
      date = parsed
    }
  } catch {
    // No body is fine — defaults to today
  }

  try {
    const result = await runDailyPipelineWithTimeout(date)

    if (result.alreadyRan) {
      return NextResponse.json({
        success: true,
        message: `Already completed for ${date.toISOString().split('T')[0]} — skipped`,
      })
    }

    return NextResponse.json({
      success: true,
      runId: result.runId,
      category: result.category,
      date: date.toISOString().split('T')[0],
      wordpressPostUrl: result.wordpressPostUrl,
      bigcartelProductId: result.bigcartelProductId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/pipeline/trigger] Pipeline failed:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
