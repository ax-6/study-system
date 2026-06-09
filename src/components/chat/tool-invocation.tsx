"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Wrench,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface ToolInvocationProps {
  toolName: string;
  args: Record<string, unknown>;
  state: "call" | "result" | "partial-call";
  result?: unknown;
}

const TOOL_LABELS: Record<string, string> = {
  query_courses: "查询课程",
  create_course: "创建课程",
  update_course: "更新课程",
  delete_course: "删除课程",
  query_assignments: "查询作业",
  create_assignment: "创建作业",
  update_assignment_status: "更新作业状态",
  query_todos: "查询待办",
  create_todo: "创建待办",
  toggle_todo: "切换待办状态",
  query_grades: "查询成绩",
  create_grade: "添加成绩",
};

function formatResult(result: unknown): { text: string; isError: boolean } {
  if (!result) return { text: "", isError: false };
  try {
    const parsed = typeof result === "string" ? JSON.parse(result) : result;
    if (parsed.error) return { text: `❌ ${parsed.error}`, isError: true };
    if (parsed.success)
      return { text: `✅ ${parsed.message || "操作成功"}`, isError: false };
    return { text: JSON.stringify(parsed, null, 2), isError: false };
  } catch {
    return { text: String(result), isError: false };
  }
}

export function ToolInvocation({
  toolName,
  args,
  state,
  result,
}: ToolInvocationProps) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[toolName] || toolName;
  const hasArgs = Object.keys(args).length > 0;
  const isRunning = state === "call" || state === "partial-call";
  const isDone = state === "result";
  const resultInfo = isDone ? formatResult(result) : null;

  return (
    <div className="my-1.5 rounded-md border border-border/50 bg-background/50 text-xs">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left hover:bg-muted/30 transition-colors rounded-md"
      >
        {isRunning ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500 shrink-0" />
        ) : resultInfo?.isError ? (
          <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
        )}

        <Wrench className="h-3 w-3 text-purple-500 shrink-0" />

        <span className="font-medium truncate">
          {isRunning ? `正在${label}...` : label}
        </span>

        {isDone && resultInfo && !resultInfo.isError && (
          <span className="ml-auto text-[10px] text-green-600 shrink-0">
            完成
          </span>
        )}

        {hasArgs &&
          (expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          ))}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/30 px-2.5 py-2 space-y-1.5">
          {/* Args */}
          {hasArgs && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                参数
              </p>
              <pre className="whitespace-pre-wrap break-words rounded bg-muted/50 p-1.5 text-[11px] font-mono">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}

          {/* Result */}
          {isDone && resultInfo && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                结果
              </p>
              <pre
                className={`whitespace-pre-wrap break-words rounded p-1.5 text-[11px] font-mono ${
                  resultInfo.isError
                    ? "bg-red-500/10 text-red-600"
                    : "bg-green-500/10 text-green-700"
                }`}
              >
                {resultInfo.text}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
