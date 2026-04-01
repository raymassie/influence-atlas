import { google } from 'googleapis'

// Static fallback: 31 categories indexed by day-of-month (1-based)
export const CATEGORIES: string[] = [
  'Mindfulness',
  'Self-compassion',
  'Gratitude',
  'Relaxation',
  'Breath awareness',
  'Body scan',
  'Positive thinking',
  'Letting go of negative thoughts',
  'Forgiveness',
  'Self-care',
  'Inner peace',
  'Self-acceptance',
  'Emotional regulation',
  'Mindful movement',
  'Creativity',
  'Focus and concentration',
  'Mindful eating',
  'Kindness',
  'Patience',
  'Self-discovery',
  'Compassion for others',
  'Self-confidence',
  'Self-esteem',
  'Mindful communication',
  'Stress management',
  'Mindful parenting',
  'Mindful relationships',
  'Spirituality',
  'Mindful decision making',
  'Mindful goal setting',
  'Mindful work',
]

export function getFallbackCategory(date: Date): string {
  const day = date.getDate()
  const index = (day - 1) % CATEGORIES.length
  return CATEGORIES[index]
}

export async function getTodaysTopic(date: Date = new Date()): Promise<string> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON

  // If Google Calendar isn't configured, use static fallback
  if (!calendarId || !serviceAccountJson) {
    console.warn('[gcal] GOOGLE_CALENDAR_ID or GOOGLE_SERVICE_ACCOUNT_JSON not set — using static fallback')
    return getFallbackCategory(date)
  }

  try {
    const credentials = JSON.parse(
      Buffer.from(serviceAccountJson, 'base64').toString('utf-8')
    )

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    })

    const calendar = google.calendar({ version: 'v3', auth })

    // Query events for the full calendar day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const response = await calendar.events.list({
      calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = response.data.items ?? []

    if (events.length === 0) {
      console.warn(`[gcal] No events found for ${date.toDateString()} — using static fallback`)
      return getFallbackCategory(date)
    }

    // Use the first event's summary as the topic
    const topic = events[0].summary?.trim()
    if (!topic) {
      console.warn(`[gcal] First event has no title for ${date.toDateString()} — using static fallback`)
      return getFallbackCategory(date)
    }

    console.log(`[gcal] Topic for ${date.toDateString()}: "${topic}"`)
    return topic
  } catch (err) {
    console.error('[gcal] Error fetching calendar event:', err)
    console.warn('[gcal] Falling back to static category list')
    return getFallbackCategory(date)
  }
}
