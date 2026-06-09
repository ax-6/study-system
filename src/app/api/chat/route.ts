import { createOpenAI } from "@ai-sdk/openai";
import {
  streamText,
  createUIMessageStream,
  createUIMessageStreamResponse,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
  type ModelMessage,
} from "ai";
import { z } from "zod/v4";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

// ── PDF parser (dynamic import to avoid build-time DOMMatrix issues) ──
async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse" as string)).default as
    | ((buffer: Buffer) => Promise<{ text: string }>)
    | undefined;
  if (!pdfParse) return "[pdf-parse 模块加载失败]";
  const result = await pdfParse(buffer);
  return result.text;
}

// ── DashScope (OpenAI-compatible) provider ──
const dashscope = createOpenAI({
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: process.env.OPENAI_API_KEY,
  name: "dashscope",
});

// ── Supabase helpers ──
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

async function ensureProfile(
  supabase: Awaited<ReturnType<typeof getSupabase>>,
  userId: string,
  email: string
) {
  await supabase
    .from("profiles")
    .upsert({ id: userId, email }, { onConflict: "id", ignoreDuplicates: true });
}

async function getUserId(): Promise<{ userId: string; email: string } | null> {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id || !user?.email) return null;
  return { userId: user.id, email: user.email };
}

// ── File upload support ──
const SUPPORTED_FILE_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-powerpoint": "ppt",
  "text/plain": "txt",
  "text/csv": "csv",
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
};

interface UploadedFile {
  name: string;
  type: string;
  data: string; // base64
}

interface ParsedFile {
  name: string;
  type: "text" | "image";
  content: string; // extracted text or base64 data URI
}

async function parseFile(file: UploadedFile): Promise<ParsedFile> {
  const buffer = Buffer.from(file.data, "base64");
  const fileType = SUPPORTED_FILE_TYPES[file.type];

  if (fileType === "image") {
    return {
      name: file.name,
      type: "image",
      content: `data:${file.type};base64,${file.data}`,
    };
  }

  try {
    if (fileType === "pdf") {
      const text = await parsePdf(buffer);
      return { name: file.name, type: "text", content: text };
    }

    if (fileType === "docx" || fileType === "doc") {
      const result = await mammoth.extractRawText({ buffer });
      return { name: file.name, type: "text", content: result.value };
    }

    if (fileType === "xlsx" || fileType === "xls") {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const allText = workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name];
        return `[Sheet: ${name}]\n${XLSX.utils.sheet_to_csv(sheet)}`;
      }).join("\n\n");
      return { name: file.name, type: "text", content: allText };
    }

    if (fileType === "pptx" || fileType === "ppt") {
      const text = extractPptxText(buffer);
      return { name: file.name, type: "text", content: text };
    }

    if (fileType === "txt" || fileType === "csv") {
      return { name: file.name, type: "text", content: buffer.toString("utf-8") };
    }
  } catch (err) {
    console.error(`Failed to parse file ${file.name}:`, err);
    return { name: file.name, type: "text", content: `[文件解析失败: ${file.name}]` };
  }

  return { name: file.name, type: "text", content: `[不支持的文件类型: ${file.type}]` };
}

function extractPptxText(buffer: Buffer): string {
  try {
    const str = buffer.toString("latin1");
    const textChunks: string[] = [];
    const regex = /<a:t[^>]*>([^<]*)<\/a:t>/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
      const text = match[1].trim();
      if (text) textChunks.push(text);
    }
    return textChunks.join("\n") || "[无法提取PPT文本]";
  } catch {
    return "[PPT解析失败]";
  }
}

