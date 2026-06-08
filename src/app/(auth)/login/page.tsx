"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthFormState } from "@/app/actions/auth";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signIn,
    undefined
  );

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">欢迎回来</h1>
        <p className="mt-1 text-sm text-gray-500">登录你的账号继续学习</p>
      </div>

      <form action={action} className="space-y-5">
        {/* 全局错误提示 */}
        {state?.message && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {state.message}
          </div>
        )}

        {/* 邮箱 */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            邮箱
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="your@email.com"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:text-sm"
          />
          {state?.errors?.email && (
            <p className="mt-1 text-sm text-red-500">{state.errors.email[0]}</p>
          )}
        </div>

        {/* 密码 */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            密码
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:text-sm"
          />
          {state?.errors?.password && (
            <p className="mt-1 text-sm text-red-500">
              {state.errors.password[0]}
            </p>
          )}
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              登录中...
            </>
          ) : (
            "登录"
          )}
        </button>
      </form>

      {/* 注册链接 */}
      <p className="mt-6 text-center text-sm text-gray-500">
        还没有账号？{" "}
        <Link
          href="/register"
          className="font-semibold text-blue-600 hover:text-blue-500"
        >
          立即注册
        </Link>
      </p>
    </>
  );
}
