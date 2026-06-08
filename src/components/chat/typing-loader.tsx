"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const LOADING_MESSAGES = [
  "AI正在使用超级大脑...",
  "AI正在分析你的需求...",
  "还在努力中...",
  "加速思考中...",
  "马上就好...",
  "正在整理答案...",
  "深度思考中...",
  "正在生成回复...",
];

interface TypingLoaderProps {
  className?: string;
  showIcon?: boolean;
}

export function TypingLoader({ className = "", showIcon = true }: TypingLoaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const currentMessage = LOADING_MESSAGES[currentIndex];
    let charIndex = 0;
    let typingTimer: NodeJS.Timeout;

    // Typewriter effect
    const typeNextChar = () => {
      if (charIndex < currentMessage.length) {
        setDisplayText(currentMessage.slice(0, charIndex + 1));
        charIndex++;
        typingTimer = setTimeout(typeNextChar, 50); // 50ms per character
      } else {
        setIsTyping(false);
        // Wait 5 seconds before switching to next message
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
          setIsTyping(true);
        }, 5000);
      }
    };

    typeNextChar();

    return () => {
      if (typingTimer) clearTimeout(typingTimer);
    };
  }, [currentIndex]);

  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      {showIcon && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      <span>{displayText}</span>
      {isTyping && <span className="animate-pulse">|</span>}
    </div>
  );
}
