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

export async function getTodos() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('completed')
    .order('due_date')

  if (error) {
    console.error('Error fetching todos:', error)
    return []
  }
  return data
}

export async function createTodo(data: {
  title: string
  description?: string
  due_date?: string
  source_type?: 'manual' | 'assignment' | 'course'
  source_id?: string
}) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  await ensureProfile(supabase, user.id, user.email!)

  const { error } = await supabase
    .from('todos')
    .insert({ ...data, user_id: user.id })

  if (error) {
    console.error('Error creating todo:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/todos')
  return { success: true }
}

export async function toggleTodo(id: string, completed: boolean) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  const { error } = await supabase
    .from('todos')
    .update({ completed })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error toggling todo:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/todos')
  return { success: true }
}

export async function updateTodo(id: string, data: {
  title?: string
  description?: string
  due_date?: string | null
}) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  const { error } = await supabase
    .from('todos')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating todo:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/todos')
  return { success: true }
}

export async function deleteTodo(id: string) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting todo:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/todos')
  return { success: true }
}
