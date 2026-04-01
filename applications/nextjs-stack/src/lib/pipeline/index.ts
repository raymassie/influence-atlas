import { getTodaysTopic } from './gcal'
import { generateContent } from './claude'
import { generateImage } from './gemini'
import { uploadMedia, createPost } from './wordpress'
import { createProduct } from './bigcartel'
import {
  createRunRecord,
  updateRunRecord,
  failRunRecord,
  hasCompletedRunForDate,
} from './logger'
import type { PipelineResult } from './types'

const PIPELINE_TIMEOUT_MS = 270_000 // 4.5 minutes

export async function runDailyPipeline(date: Date = new Date()): Promise<PipelineResult> {
  const runDate = date.toISOString().split('T')[0] // YYYY-MM-DD
  const dayOfMonth = date.getDate()

  // Step 0 — Idempotency guard
  const alreadyRan = await hasCompletedRunForDate(runDate)
  if (alreadyRan) {
    console.log(`[pipeline] Already completed for ${runDate} — skipping`)
    return { runId: '', category: '', success: true, alreadyRan: true }
  }

  // Step 1 — Resolve today's topic from Google Calendar (with static fallback)
  const category = await getTodaysTopic(date)

  // Step 2 — Create Supabase run record
  let runId: string
  try {
    runId = await createRunRecord(runDate, category, dayOfMonth)
  } catch (err) {
    // Unique constraint violation means another instance already started — bail safely
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('unique') || message.includes('duplicate')) {
      console.warn(`[pipeline] Concurrent run detected for ${runDate} — aborting`)
      return { runId: '', category, success: true, alreadyRan: true }
    }
    throw err
  }

  console.log(`[pipeline] Started run ${runId} for ${runDate} — topic: "${category}"`)

  try {
    // Step 3 — Generate content via Claude
    const content = await generateContent(category, dayOfMonth).catch((err) => {
      throw Object.assign(err, { step: 'claude' })
    })

    await updateRunRecord(runId, {
      affirmation: content.affirmation,
      blog_post_title: content.blogPostTitle,
      blog_post_content: content.blogPostContent,
    })

    // Step 4 — Generate image via Gemini
    const image = await generateImage(category, content.affirmation).catch((err) => {
      throw Object.assign(err, { step: 'gemini' })
    })

    // Step 5 — Upload image to WordPress media library
    const slugDate = runDate.replace(/-/g, '')
    const filename = `affirmation-${slugDate}-${category.toLowerCase().replace(/\s+/g, '-')}.${image.mimeType === 'image/png' ? 'png' : 'jpg'}`

    const media = await uploadMedia(image.imageBuffer, image.mimeType, filename).catch((err) => {
      throw Object.assign(err, { step: 'wordpress-media' })
    })

    await updateRunRecord(runId, {
      wordpress_media_id: media.id,
      image_url: media.source_url,
    })

    // Step 6 — Create WordPress post
    const post = await createPost(
      content.blogPostTitle,
      content.blogPostContent,
      media.id,
      content.tags,
      content.seoMetaDescription
    ).catch((err) => {
      throw Object.assign(err, { step: 'wordpress-post' })
    })

    await updateRunRecord(runId, {
      wordpress_post_id: post.id,
      wordpress_post_url: post.link,
    })

    // Step 7 — Create Big Cartel product (best-effort — failure doesn't fail the run)
    let bigcartelProductId: string | undefined
    try {
      const product = await createProduct(category, content.affirmation, media.source_url)
      bigcartelProductId = product.id
      await updateRunRecord(runId, { bigcartel_product_id: product.id })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`[pipeline] Big Cartel step failed (non-critical): ${message}`)
      await updateRunRecord(runId, {
        error_message: `Big Cartel (non-critical): ${message}`,
      })
    }

    // Step 8 — Mark complete
    await updateRunRecord(runId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    })

    console.log(`[pipeline] Completed run ${runId} — post: ${post.link}`)

    return {
      runId,
      category,
      success: true,
      wordpressPostUrl: post.link,
      bigcartelProductId,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const step = (err as Record<string, unknown>).step ?? 'unknown'
    console.error(`[pipeline] Failed at step "${step}": ${message}`)
    await failRunRecord(runId, `[${step}] ${message}`)
    throw err
  }
}

export async function runDailyPipelineWithTimeout(
  date?: Date
): Promise<PipelineResult> {
  return Promise.race([
    runDailyPipeline(date),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Pipeline timed out after 4.5 minutes')),
        PIPELINE_TIMEOUT_MS
      )
    ),
  ])
}
