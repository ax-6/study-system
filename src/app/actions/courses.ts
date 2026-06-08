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

export async function getCourses() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)
    .order('day_of_week')
    .order('start_time')

  if (error) {
    console.error('Error fetching courses:', error)
    return []
  }
  return data
}

export async function createCourse(data: {
  name: string
  code?: string
  instructor?: string
  location?: string
  day_of_week: number
  start_time: string
  end_time: string
  color?: string
}) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  await ensureProfile(supabase, user.id, user.email!)

  const { error } = await supabase
    .from('courses')
    .insert({ ...data, user_id: user.id })

  if (error) {
    console.error('Error creating course:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/courses')
  return { success: true }
}

export async function updateCourse(id: string, data: {
  name?: string
  code?: string
  instructor?: string
  location?: string
  day_of_week?: number
  start_time?: string
  end_time?: string
  color?: string
}) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  const { error } = await supabase
    .from('courses')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating course:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/courses')
  return { success: true }
}

export async function deleteCourse(id: string) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting course:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/courses')
  return { success: true }
}
