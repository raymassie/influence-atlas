import type { BigCartelProductResponse } from './types'

const BIGCARTEL_API = 'https://api.bigcartel.com/v1'
const ACCOUNT_ID = process.env.BIGCARTEL_ACCOUNT_ID
const ACCESS_TOKEN = process.env.BIGCARTEL_ACCESS_TOKEN
const DEFAULT_PRICE = parseFloat(process.env.BIGCARTEL_DEFAULT_PRICE ?? '24.99')

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export async function createProduct(
  topic: string,
  affirmation: string,
  imageUrl: string
): Promise<BigCartelProductResponse> {
  if (!ACCOUNT_ID || !ACCESS_TOKEN) {
    console.log('[bigcartel] Credentials not configured — skipping product creation')
    return { id: '', permalink: '' }
  }
  const productName = `${topic} — Daily Affirmation`
  const description = `<p><em>"${affirmation}"</em></p><p>A daily affirmation design inspired by the theme of ${topic}. Perfect for your morning mindfulness practice. Available on apparel and more.</p>`

  const payload = {
    data: {
      type: 'products',
      attributes: {
        name: productName,
        description,
        status: 'active',
      },
      relationships: {
        account: {
          data: { type: 'accounts', id: ACCOUNT_ID },
        },
      },
    },
  }

  const response = await fetch(`${BIGCARTEL_API}/accounts/${ACCOUNT_ID}/products`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`[bigcartel] createProduct failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  const productId = data.data?.id

  if (!productId) {
    throw new Error('[bigcartel] No product ID returned from API')
  }

  // Add a variant (required for the product to be purchasable)
  await addVariant(productId)

  // Add the image using the WordPress CDN URL
  await addProductImage(productId, imageUrl)

  const permalink = `https://affirmativeblog.bigcartel.com/product/${productId}`
  console.log(`[bigcartel] Created product: id=${productId} url=${permalink}`)

  return { id: productId, permalink }
}

async function addVariant(productId: string): Promise<void> {
  const payload = {
    data: {
      type: 'variants',
      attributes: {
        name: 'Standard',
        price: DEFAULT_PRICE,
        unlimited_quantity: true,
      },
      relationships: {
        product: {
          data: { type: 'products', id: productId },
        },
      },
    },
  }

  const response = await fetch(
    `${BIGCARTEL_API}/accounts/${ACCOUNT_ID}/products/${productId}/variants`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    console.warn(`[bigcartel] addVariant failed (${response.status}): ${text}`)
  }
}

async function addProductImage(productId: string, imageUrl: string): Promise<void> {
  const payload = {
    data: {
      type: 'product_images',
      attributes: {
        url: imageUrl,
      },
      relationships: {
        product: {
          data: { type: 'products', id: productId },
        },
      },
    },
  }

  const response = await fetch(
    `${BIGCARTEL_API}/accounts/${ACCOUNT_ID}/products/${productId}/images`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    console.warn(`[bigcartel] addProductImage failed (${response.status}): ${text}`)
  }
}
