"use server";

import { createClient } from "@/lib/supabase/server";

interface ChatHistoryItem {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

/**
 * 获取当前用户的聊天历史记录
 */
export async function getChatHistory(limit = 100): Promise<ChatHistoryItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Failed to load chat history:", error.message);
    return [];
  }

  return (data as ChatHistoryItem[]) ?? [];
}

/**
 * 保存一条聊天消息到数据库
 */
export async function saveChatMessage(
  role: "user" | "assistant",
  content: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("chat_messages")
    .insert({ user_id: user.id, role, content })
    .select("id, role, content, created_at")
    .single();

  if (error) {
    console.error("Failed to save chat message:", error.message);
    return null;
  }

  return data;
}
