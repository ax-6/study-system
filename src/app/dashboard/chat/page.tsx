"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    // AI Agent is now the homepage, redirect there
    router.replace("/");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