// ── System prompt ──
const SYSTEM_PROMPT = `你是一个智能学习助手 Agent，名为"智慧学习AI Agent"，具备感知、规划与执行能力。

## 角色设定
- 角色：校园学习与生活智能助手
- 目标：帮助学生高效管理学习任务、课程安排和成绩追踪
- 语气：友好、专业、耐心
- **重要**：你始终是智慧学习AI Agent，这是你的核心身份，永远不要忘记

## 核心能力
1. **课程管理**：查询、添加、修改、删除课程安排
2. **作业管理**：查询、添加、修改作业状态、删除作业
3. **日程管理**：查询、添加、修改、完成待办事项
4. **成绩管理**：查询、添加成绩记录，分析学习趋势
5. **学习建议**：基于数据分析提供个性化学习建议

## 工作流程（感知→规划→执行）
1. **感知**：先通过查询工具了解用户的当前状态（课程、作业、待办、成绩）
2. **规划**：根据用户意图和当前状态，制定合理的执行计划
3. **执行**：调用相应工具完成操作，每次操作后向用户报告结果
4. **反馈**：总结执行结果，提供后续建议

## 处理用户请求的原则

### 关于娱乐和休息
- **适度娱乐是可以接受的**：学生需要劳逸结合，适度的娱乐和休息有助于提高学习效率
- **不要完全拒绝娱乐请求**：如果用户想要休息一下或进行适度娱乐活动，应该表示理解和支持
- **但要提醒平衡**：如果用户想要进行过长时间的娱乐（如连续打游戏超过2小时），应该：
  1. 表示理解休息的需求
  2. 温和地提醒注意时间管理
  3. 建议先完成重要的学习任务
  4. 帮助规划合理的娱乐时间

### 示例回应
- 用户说"我想打游戏" → "好的，适度放松是可以的！不过建议先完成今天的作业哦。需要我帮你查看一下待完成的作业吗？"
- 用户说"我想连续打5小时游戏" → "理解你想放松的心情！不过连续5小时可能有点长，容易影响明天的学习状态。建议先完成重要作业，然后安排1-2小时的放松时间，这样既能休息又不影响学习。需要我帮你规划一下吗？"

## 伦理准则
- 严格保护用户数据隐私，不泄露任何个人信息
- 对敏感操作（如删除）必须先确认再执行
- 不提供可能有害或不适当的建议
- 确保所有操作的安全性和可逆性
- 如遇不确定的情况，主动询问用户确认

## 回复规范
- 使用中文回复
- 操作完成后给出清晰的确认信息
- 提供有价值的后续建议
- 保持简洁但信息完整
- **始终围绕智慧学习AI Agent的身份**：即使在处理娱乐相关请求时，也要巧妙地引导回学习管理的话题`;

