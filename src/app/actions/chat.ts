"use server";

import { createClient } from "@/lib/supabase/server";

interface ChatHistoryItem {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

/**
 * 获取当前用户的所有对话列表
 */
export async function getConversations(): Promise<ConversationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to load conversations:", error.message);
    return [];
  }

  return (data as ConversationItem[]) ?? [];
}

/**
 * 创建一个新对话
 */
export async function createConversation(title = "新对话"): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("conversations")
    .insert({ user_id: user.id, title })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create conversation:", error.message);
    return null;
  }

  return (data as { id: string }).id;
}

/**
 * 删除一个对话及其所有消息
 */
export async function deleteConversation(id: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete conversation:", error.message);
    return false;
  }

  return true;
}

/**
 * 重命名对话
 */
export async function renameConversation(id: string, title: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("conversations")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to rename conversation:", error.message);
    return false;
  }

  return true;
}

/**
 * 获取指定对话的聊天历史记录
 */
export async function getChatHistory(
  conversationId: string,
  limit = 100
): Promise<ChatHistoryItem[]> {
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
    .eq("conversation_id", conversationId)
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
  content: string,
  conversationId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("chat_messages")
    .insert({
      user_id: user.id,
      role,
      content,
      conversation_id: conversationId ?? null,
    })
    .select("id, role, content, created_at")
    .single();

  if (error) {
    console.error("Failed to save chat message:", error.message);
    return null;
  }

  return data;
}
