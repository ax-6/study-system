import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

async function parsePdf(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid build-time DOMMatrix issues
  const pdfParse = (await import("pdf-parse" as string)).default as
    | ((buffer: Buffer) => Promise<{ text: string }>)
    | undefined;
  if (!pdfParse) return "[pdf-parse 模块加载失败]";
  const result = await pdfParse(buffer);
  return result.text;
}

const openai = new OpenAI({
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

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

// Supported file types
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
      // PPT parsing: extract text from XML inside the pptx zip
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

// Simple PPTX text extraction (pptx is a zip with XML files)
function extractPptxText(buffer: Buffer): string {
  try {
    // Use Node.js zlib to extract text from the XML
    const { unzipSync } = require("zlib");
    // PPTX files are zip archives - look for slide XML files
    // This is a simplified approach: scan for readable text patterns
    const str = buffer.toString("latin1");
    const textChunks: string[] = [];

    // Extract text between <a:t> tags (PowerPoint text nodes)
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

const SYSTEM_PROMPT = `你是一个智能学习助手 Agent，名为"智学助手"，具备感知、规划与执行能力。

## 角色设定
- 角色：校园学习与生活智能助手
- 目标：帮助学生高效管理学习任务、课程安排和成绩追踪
- 语气：友好、专业、耐心

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
- 保持简洁但信息完整`;

// Tool definitions in OpenAI function-calling format
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "query_courses",
      description: "查询当前用户的所有课程列表",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "create_course",
      description: "创建一门新课程",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "课程名称" },
          code: { type: "string", description: "课程代码" },
          instructor: { type: "string", description: "授课教师" },
          location: { type: "string", description: "上课地点" },
          day_of_week: { type: "number", description: "星期几(1=周一, 7=周日)", minimum: 1, maximum: 7 },
          start_time: { type: "string", description: "开始时间(HH:MM格式)" },
          end_time: { type: "string", description: "结束时间(HH:MM格式)" },
          color: { type: "string", description: "颜色标识" },
        },
        required: ["name", "day_of_week", "start_time", "end_time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_course",
      description: "更新课程信息",
      parameters: {
        type: "object",
        properties: {
          course_id: { type: "string", description: "课程ID" },
          name: { type: "string" },
          code: { type: "string" },
          instructor: { type: "string" },
          location: { type: "string" },
          day_of_week: { type: "number", minimum: 1, maximum: 7 },
          start_time: { type: "string" },
          end_time: { type: "string" },
        },
        required: ["course_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_course",
      description: "删除一门课程",
      parameters: {
        type: "object",
        properties: {
          course_id: { type: "string", description: "课程ID" },
        },
        required: ["course_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_assignments",
      description: "查询当前用户的所有作业",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["pending", "in_progress", "completed", "overdue", "all"],
            description: "按状态筛选",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_assignment",
      description: "创建一个新作业",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "作业标题" },
          description: { type: "string", description: "作业描述" },
          course_id: { type: "string", description: "关联课程ID" },
          due_date: { type: "string", description: "截止日期(ISO格式)" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "优先级" },
        },
        required: ["title", "due_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_assignment_status",
      description: "更新作业状态",
      parameters: {
        type: "object",
        properties: {
          assignment_id: { type: "string", description: "作业ID" },
          status: {
            type: "string",
            enum: ["pending", "in_progress", "completed", "overdue"],
            description: "新状态",
          },
        },
        required: ["assignment_id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_todos",
      description: "查询当前用户的所有待办事项",
      parameters: {
        type: "object",
        properties: {
          completed: { type: "boolean", description: "按完成状态筛选" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_todo",
      description: "创建一个新的待办事项",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "待办标题" },
          description: { type: "string", description: "待办描述" },
          due_date: { type: "string", description: "截止日期(ISO格式)" },
          source_type: { type: "string", enum: ["manual", "assignment", "course"] },
          source_id: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "toggle_todo",
      description: "切换待办事项的完成状态",
      parameters: {
        type: "object",
        properties: {
          todo_id: { type: "string", description: "待办ID" },
          completed: { type: "boolean", description: "是否完成" },
        },
        required: ["todo_id", "completed"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_grades",
      description: "查询当前用户的所有成绩",
      parameters: {
        type: "object",
        properties: {
          course_id: { type: "string", description: "按课程ID筛选" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_grade",
      description: "添加一条成绩记录",
      parameters: {
        type: "object",
        properties: {
          course_id: { type: "string", description: "课程ID" },
          assignment_name: { type: "string", description: "作业/考试名称" },
          score: { type: "number", description: "得分" },
          max_score: { type: "number", description: "满分" },
          weight: { type: "number", description: "权重百分比" },
          type: {
            type: "string",
            enum: ["midterm", "final", "assignment", "quiz", "other"],
            description: "类型",
          },
        },
        required: ["course_id", "score", "max_score"],
      },
    },
  },
];

// Tool name → Chinese status label
const TOOL_STATUS_LABELS: Record<string, string> = {
  query_courses: "正在查询课程信息...",
  create_course: "正在创建课程...",
  update_course: "正在更新课程...",
  delete_course: "正在删除课程...",
  query_assignments: "正在查询作业列表...",
  create_assignment: "正在创建作业...",
  update_assignment_status: "正在更新作业状态...",
  query_todos: "正在查询待办事项...",
  create_todo: "正在创建待办事项...",
  toggle_todo: "正在更新待办状态...",
  query_grades: "正在查询成绩信息...",
  create_grade: "正在添加成绩...",
};

// Execute a tool call and return the result
async function executeTool(
  name: string,
  args: Record<string, unknown>,
  userId: string
): Promise<string> {
  const supabase = await getSupabase();

  switch (name) {
    case "query_courses": {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", userId)
        .order("day_of_week")
        .order("start_time");
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ courses: data });
    }

    case "create_course": {
      const { error } = await supabase
        .from("courses")
        .insert({ ...args, user_id: userId });
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, message: `课程"${args.name}"已创建` });
    }

    case "update_course": {
      const { course_id, ...data } = args as { course_id: string } & Record<string, unknown>;
      const { error } = await supabase
        .from("courses")
        .update(data)
        .eq("id", course_id)
        .eq("user_id", userId);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, message: "课程已更新" });
    }

    case "delete_course": {
      const { course_id } = args as { course_id: string };
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", course_id)
        .eq("user_id", userId);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, message: "课程已删除" });
    }

    case "query_assignments": {
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
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ assignments: data });
    }

    case "create_assignment": {
      const { error } = await supabase
        .from("assignments")
        .insert({ ...args, user_id: userId, status: "pending" });
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, message: `作业"${args.title}"已创建` });
    }

    case "update_assignment_status": {
      const { assignment_id, status } = args as { assignment_id: string; status: string };
      const { error } = await supabase
        .from("assignments")
        .update({ status })
        .eq("id", assignment_id)
        .eq("user_id", userId);
      if (error) return JSON.stringify({ error: error.message });
      const statusLabels: Record<string, string> = {
        pending: "待完成",
        in_progress: "进行中",
        completed: "已完成",
        overdue: "已逾期",
      };
      return JSON.stringify({
        success: true,
        message: `作业状态已更新为"${statusLabels[status] || status}"`,
      });
    }

    case "query_todos": {
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
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ todos: data });
    }

    case "create_todo": {
      const { error } = await supabase
        .from("todos")
        .insert({ ...args, user_id: userId });
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, message: `待办"${args.title}"已创建` });
    }

    case "toggle_todo": {
      const { todo_id, completed } = args as { todo_id: string; completed: boolean };
      const { error } = await supabase
        .from("todos")
        .update({ completed })
        .eq("id", todo_id)
        .eq("user_id", userId);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({
        success: true,
        message: completed ? "待办已标记为完成" : "待办已标记为未完成",
      });
    }

    case "query_grades": {
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
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ grades: data });
    }

    case "create_grade": {
      const { error } = await supabase
        .from("grades")
        .insert({ ...args, user_id: userId });
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({
        success: true,
        message: `成绩已添加：${args.assignment_name || "未命名"} ${args.score}/${args.max_score}`,
      });
    }

    default:
      return JSON.stringify({ error: `未知工具: ${name}` });
  }
}

