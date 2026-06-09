"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getConversations,
  createConversation,
  deleteConversation,
  renameConversation,
  getChatHistory,
} from "@/app/actions/chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import {
  Bot,
  User,
  Loader2,
  BookOpen,
  FileText,
  Calendar,
  BarChart3,
  Sparkles,
  ArrowRight,
  Menu,
} from "lucide-react";
import { ChatInput } from "@/components/chat/chat-input";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { TypingLoader } from "@/components/chat/typing-loader";
import { ToolInvocation } from "@/components/chat/tool-invocation";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const quickActions = [
  {
    icon: BookOpen,
    label: "管理课程",
    prompt: "帮我查看当前的课程安排",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    icon: FileText,
    label: "作业跟踪",
    prompt: "我有哪些待完成的作业？",
    color: "bg-yellow-500/10 text-yellow-500",
  },
  {
    icon: Calendar,
    label: "日程管理",
    prompt: "帮我查看今天的待办事项",
    color: "bg-green-500/10 text-green-500",
  },
  {
    icon: BarChart3,
    label: "成绩分析",
    prompt: "帮我分析一下我的成绩情况",
    color: "bg-purple-500/10 text-purple-500",
  },
];

const WELCOME_MESSAGE: UIMessage = {
  id: "welcome",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "你好！我是 **智慧学习AI Agent**，你的 AI 学习管理助手。🎓\n\n我具备以下能力：\n\n• 📚 **课程管理** — 查询、添加、修改课程安排\n• 📝 **作业管理** — 跟踪作业进度、提醒截止日期\n• 📅 **日程管理** — 管理待办事项、规划学习时间\n• 📊 **成绩分析** — 记录成绩、分析学习趋势\n• 💡 **学习建议** — 基于数据提供个性化建议\n\n你可以直接告诉我你想做什么，或者点击下方的快捷操作开始！",
    },
  ],
};

