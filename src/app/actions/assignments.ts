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

export async function getAssignments() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('assignments')
    .select('*, courses(name)')
    .eq('user_id', user.id)
    .order('due_date')

  if (error) {
    console.error('Error fetching assignments:', error)
    return []
  }
  return data
}

export async function createAssignment(data: {
  title: string
  description?: string
  course_id?: string
  due_date: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue'
}) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  await ensureProfile(supabase, user.id, user.email!)

  const { error } = await supabase
    .from('assignments')
    .insert({ ...data, user_id: user.id })

  if (error) {
    console.error('Error creating assignment:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/assignments')
  return { success: true }
}

export async function updateAssignmentStatus(id: string, status: 'pending' | 'in_progress' | 'completed' | 'overdue') {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  const { error } = await supabase
    .from('assignments')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating assignment:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/assignments')
  return { success: true }
}

export async function deleteAssignment(id: string) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting assignment:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/assignments')
  return { success: true }
}
