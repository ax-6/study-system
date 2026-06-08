"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  children?: React.ReactNode;
}

const tabs = [
  { id: "courses", label: "课程表", icon: BookOpen },
  { id: "assignments", label: "作业", icon: FileText },
  { id: "todos", label: "日程", icon: Calendar },
  { id: "grades", label: "成绩", icon: BarChart3 },
  { id: "chat", label: "AI 助手", icon: Bot },
  { id: "settings", label: "设置", icon: Settings },
];

export function Sidebar({ activeTab = "courses", onTabChange, children }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-muted/30 transition-all duration-300",
        collapsed ? "w-16" : "w-72"
      )}
    >
      <div className="flex items-center justify-between border-b p-4">
        {!collapsed && (
          <h2 className="text-lg font-semibold">学习助手</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              collapsed && "justify-center px-0"
            )}
            onClick={() => onTabChange?.(tab.id)}
          >
            <tab.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{tab.label}</span>}
          </Button>
        ))}
      </nav>

      {!collapsed && children && (
        <ScrollArea className="flex-1 border-t">
          <div className="p-4">{children}</div>
        </ScrollArea>
      )}
    </aside>
  );
}
