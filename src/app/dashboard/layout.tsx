"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("courses");

  useEffect(() => {
    // Determine active tab based on pathname
    if (pathname.includes("/dashboard/courses")) {
      setActiveTab("courses");
    } else if (pathname.includes("/dashboard/assignments")) {
      setActiveTab("assignments");
    } else if (pathname.includes("/dashboard/todos")) {
      setActiveTab("todos");
    } else if (pathname.includes("/dashboard/grades")) {
      setActiveTab("grades");
    } else if (pathname.includes("/dashboard/chat")) {
      setActiveTab("chat");
    } else if (pathname.includes("/dashboard/settings")) {
      setActiveTab("settings");
    } else {
      setActiveTab("courses");
    }
  }, [pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/${tab}`);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">{children}</div>
        </ScrollArea>
      </main>
    </div>
  );
}
