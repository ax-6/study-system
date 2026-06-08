import { streamText, UIMessage, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-3.5-turbo"),
    messages: await convertToModelMessages(messages),
    system: `你是一个智能学习助手，专门帮助学生管理学习任务。你可以：
1. 回答学习相关的问题
2. 帮助制定学习计划
3. 解释概念和知识点
4. 提供学习建议

请用中文回复，保持友好和专业的态度。`,
  });

  return result.toUIMessageStreamResponse();
}
