import type { WordPressMediaResponse, WordPressPostResponse } from './types'

const BASE_URL = process.env.WP_BASE_URL!
const WP_USERNAME = process.env.WP_USERNAME!
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD!

function getAuthHeader(): string {
  const credentials = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64')
  return `Basic ${credentials}`
}

export async function uploadMedia(
  imageBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<WordPressMediaResponse> {
  const formData = new FormData()
  const blob = new Blob([imageBuffer], { type: mimeType })
  formData.append('file', blob, filename)

  const response = await fetch(`${BASE_URL}/media`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`[wordpress] uploadMedia failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  console.log(`[wordpress] Uploaded media: id=${data.id} url=${data.source_url}`)
  return { id: data.id, source_url: data.source_url }
}

async function getOrCreateTagIds(tags: string[]): Promise<number[]> {
  const tagIds: number[] = []

  for (const tagName of tags) {
    // First try to find existing tag
    const searchResponse = await fetch(
      `${BASE_URL}/tags?search=${encodeURIComponent(tagName)}&per_page=1`,
      { headers: { Authorization: getAuthHeader() } }
    )

    if (searchResponse.ok) {
      const existing = await searchResponse.json()
      if (existing.length > 0 && existing[0].name.toLowerCase() === tagName.toLowerCase()) {
        tagIds.push(existing[0].id)
        continue
      }
    }

    // Create the tag if it doesn't exist
    const createResponse = await fetch(`${BASE_URL}/tags`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: tagName }),
    })

    if (createResponse.ok) {
      const newTag = await createResponse.json()
      tagIds.push(newTag.id)
    } else {
      console.warn(`[wordpress] Failed to create tag "${tagName}" — skipping`)
    }
  }

  return tagIds
}

export async function createPost(
  title: string,
  content: string,
  mediaId: number,
  tags: string[],
  metaDescription: string
): Promise<WordPressPostResponse> {
  const tagIds = await getOrCreateTagIds(tags)

  const categoryId = process.env.WP_DEFAULT_CATEGORY_ID
    ? parseInt(process.env.WP_DEFAULT_CATEGORY_ID)
    : undefined

  const postBody: Record<string, unknown> = {
    title,
    content,
    status: 'publish',
    featured_media: mediaId,
    format: 'standard',
    tags: tagIds,
    meta: {
      _yoast_wpseo_metadesc: metaDescription,
    },
  }

  if (categoryId) {
    postBody.categories = [categoryId]
  }

  const response = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postBody),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`[wordpress] createPost failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  console.log(`[wordpress] Created post: id=${data.id} url=${data.link}`)
  return { id: data.id, link: data.link }
}
