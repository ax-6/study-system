"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Loader2,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AttachedFile {
  file: File;
  preview?: string; // for images
  icon: "image" | "pdf" | "doc" | "sheet" | "ppt" | "text" | "file";
}

function getFileIcon(file: File): AttachedFile["icon"] {
  const type = file.type;
  if (type.startsWith("image/")) return "image";
  if (type === "application/pdf") return "pdf";
  if (type.includes("word") || type.includes("document")) return "doc";
  if (type.includes("sheet") || type.includes("excel")) return "sheet";
  if (type.includes("presentation") || type.includes("powerpoint")) return "ppt";
  if (type.startsWith("text/")) return "text";
  return "file";
}

function getFileIconComponent(icon: AttachedFile["icon"], className?: string) {
  switch (icon) {
    case "image":
      return <ImageIcon className={className} />;
    case "pdf":
    case "doc":
    case "text":
      return <FileText className={className} />;
    default:
      return <File className={className} />;
  }
}

const ACCEPT_TYPES =
  "image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
  placeholder = "输入消息...",
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const newAttachments: AttachedFile[] = files.map((file) => {
        const att: AttachedFile = { file, icon: getFileIcon(file) };
        // Generate preview for images
        if (att.icon === "image") {
          att.preview = URL.createObjectURL(file);
        }
        return att;
      });
      setAttachedFiles((prev) => [...prev, ...newAttachments]);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    []
  );

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = message.trim();
      if ((!trimmed && attachedFiles.length === 0) || isLoading || disabled)
        return;

      const files = attachedFiles.map((a) => a.file);
      onSendMessage(trimmed || "请分析这些文件", files);
      setMessage("");
      // Clean up previews
      attachedFiles.forEach((a) => {
        if (a.preview) URL.revokeObjectURL(a.preview);
      });
      setAttachedFiles([]);
      inputRef.current?.focus();
    },
    [message, attachedFiles, isLoading, disabled, onSendMessage]
  );

  return (
    <div className="border-t bg-background">
      {/* File previews */}
      {attachedFiles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1">
          {attachedFiles.map((att, idx) => (
            <div
              key={idx}
              className="relative flex shrink-0 items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 pr-8"
            >
              {att.preview ? (
                <img
                  src={att.preview}
                  alt={att.file.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  {getFileIconComponent(att.icon, "h-5 w-5 text-muted-foreground")}
                </div>
              )}
              <div className="max-w-[120px]">
                <p className="truncate text-xs font-medium">{att.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(att.file.size / 1024).toFixed(0)}KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute right-1 top-1 rounded-full p-0.5 hover:bg-destructive/20"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_TYPES}
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isLoading}
          title="上传文件"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            attachedFiles.length > 0
              ? "添加说明（可选）..."
              : placeholder
          }
          disabled={disabled || isLoading}
          className="flex-1"
          autoFocus
        />
        <Button
          type="submit"
          size="icon"
          disabled={
            (!message.trim() && attachedFiles.length === 0) || isLoading || disabled
          }
          className={cn("shrink-0", isLoading && "animate-pulse")}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