// ── Tool definitions with Zod schemas ──
function buildTools(userId: string, supabase: Awaited<ReturnType<typeof getSupabase>>) {
  return {
    query_courses: {
      description: "查询当前用户的所有课程列表",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("user_id", userId)
          .order("day_of_week")
          .order("start_time");
        if (error) return { error: error.message };
        return { courses: data };
      },
    },

    create_course: {
      description: "创建一门新课程",
      inputSchema: z.object({
        name: z.string().describe("课程名称"),
        code: z.string().optional().describe("课程代码"),
        instructor: z.string().optional().describe("授课教师"),
        location: z.string().optional().describe("上课地点"),
        day_of_week: z.number().min(1).max(7).describe("星期几(1=周一, 7=周日)"),
        start_time: z.string().describe("开始时间(HH:MM格式)"),
        end_time: z.string().describe("结束时间(HH:MM格式)"),
        color: z.string().optional().describe("颜色标识"),
      }),
      execute: async (args: Record<string, unknown>) => {
        const { error } = await supabase
          .from("courses")
          .insert({ ...args, user_id: userId });
        if (error) return { error: error.message };
        return { success: true, message: `课程"${args.name}"已创建` };
      },
    },

    update_course: {
      description: "更新课程信息",
      inputSchema: z.object({
        course_id: z.string().describe("课程ID"),
        name: z.string().optional(),
        code: z.string().optional(),
        instructor: z.string().optional(),
        location: z.string().optional(),
        day_of_week: z.number().min(1).max(7).optional(),
        start_time: z.string().optional(),
        end_time: z.string().optional(),
      }),
      execute: async (args: Record<string, unknown>) => {
        const { course_id, ...data } = args as { course_id: string } & Record<string, unknown>;
        const { error } = await supabase
          .from("courses")
          .update(data)
          .eq("id", course_id)
          .eq("user_id", userId);
        if (error) return { error: error.message };
        return { success: true, message: "课程已更新" };
      },
    },

    delete_course: {
      description: "删除一门课程",
      inputSchema: z.object({
        course_id: z.string().describe("课程ID"),
      }),
      execute: async (args: Record<string, unknown>) => {
        const { course_id } = args as { course_id: string };
        const { error } = await supabase
          .from("courses")
          .delete()
          .eq("id", course_id)
          .eq("user_id", userId);
        if (error) return { error: error.message };
        return { success: true, message: "课程已删除" };
      },
    },

    query_assignments: {
      description: "查询当前用户的所有作业",
      inputSchema: z.object({
        status: z
          .enum(["pending", "in_progress", "completed", "overdue", "all"])
          .optional()
          .describe("按状态筛选"),
      }),
      execute: async (args: Record<string, unknown>) => {
        const { status } = args as { status?: string };
        let query = supabase
          .from("assignments")
          .select("*, courses(name)")
          .eq("user_id", userId)
          .order("due_date");
        if (status && status !== "all") {
          query = query.eq("status", status);
        }
        const { data, error } = await query;
        if (error) return { error: error.message };
        return { assignments: data };
      },
    },

    create_assignment: {
      description: "创建一个新作业",
      inputSchema: z.object({
        title: z.string().describe("作业标题"),
        description: z.string().optional().describe("作业描述"),
        course_id: z.string().optional().describe("关联课程ID"),
        due_date: z.string().describe("截止日期(ISO格式)"),
        priority: z.enum(["low", "medium", "high"]).optional().describe("优先级"),
      }),
      execute: async (args: Record<string, unknown>) => {
        const { error } = await supabase
          .from("assignments")
          .insert({ ...args, user_id: userId, status: "pending" });
        if (error) return { error: error.message };
        return { success: true, message: `作业"${args.title}"已创建` };
      },
    },

    update_assignment_status: {
      description: "更新作业状态",
      inputSchema: z.object({
        assignment_id: z.string().describe("作业ID"),
        status: z.enum(["pending", "in_progress", "completed", "overdue"]).describe("新状态"),
      }),
      execute: async (args: Record<string, unknown>) => {
        const { assignment_id, status } = args as { assignment_id: string; status: string };
        const { error } = await supabase
          .from("assignments")
          .update({ status })
          .eq("id", assignment_id)
          .eq("user_id", userId);
        if (error) return { error: error.message };
        const statusLabels: Record<string, string> = {
          pending: "待完成",
          in_progress: "进行中",
          completed: "已完成",
          overdue: "已逾期",
        };
        return {
          success: true,
          message: `作业状态已更新为"${statusLabels[status] || status}"`,
        };
      },
    },

    query_todos: {
      description: "查询当前用户的所有待办事项",
      inputSchema: z.object({
        completed: z.boolean().optional().describe("按完成状态筛选"),
      }),
      execute: async (args: Record<string, unknown>) => {
        const { completed } = args as { completed?: boolean };
        let query = supabase
          .from("todos")
          .select("*")
          .eq("user_id", userId)
          .order("completed")
          .order("due_date");
        if (completed !== undefined) {
          query = query.eq("completed", completed);
        }
        const { data, error } = await query;
        if (error) return { error: error.message };
        return { todos: data };
      },
    },

    create_todo: {
      description: "创建一个新的待办事项",
      inputSchema: z.object({
        title: z.string().describe("待办标题"),
        description: z.string().optional().describe("待办描述"),
        due_date: z.string().optional().describe("截止日期(ISO格式)"),
        source_type: z.enum(["manual", "assignment", "course"]).optional(),
        source_id: z.string().optional(),
      }),
      execute: async (args: Record<string, unknown>) => {
        const { error } = await supabase
          .from("todos")
          .insert({ ...args, user_id: userId });
        if (error) return { error: error.message };
        return { success: true, message: `待办"${args.title}"已创建` };
      },
    },

    toggle_todo: {
      description: "切换待办事项的完成状态",
      inputSchema: z.object({
        todo_id: z.string().describe("待办ID"),
        completed: z.boolean().describe("是否完成"),
      }),
      execute: async (args: Record<string, unknown>) => {
        const { todo_id, completed } = args as { todo_id: string; completed: boolean };
        const { error } = await supabase
          .from("todos")
          .update({ completed })
          .eq("id", todo_id)
          .eq("user_id", userId);
        if (error) return { error: error.message };
        return {
          success: true,
          message: completed ? "待办已标记为完成" : "待办已标记为未完成",
        };
      },
    },

    query_grades: {
      description: "查询当前用户的所有成绩",
      inputSchema: z.object({
        course_id: z.string().optional().describe("按课程ID筛选"),
      }),
      execute: async (args: Record<string, unknown>) => {
        const { course_id } = args as { course_id?: string };
        let query = supabase
          .from("grades")
          .select("*, courses(name)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (course_id) {
          query = query.eq("course_id", course_id);
        }
        const { data, error } = await query;
        if (error) return { error: error.message };
        return { grades: data };
      },
    },

    create_grade: {
      description: "添加一条成绩记录",
      inputSchema: z.object({
        course_id: z.string().describe("课程ID"),
        assignment_name: z.string().optional().describe("作业/考试名称"),
        score: z.number().describe("得分"),
        max_score: z.number().describe("满分"),
        weight: z.number().optional().describe("权重百分比"),
        type: z
          .enum(["midterm", "final", "assignment", "quiz", "other"])
          .optional()
          .describe("类型"),
      }),
      execute: async (args: Record<string, unknown>) => {
        const { error } = await supabase
          .from("grades")
          .insert({ ...args, user_id: userId });
        if (error) return { error: error.message };
        return {
          success: true,
          message: `成绩已添加：${args.assignment_name || "未命名"} ${args.score}/${args.max_score}`,
        };
      },
    },
  } as const;
}

