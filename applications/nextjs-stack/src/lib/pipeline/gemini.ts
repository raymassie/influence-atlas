import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GeneratedImage } from './types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateImage(
  topic: string,
  affirmation: string
): Promise<GeneratedImage> {
  const prompt = `A soft, warm watercolor illustration representing "${topic}" in the context of mindful meditation and daily affirmations. The mood is peaceful, uplifting, and serene. The composition is minimal and balanced, suitable for printing on apparel like t-shirts and mugs. Pastel tones, gentle gradients, no text or words in the image. The style is gentle and modern — think contemporary wellness illustration.`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-preview-image-generation',
  })

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      // @ts-expect-error — responseModalities is a valid param for image generation models
      responseModalities: ['IMAGE'],
    },
  })

  const response = result.response
  const parts = response.candidates?.[0]?.content?.parts ?? []

  const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'))
  if (!imagePart?.inlineData) {
    throw new Error('[gemini] No image returned from API')
  }

  const { mimeType, data } = imagePart.inlineData
  const imageBuffer = Buffer.from(data, 'base64')

  console.log(`[gemini] Generated image for topic "${topic}" (${mimeType}, ${imageBuffer.length} bytes)`)

  return {
    imageBuffer,
    mimeType: mimeType as 'image/png' | 'image/jpeg',
    promptUsed: prompt,
  }
}