export default function Home() {
  const router = useRouter();
  const { user, loading, refreshSession } = useAuth();

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const conversationIdRef = useRef<string | null>(null);

  // useChat hook — the core streaming chat state
  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        conversationId: conversationIdRef.current,
      }),
    }),
    onFinish: ({ message }) => {
      // Check if the server created a new conversation (look for conversationId in response)
      // The server sets conversationId, we need to capture it
      // We'll handle this by checking after the stream completes
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  // Fix auth state
  useEffect(() => {
    if (!loading && !user) {
      refreshSession();
    }
  }, [loading, user, refreshSession]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const convs = await getConversations();
    setConversations(convs);
  }, [user]);

  useEffect(() => {
    if (!user || loading) return;
    loadConversations();
  }, [user, loading, loadConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId || !user) {
      setMessages([WELCOME_MESSAGE]);
      conversationIdRef.current = null;
      return;
    }

    conversationIdRef.current = activeConversationId;

    let cancelled = false;
    getChatHistory(activeConversationId).then((history) => {
      if (cancelled || !history || history.length === 0) {
        if (!cancelled) setMessages([WELCOME_MESSAGE]);
        return;
      }
      const loadedMessages: UIMessage[] = history.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: msg.content }],
      }));
      if (!cancelled) setMessages(loadedMessages);
    });

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, user, setMessages]);

  // Create a new conversation
  const handleNewConversation = () => {
    setActiveConversationId(null);
    conversationIdRef.current = null;
    setMessages([WELCOME_MESSAGE]);
    setMobileSidebarOpen(false);
  };

  // Select an existing conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    conversationIdRef.current = id;
    setMobileSidebarOpen(false);
  };

  // Delete a conversation
  const handleDeleteConversation = async (id: string) => {
    const success = await deleteConversation(id);
    if (success) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewConversation();
      }
    }
  };

  // Rename a conversation
  const handleRenameConversation = async (id: string, title: string) => {
    const success = await renameConversation(id, title);
    if (success) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    }
  };

  // Send a message (with optional file attachments)
  const handleSendMessage = async (text?: string, files?: File[]) => {
    const messageText = (text || "").trim();
    if ((!messageText && (!files || files.length === 0)) || isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Convert File[] to FileUIPart[] for the AI SDK
    const fileParts = files?.length
      ? await Promise.all(
          files.map(
            (file) =>
              new Promise<{
                type: "file";
                mediaType: string;
                filename: string;
                url: string;
              }>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                  resolve({
                    type: "file" as const,
                    mediaType: file.type,
                    filename: file.name,
                    url: reader.result as string,
                  });
                };
                reader.readAsDataURL(file);
              })
          )
        )
      : undefined;

    // Use sendMessage from useChat
    sendMessage(
      { text: messageText || "请分析这些文件", files: fileParts },
      {
        body: {
          conversationId: conversationIdRef.current,
        },
      }
    );

    // After sending, reload conversations to pick up new ones
    setTimeout(() => {
      loadConversations().then(() => {
        // If we didn't have an active conversation, check for the new one
        if (!activeConversationId) {
          getConversations().then((convs) => {
            if (convs.length > 0) {
              const newest = convs[0]; // sorted by updated_at
              setActiveConversationId(newest.id);
              conversationIdRef.current = newest.id;
            }
          });
        }
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <TypingLoader showIcon={false} className="text-base" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <div className="hidden md:block">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onCreate={handleNewConversation}
          onDelete={handleDeleteConversation}
          onRename={handleRenameConversation}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Sidebar - mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform md:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onCreate={handleNewConversation}
          onDelete={handleDeleteConversation}
          onRename={handleRenameConversation}
          collapsed={false}
          onToggleCollapse={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">智慧学习AI Agent</h1>
              <p className="text-xs text-muted-foreground">
                AI Agent 智能学习管理
                {status === "streaming" && " · 生成中..."}
                {status === "submitted" && " · 提交中..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                进入仪表板
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => router.push("/login")}>
                  登录
                </Button>
                <Button onClick={() => router.push("/register")}>注册</Button>
              </>
            )}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="mx-auto max-w-3xl space-y-4 p-4 pb-20">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg bg-muted px-4 py-2">
                    <TypingLoader showIcon={true} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Quick Actions + Input */}
        <div className="border-t bg-background">
          {messages.length <= 1 && (
            <div className="mx-auto max-w-3xl px-4 pt-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {quickActions.map((action) => (
                  <Card
                    key={action.label}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => handleSendMessage(action.prompt)}
                  >
                    <CardContent className="flex items-center gap-2 p-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-md ${action.color}`}
                      >
                        <action.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{action.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="mx-auto max-w-3xl">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder={
                user
                  ? "告诉我你想做什么... 支持上传文件 📎"
                  : "登录后即可使用 智慧学习AI Agent..."
              }
              disabled={!user}
            />
            <p className="pb-2 text-center text-xs text-muted-foreground">
              智慧学习AI Agent 驱动 · 支持上传图片/PDF/文档/表格
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble Component ──
function MessageBubble({ message }: { message: UIMessage }) {
  const isAssistant = message.role === "assistant";
  const isUser = message.role === "user";

  // Extract text content from parts
  const textParts = message.parts?.filter((p) => p.type === "text") || [];
  const textContent = textParts.map((p) => ("text" in p ? p.text : "")).join("");

  // Extract tool parts (type starts with "tool-")
  const toolParts =
    message.parts?.filter((p) => p.type.startsWith("tool-")) || [];

  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {isAssistant && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {/* Tool invocations */}
        {toolParts.length > 0 && (
          <div className="mb-2">
            {toolParts.map((part, idx) => {
              // part.type is "tool-{toolName}"
              const toolName = part.type.replace("tool-", "");
              const state = "state" in part ? part.state : "input-available";
              const input = "input" in part ? part.input : undefined;
              const output = "output" in part ? part.output : undefined;

              // Map AI SDK states to our component states
              const mappedState =
                state === "output-available" || state === "output-error"
                  ? "result"
                  : state === "input-streaming"
                    ? "partial-call"
                    : "call";

              return (
                <ToolInvocation
                  key={idx}
                  toolName={toolName}
                  args={(input as Record<string, unknown>) || {}}
                  state={mappedState}
                  result={output}
                />
              );
            })}
          </div>
        )}

        {/* Text content */}
        {textContent ? (
          <div className="text-sm leading-relaxed">
            {isAssistant ? (
              <MarkdownRenderer content={textContent} />
            ) : (
              <div className="whitespace-pre-wrap">{textContent}</div>
            )}
          </div>
        ) : toolParts.length === 0 ? (
          <div className="text-sm text-muted-foreground">...</div>
        ) : null}

        {/* Timestamp */}
        <p className="mt-1.5 text-xs opacity-60">
          {new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-secondary">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
