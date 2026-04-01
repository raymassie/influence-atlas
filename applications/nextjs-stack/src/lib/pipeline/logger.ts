import { supabaseAdmin } from '@/lib/supabase-server'
import type { PipelineRun } from './types'

export async function createRunRecord(
  runDate: string,
  category: string,
  dayOfMonth: number
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('pipeline_runs')
    .insert({
      run_date: runDate,
      category,
      day_of_month: dayOfMonth,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create run record: ${error.message}`)
  return data.id
}

export async function updateRunRecord(
  id: string,
  updates: Partial<PipelineRun>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('pipeline_runs')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(`Failed to update run record ${id}: ${error.message}`)
}

export async function failRunRecord(
  id: string,
  errorMessage: string,
  partialData?: Partial<PipelineRun>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('pipeline_runs')
    .update({
      ...partialData,
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) console.error(`Failed to write failure record ${id}: ${error.message}`)
}

export async function hasCompletedRunForDate(runDate: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('pipeline_runs')
    .select('id')
    .eq('run_date', runDate)
    .eq('status', 'completed')
    .maybeSingle()

  if (error) throw new Error(`Failed to check existing run: ${error.message}`)
  return data !== null
}

export async function getRecentRuns(limit = 30): Promise<PipelineRun[]> {
  const { data, error } = await supabaseAdmin
    .from('pipeline_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch recent runs: ${error.message}`)
  return data as PipelineRun[]
}
