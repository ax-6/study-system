import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
      {/* Logo */}
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-2xl font-bold text-gray-900"
      >
        <BookOpen className="h-8 w-8 text-blue-600" />
        <span>智慧学习AI Agent</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-6 text-sm text-gray-500">
        基于 AI Agent 的智能学习助手系统
      </p>
    </div>
  );
}
