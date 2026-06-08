import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

  const body = await req.json();
  const { messages } = body as {
    messages: Array<{ role: string; content: string }>;
  };

  // Build OpenAI-format messages
  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
  ];

  // --- Agentic loop: non-streaming tool calls ---
  let rounds = 0;
  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    const completion = await openai.chat.completions.create({
      model: "qwen-plus",
      messages: openaiMessages,
      tools,
      tool_choice: "auto",
    });

    const choice = completion.choices[0];
    if (!choice) break;

    const assistantMessage = choice.message;

    // If no tool calls, the model is done — break out to stream the final answer
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      // Add the final assistant message to history
      openaiMessages.push(assistantMessage);
      break;
    }

    // Add assistant message with tool_calls to history
    openaiMessages.push(assistantMessage);

    // Execute each tool call and add results
    for (const toolCall of assistantMessage.tool_calls) {
      if (toolCall.type !== "function") continue;

      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        // Empty args
      }

      const result = await executeTool(toolCall.function.name, args, userId);

      openaiMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }

  // --- Final streaming response (no tools) ---
  // If the last message is already an assistant message with content (no tool calls),
  // we can just return it directly. Otherwise, do a streaming call without tools.
  const lastMsg = openaiMessages[openaiMessages.length - 1];

  // Check if the agentic loop already produced a final text response
  const hasFinalText =
    lastMsg.role === "assistant" &&
    lastMsg.content &&
    !("tool_calls" in lastMsg && lastMsg.tool_calls);

  if (hasFinalText) {
    // Return the final text as a single SSE chunk
    const text = lastMsg.content as string;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "text-delta", delta: text })}\n\n`)
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Otherwise, do a final streaming call without tools to generate the response
  const streamResponse = await openai.chat.completions.create({
    model: "qwen-plus",
    messages: openaiMessages,
    stream: true,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamResponse) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "text-delta", delta })}\n\n`
              )
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        console.error("Streaming error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "text-delta", delta: "抱歉，生成回复时出现错误。" })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