const MAX_TOOL_ROUNDS = 10;

// SSE helpers
const encoder = new TextEncoder();
function sseEvent(controller: ReadableStreamDefaultController, data: unknown) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

export async function POST(req: Request) {
  const auth = await getUserId();
  if (!auth) {
    return new Response(JSON.stringify({ error: "未登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { userId, email } = auth;

  // Ensure profile exists before any data operations
  const supabase = await getSupabase();
  await ensureProfile(supabase, userId, email);

  // Parse request body (supports both JSON and multipart form data)
  let messages: Array<{ role: string; content: string }>;
  let conversationId: string | undefined;
  let attachedFiles: UploadedFile[] = [];

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    messages = JSON.parse(formData.get("messages") as string);
    conversationId = formData.get("conversationId") as string | undefined;

    // Extract uploaded files
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

  // Resolve conversation ID: use provided one or create a new conversation
  if (!conversationId) {
    const firstUserMsg = messages.find((m) => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "")
      : "新对话";
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

  // Save the latest user message to DB (include file info)
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  if (lastUserMsg) {
    const fileNames = parsedFiles.length > 0
      ? `\n[附件: ${parsedFiles.map((f) => f.name).join(", ")}]`
      : "";
    await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        role: "user",
        content: lastUserMsg.content + fileNames,
        conversation_id: conversationId,
      });
  }

  // Build dynamic system prompt with current time
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
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;
  const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const dayName = dayNames[jsDay];

  const dynamicSystemPrompt = `${SYSTEM_PROMPT}

## 当前时间信息
- 当前时间：${currentTimeStr}
- 今天是：${dayName}（day_of_week = ${dayOfWeek}）
- 注意：课程表中的 day_of_week 使用 1=周一, 7=周日 的编号`;

  // Build multimodal content for the last user message if files are attached
  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: dynamicSystemPrompt },
    ...messages.map((msg, idx): OpenAI.Chat.Completions.ChatCompletionMessageParam => {
      // Attach files to the last user message
      const isLastUserMsg = msg.role === "user" && idx === messages.length - 1;
      if (isLastUserMsg && parsedFiles.length > 0) {
        const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
        // Add images as image_url parts
        for (const file of parsedFiles) {
          if (file.type === "image") {
            content.push({
              type: "image_url",
              image_url: { url: file.content },
            });
          }
        }
        // Add text content (user message + document extracts)
        let textContent = msg.content;
        const textFiles = parsedFiles.filter((f) => f.type === "text");
        if (textFiles.length > 0) {
          const fileContents = textFiles
            .map((f) => `\n\n--- 文件: ${f.name} ---\n${f.content}`)
            .join("\n");
          textContent += fileContents;
        }
        content.push({ type: "text", text: textContent });
        return { role: "user", content };
      }
      return { role: msg.role as "user" | "assistant", content: msg.content };
    }),
  ];

  // Create a single stream for the entire response lifecycle.
  // The agentic loop + final streaming all happen inside `start()`,
  // so the client receives status events and text deltas in real time.
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // --- Agentic loop: non-streaming tool calls ---
        let rounds = 0;
        let finalAssistantText: string | null = null;

        while (rounds < MAX_TOOL_ROUNDS) {
          rounds++;

          const completion = await openai.chat.completions.create({
            model: "qwen3.7-plus",
            messages: openaiMessages,
            tools,
            tool_choice: "auto",
          });

          const choice = completion.choices[0];
          if (!choice) break;

          const assistantMessage = choice.message;

          // If no tool calls, the model is done — capture final text and break
          if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
            openaiMessages.push(assistantMessage);
            finalAssistantText = assistantMessage.content;
            break;
          }

          // Add assistant message with tool_calls to history
          openaiMessages.push(assistantMessage);

          // Execute each tool call, stream status updates
          for (const toolCall of assistantMessage.tool_calls) {
            if (toolCall.type !== "function") continue;

            const toolName = toolCall.function.name;

            // Push status event so the client knows what the agent is doing
            sseEvent(controller, {
              type: "status",
              message: TOOL_STATUS_LABELS[toolName] || `正在执行: ${toolName}`,
            });

            let args: Record<string, unknown> = {};
            try {
              args = JSON.parse(toolCall.function.arguments || "{}");
            } catch {
              // Empty args
            }

            const result = await executeTool(toolName, args, userId);

            openaiMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });
          }
        }

        // --- Final response ---
        // If the agentic loop produced a final text without needing another LLM call
        if (finalAssistantText) {
          // Save to DB
          await supabase
            .from("chat_messages")
            .insert({
              user_id: userId,
              role: "assistant",
              content: finalAssistantText,
              conversation_id: conversationId,
            });

          // Stream as a single chunk
          sseEvent(controller, { type: "text-delta", delta: finalAssistantText });
          sseEvent(controller, { type: "done", conversationId });
          controller.close();
          return;
        }

        // Otherwise, do a final streaming call (no tools) to generate the response
        const streamResponse = await openai.chat.completions.create({
          model: "qwen3.7-plus",
          messages: openaiMessages,
          stream: true,
        });

        let assistantText = "";
        for await (const chunk of streamResponse) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            assistantText += delta;
            sseEvent(controller, { type: "text-delta", delta });
          }
        }

        // Save assistant message to DB after stream completes
        if (assistantText) {
          await supabase
            .from("chat_messages")
            .insert({
              user_id: userId,
              role: "assistant",
              content: assistantText,
              conversation_id: conversationId,
            });
        }

        sseEvent(controller, { type: "done", conversationId });
        controller.close();
      } catch (err) {
        console.error("Stream error:", err);
        sseEvent(controller, {
          type: "text-delta",
          delta: "抱歉，处理请求时出现错误。",
        });
        sseEvent(controller, { type: "done", conversationId });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
