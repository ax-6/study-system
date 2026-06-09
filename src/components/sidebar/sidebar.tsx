"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  children?: React.ReactNode;
}

const mainTabs = [
  { id: "agent", label: "智慧学习AI Agent", icon: Sparkles, isHome: true },
];

const tabs = [
  { id: "courses", label: "课程表", icon: BookOpen },
  { id: "assignments", label: "作业", icon: FileText },
  { id: "todos", label: "日程", icon: Calendar },
  { id: "grades", label: "成绩", icon: BarChart3 },
  { id: "settings", label: "设置", icon: Settings },
];

export function Sidebar({ activeTab = "courses", onTabChange, children }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleTabClick = (tabId: string, isHome?: boolean) => {
    if (isHome) {
      router.push("/");
    } else {
      onTabChange?.(tabId);
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-muted/30 transition-all duration-300",
        collapsed ? "w-16" : "w-72"
      )}
    >
      <div className="flex items-center justify-between border-b p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">智慧学习AI Agent</h2>
          </div>
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
        {/* AI Agent - Primary Feature */}
        {mainTabs.map((tab) => (
          <Button
            key={tab.id}
            variant="default"
            className={cn(
              "w-full justify-start gap-3",
              collapsed && "justify-center px-0"
            )}
            onClick={() => handleTabClick(tab.id, tab.isHome)}
          >
            <tab.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{tab.label}</span>}
          </Button>
        ))}

        <div className="my-2 border-t" />

        {/* Other tabs */}
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              collapsed && "justify-center px-0"
            )}
            onClick={() => handleTabClick(tab.id)}
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

      {/* User info and logout */}
      <div className="border-t p-4">
        {user && !collapsed && (
          <div className="mb-2 truncate text-xs text-muted-foreground">
            {user.email}
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700",
            collapsed && "justify-center px-0"
          )}
          onClick={signOut}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>退出登录</span>}
        </Button>
      </div>
    </aside>
  );
}
