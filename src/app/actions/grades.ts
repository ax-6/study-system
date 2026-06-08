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

async function ensureProfile(supabase: Awaited<ReturnType<typeof getSupabase>>, userId: string, email: string) {
  await supabase
    .from('profiles')
    .upsert({ id: userId, email }, { onConflict: 'id', ignoreDuplicates: true })
}

export async function getGrades() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('grades')
    .select('*, courses(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching grades:', error)
    return []
  }
  return data
}

export async function createGrade(data: {
  course_id: string
  assignment_name?: string
  score: number
  max_score: number
  weight?: number
  type?: 'midterm' | 'final' | 'assignment' | 'quiz' | 'other'
}) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  await ensureProfile(supabase, user.id, user.email!)

  const { error } = await supabase
    .from('grades')
    .insert({ ...data, user_id: user.id })

  if (error) {
    console.error('Error creating grade:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/grades')
  return { success: true }
}

export async function deleteGrade(id: string) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  const { error } = await supabase
    .from('grades')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting grade:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/grades')
  return { success: true }
}
