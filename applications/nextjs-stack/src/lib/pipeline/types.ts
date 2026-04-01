export type PipelineStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface PipelineRun {
  id: string
  run_date: string
  day_of_month: number
  category: string
  affirmation: string | null
  blog_post_title: string | null
  blog_post_content: string | null
  wordpress_post_id: number | null
  wordpress_post_url: string | null
  wordpress_media_id: number | null
  bigcartel_product_id: string | null
  image_url: string | null
  status: PipelineStatus
  error_message: string | null
  started_at: string
  completed_at: string | null
  created_at: string
}

export interface GeneratedContent {
  affirmation: string
  blogPostTitle: string
  blogPostContent: string
  seoMetaDescription: string
  tags: string[]
}

export interface GeneratedImage {
  imageBuffer: Buffer
  mimeType: 'image/png' | 'image/jpeg'
  promptUsed: string
}

export interface WordPressMediaResponse {
  id: number
  source_url: string
}

export interface WordPressPostResponse {
  id: number
  link: string
}

export interface BigCartelProductResponse {
  id: string
  permalink: string
}

export interface PipelineResult {
  runId: string
  category: string
  success: boolean
  alreadyRan?: boolean
  wordpressPostUrl?: string
  bigcartelProductId?: string
}
