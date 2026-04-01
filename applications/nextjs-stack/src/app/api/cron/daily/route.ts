import { NextRequest, NextResponse } from 'next/server'
import { runDailyPipelineWithTimeout } from '@/lib/pipeline'

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runDailyPipelineWithTimeout()

    if (result.alreadyRan) {
      return NextResponse.json({
        success: true,
        message: 'Already ran today — skipped',
      })
    }

    return NextResponse.json({
      success: true,
      runId: result.runId,
      category: result.category,
      wordpressPostUrl: result.wordpressPostUrl,
      bigcartelProductId: result.bigcartelProductId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/cron/daily] Pipeline failed:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
