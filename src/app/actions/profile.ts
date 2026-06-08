'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

export async function getProfile() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  return data
}

export async function updateProfile(data: {
  full_name?: string
  grade?: string
  major?: string
  learning_goals?: string
  schedule_preferences?: Record<string, unknown>
}) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function getDashboardStats() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { courses: 0, assignments: 0, todos: 0, avgGrade: 0 }

  const [coursesRes, assignmentsRes, todosRes, gradesRes] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('assignments').select('id', { count: 'exact' }).eq('user_id', user.id).neq('status', 'completed'),
    supabase.from('todos').select('id', { count: 'exact' }).eq('user_id', user.id).eq('completed', false),
    supabase.from('grades').select('score, max_score').eq('user_id', user.id),
  ])

  const grades = gradesRes.data || []
  const avgGrade = grades.length > 0
    ? grades.reduce((sum, g) => sum + (Number(g.score) / Number(g.max_score)) * 100, 0) / grades.length
    : 0

  return {
    courses: coursesRes.count || 0,
    assignments: assignmentsRes.count || 0,
    todos: todosRes.count || 0,
    avgGrade: Math.round(avgGrade * 10) / 10,
  }
}
