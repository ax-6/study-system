"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { getChatHistory } from "@/app/actions/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Send,
  Bot,
  User,
  Loader2,
  BookOpen,
  FileText,
  Calendar,
  BarChart3,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: string; // Agent tool execution status
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

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "你好！我是 **智学助手**，你的 AI 学习管理 Agent。🎓\n\n我具备以下能力：\n\n• 📚 **课程管理** — 查询、添加、修改课程安排\n• 📝 **作业管理** — 跟踪作业进度、提醒截止日期\n• 📅 **日程管理** — 管理待办事项、规划学习时间\n• 📊 **成绩分析** — 记录成绩、分析学习趋势\n• 💡 **学习建议** — 基于数据提供个性化建议\n\n你可以直接告诉我你想做什么，或者点击下方的快捷操作开始！",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when user is authenticated
  useEffect(() => {
    if (!user || loading) return;
    let cancelled = false;
    getChatHistory(100).then((history) => {
      if (cancelled || !history || history.length === 0) return;
      const loadedMessages: Message[] = history.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }));
      setMessages(loadedMessages);
    });
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        status: "正在思考...",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "status" && parsed.message) {
                // Update the status indicator on the assistant message
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, status: parsed.message }
                      : msg
                  )
                );
              } else if (parsed.type === "text-delta" && parsed.delta) {
                assistantContent += parsed.delta;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: assistantContent, status: undefined }
                      : msg
                  )
                );
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "抱歉，发生了错误。请稍后再试。",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">智学助手</h1>
            <p className="text-xs text-muted-foreground">AI Agent 智能学习管理</p>
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
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {/* Status indicator during tool execution */}
                  {message.status && !message.content && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{message.status}</span>
                    </div>
                  )}
                  {/* Message content */}
                  {message.content ? (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
                        if (part.startsWith("**") && part.endsWith("**")) {
                          return (
                            <strong key={i}>{part.slice(2, -2)}</strong>
                          );
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </div>
                  ) : !message.status ? (
                    <div className="text-sm text-muted-foreground">...</div>
                  ) : null}
                  <p className="mt-1.5 text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-secondary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg bg-muted px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Quick Actions + Input */}
      <div className="border-t bg-background">
        {/* Quick Actions - only show when conversation is short */}
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

        {/* Input Bar */}
        <div className="mx-auto max-w-3xl p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                user
                  ? "告诉我你想做什么... 例如：帮我添加一门高等数学课"
                  : "登录后即可使用 AI 助手..."
              }
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            智学助手由 AI Agent 驱动，具备感知、规划与执行能力
          </p>
        </div>
      </div>
    </div>
  );
}
