"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isAssistant ? "bg-muted/50" : "bg-background"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {isAssistant ? (
          <>
            <AvatarImage src="/bot-avatar.png" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="/user-avatar.png" />
            <AvatarFallback className="bg-secondary">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">
          {isAssistant ? "智慧学习AI Agent" : "你"}
        </p>
        <div className="text-sm leading-relaxed">
          {isAssistant ? (
            <MarkdownRenderer content={message.content} />
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>
      </div>
    </div>
  );
}
