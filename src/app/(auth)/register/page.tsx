"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthFormState } from "@/app/actions/auth";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signUp,
    undefined
  );

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">创建账号</h1>
        <p className="mt-1 text-sm text-gray-500">
          注册后开始你的智能学习之旅
        </p>
      </div>

      <form action={action} className="space-y-5">
        {/* 全局错误提示 */}
        {state?.message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              state.message.includes("成功")
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {state.message}
          </div>
        )}

        {/* 姓名 */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            姓名
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="你的姓名"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:text-sm"
          />
          {state?.errors?.name && (
            <p className="mt-1 text-sm text-red-500">{state.errors.name[0]}</p>
          )}
        </div>

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
            autoComplete="new-password"
            required
            placeholder="至少 8 位，含字母和数字"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:text-sm"
          />
          {state?.errors?.password && (
            <div className="mt-1 space-y-1">
              {state.errors.password.map((error) => (
                <p key={error} className="text-sm text-red-500">
                  • {error}
                </p>
              ))}
            </div>
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
              注册中...
            </>
          ) : (
            "注册"
          )}
        </button>
      </form>

      {/* 登录链接 */}
      <p className="mt-6 text-center text-sm text-gray-500">
        已有账号？{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-500"
        >
          立即登录
        </Link>
      </p>
    </>
  );
}
