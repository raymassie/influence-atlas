import Anthropic from '@anthropic-ai/sdk'
import type { GeneratedContent } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CONTENT_TOOL: Anthropic.Tool = {
  name: 'publish_affirmation',
  description: 'Structured output for a daily affirmation blog post',
  input_schema: {
    type: 'object' as const,
    properties: {
      affirmation: {
        type: 'string',
        description: 'A single, powerful daily affirmation (1–2 sentences, present tense)',
      },
      blogPostTitle: {
        type: 'string',
        description: 'An engaging, SEO-friendly blog post title (50–70 characters)',
      },
      blogPostContent: {
        type: 'string',
        description: 'Full HTML blog post body (~800–1200 words). Structure: affirmation in a <blockquote>, 3–4 <h2> sections with <p> paragraphs, closing <p> call-to-action. No <html>/<head>/<body> wrapper tags.',
      },
      seoMetaDescription: {
        type: 'string',
        description: 'SEO meta description (140–160 characters)',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: '4–6 relevant tags for the post (lowercase, no special characters)',
      },
    },
    required: ['affirmation', 'blogPostTitle', 'blogPostContent', 'seoMetaDescription', 'tags'],
  },
}

export async function generateContent(
  topic: string,
  dayOfMonth: number
): Promise<GeneratedContent> {
  const systemPrompt = `You are a warm, compassionate mindfulness writer for the blog Affirmative (affirmative.blog).
Your writing is uplifting, accessible, and grounded — not preachy or overly spiritual.
You write for people navigating real daily life who want practical, heartfelt guidance.
Always write in second person ("you") to feel personal and direct.`

  const userPrompt = `Today is day ${dayOfMonth} of the month. The topic for today's daily affirmation is: **${topic}**.

Please create a complete daily affirmation blog post for this topic. The affirmation should be in present tense and feel genuinely empowering. The blog post should naturally weave the affirmation throughout, offering practical reflection and gentle encouragement.`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    tools: [CONTENT_TOOL],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: userPrompt }],
  })

  const toolUse = message.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('[claude] No tool_use block returned from API')
  }

  const input = toolUse.input as GeneratedContent
  if (!input.affirmation || !input.blogPostTitle || !input.blogPostContent) {
    throw new Error('[claude] Incomplete content returned from API')
  }

  console.log(`[claude] Generated content for topic "${topic}": "${input.blogPostTitle}"`)
  return input
}