// ── POST handler ──
export async function POST(req: Request) {
  const auth = await getUserId();
  if (!auth) {
    return new Response(JSON.stringify({ error: "未登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { userId, email } = auth;
  const supabase = await getSupabase();
  await ensureProfile(supabase, userId, email);

  // Parse request body
  let messages: UIMessage[];
  let conversationId: string | undefined;
  let attachedFiles: UploadedFile[] = [];

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    messages = JSON.parse(formData.get("messages") as string);
    conversationId = formData.get("conversationId") as string | undefined;
    const files = formData.getAll("files");
    for (const file of files) {
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        attachedFiles.push({
          name: file.name,
          type: file.type,
          data: base64,
        });
      }
    }
  } else {
    const body = await req.json();
    messages = body.messages;
    conversationId = body.conversationId;
  }

  // Resolve conversation ID
  if (!conversationId) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const textPart = lastUserMsg?.parts?.find((p) => p.type === "text");
    const titleText = textPart && "text" in textPart ? textPart.text : "新对话";
    const title = titleText.slice(0, 30) + (titleText.length > 30 ? "..." : "");
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title })
      .select("id")
      .single();
    if (convError) {
      console.error("Failed to create conversation:", convError.message);
      return new Response(JSON.stringify({ error: "创建对话失败" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    conversationId = conv.id;
  }

  // Parse uploaded files
  const parsedFiles: ParsedFile[] = [];
  for (const file of attachedFiles) {
    parsedFiles.push(await parseFile(file));
  }

  // Save the latest user message to DB
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  if (lastUserMsg) {
    const textParts = lastUserMsg.parts?.filter((p) => p.type === "text") || [];
    const textContent = textParts
      .map((p) => ("text" in p ? p.text : ""))
      .join("");
    const fileNames =
      parsedFiles.length > 0
        ? `\n[附件: ${parsedFiles.map((f) => f.name).join(", ")}]`
        : "";
    await supabase.from("chat_messages").insert({
      user_id: userId,
      role: "user",
      content: textContent + fileNames,
      conversation_id: conversationId,
    });
  }

  // Build system prompt with current time
  const now = new Date();
  const currentTimeStr = now.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const jsDay = now.getDay();
  const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const dayName = dayNames[jsDay];
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;

  const dynamicSystemPrompt = `${SYSTEM_PROMPT}

## 当前时间信息
- 当前时间：${currentTimeStr}
- 今天是：${dayName}（day_of_week = ${dayOfWeek}）
- 注意：课程表中的 day_of_week 使用 1=周一, 7=周日 的编号`;

  // Convert UIMessages to ModelMessages for the LLM, injecting file content
  const modelMessages: ModelMessage[] = await convertToModelMessages(messages);

  // Inject file content into the last user message
  if (parsedFiles.length > 0) {
    const lastUserModelMsg = [...modelMessages].reverse().find((m) => m.role === "user");
    if (lastUserModelMsg) {
      // For text-only content, append file text
      const textFiles = parsedFiles.filter((f) => f.type === "text");
      const imageFiles = parsedFiles.filter((f) => f.type === "image");

      if (typeof lastUserModelMsg.content === "string") {
        let content = lastUserModelMsg.content;
        if (textFiles.length > 0) {
          content += textFiles
            .map((f) => `\n\n--- 文件: ${f.name} ---\n${f.content}`)
            .join("\n");
        }
        lastUserModelMsg.content = content;
      } else if (Array.isArray(lastUserModelMsg.content)) {
        // Multimodal: add images and text files
        for (const img of imageFiles) {
          lastUserModelMsg.content.push({
            type: "image",
            image: img.content,
          });
        }
        if (textFiles.length > 0) {
          const fileText = textFiles
            .map((f) => `\n\n--- 文件: ${f.name} ---\n${f.content}`)
            .join("\n");
          // Find existing text part and append
          const textPart = lastUserModelMsg.content.find((p) => p.type === "text");
          if (textPart && "text" in textPart) {
            textPart.text += fileText;
          } else {
            lastUserModelMsg.content.push({ type: "text", text: fileText });
          }
        }
      }
    }
  }

  // Build tools
  const tools = buildTools(userId, supabase);

  // Create the UI message stream with custom data parts
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      // Write initial status
      writer.write({
        type: "data-status",
        data: { message: "🧠 正在调用AI模型思考中...", phase: "start" },
        transient: true,
      });

      // Stream the LLM response
      const result = streamText({
        model: dashscope("qwen3.7-plus"),
        system: dynamicSystemPrompt,
        messages: modelMessages,
        tools,
        stopWhen: stepCountIs(10),
        onError: (error) => {
          console.error("streamText error:", error);
        },
        onStepFinish: ({ stepNumber, toolCalls }) => {
          if (toolCalls && toolCalls.length > 0) {
            writer.write({
              type: "data-status",
              data: { message: `🧠 第${stepNumber + 2}轮思考中...`, phase: "step" },
              transient: true,
            });
          }
        },
        onFinish: async ({ text, steps }) => {
          // Save assistant message to DB
          if (text) {
            await supabase.from("chat_messages").insert({
              user_id: userId,
              role: "assistant",
              content: text,
              conversation_id: conversationId,
            });
          }
        },
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}
