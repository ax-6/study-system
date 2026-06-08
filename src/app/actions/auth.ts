"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// 表单验证 Schema
const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, "姓名至少需要 2 个字符")
    .max(50, "姓名不能超过 50 个字符")
    .trim(),
  email: z
    .string()
    .email("请输入有效的邮箱地址")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, "密码至少需要 8 个字符")
    .regex(/[a-zA-Z]/, "密码必须包含至少一个字母")
    .regex(/[0-9]/, "密码必须包含至少一个数字"),
});

const LoginSchema = z.object({
  email: z
    .string()
    .email("请输入有效的邮箱地址")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, "请输入密码"),
});

export type AuthFormState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string;
} | undefined;

/**
 * 用户注册
 */
export async function signUp(state: AuthFormState, formData: FormData) {
  // 1. 验证表单字段
  const validatedFields = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;

  // 2. 调用 Supabase 注册
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { message: "该邮箱已被注册，请直接登录" };
    }
    return { message: "注册失败，请稍后重试" };
  }

  // 3. 如果注册成功但需要邮箱验证
  if (data.user && !data.session) {
    return { message: "注册成功！请检查邮箱完成验证" };
  }

  // 4. 注册成功，刷新缓存并跳转
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * 用户登录
 */
export async function signIn(state: AuthFormState, formData: FormData) {
  // 1. 验证表单字段
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  // 2. 调用 Supabase 登录
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { message: "邮箱或密码错误" };
    }
    return { message: "登录失败，请稍后重试" };
  }

  // 3. 登录成功，刷新缓存并跳转
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * 用户登出
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
