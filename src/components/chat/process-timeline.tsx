"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Send,
  Wrench,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";

interface ProcessStep {
  type: "input" | "status" | "tool-call" | "tool-result";
  message: string;
  tool?: string;
  label?: string;
  args?: string;
}

interface ProcessTimelineProps {
  steps: ProcessStep[];
  isStreaming: boolean;
}

const STEP_ICONS: Record<string, typeof Send> = {
  input: Send,
  status: Info,
  "tool-call": Wrench,
  "tool-result": CheckCircle2,
};

const STEP_COLORS: Record<string, string> = {
  input: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  status: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  "tool-call": "text-purple-500 bg-purple-500/10 border-purple-500/20",
  "tool-result": "text-green-500 bg-green-500/10 border-green-500/20",
};

const STEP_LINE_COLORS: Record<string, string> = {
  input: "border-blue-500/30",
  status: "border-amber-500/30",
  "tool-call": "border-purple-500/30",
  "tool-result": "border-green-500/30",
};

function StepItem({ step, isLast, isStreaming }: { step: ProcessStep; isLast: boolean; isStreaming: boolean }) {
  const Icon = STEP_ICONS[step.type] || Info;
  const colorClass = STEP_COLORS[step.type] || STEP_COLORS.status;
  const lineColor = STEP_LINE_COLORS[step.type] || STEP_LINE_COLORS.status;

  // Parse the message to separate title and content
  const lines = step.message.split("\n");
  const title = lines[0] || "";
  const content = lines.slice(1).join("\n").trim();

  return (
    <div className="flex gap-2">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${colorClass}`}
        >
          {isLast && isStreaming ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Icon className="h-3 w-3" />
          )}
        </div>
        {!isLast && (
          <div className={`w-px flex-1 border-l ${lineColor} my-0.5`} />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-2">
        <p className="text-xs font-medium leading-relaxed">{title}</p>
        {content && (
          <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-background/50 p-1.5 text-[11px] leading-relaxed text-muted-foreground font-mono max-h-40 overflow-y-auto">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}

export function ProcessTimeline({ steps, isStreaming }: ProcessTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  // Show a compact summary when collapsed
  const lastStep = steps[steps.length - 1];
  const summaryText = isStreaming
    ? lastStep?.message.split("\n")[0] || "处理中..."
    : `完成 ${steps.filter((s) => s.type === "tool-call").length} 个工具调用`;

  return (
    <div className="mb-2 rounded-md border border-border/50 bg-muted/30">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        {isStreaming && (
          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
        )}
        <span className="truncate">{summaryText}</span>
        <span className="ml-auto shrink-0 text-[10px] opacity-60">
          {steps.length} 步
        </span>
      </button>

      {/* Expanded timeline */}
      {expanded && (
        <div className="px-2.5 pb-1 pt-0">
          <div className="ml-1">
            {steps.map((step, idx) => (
              <StepItem
                key={idx}
                step={step}
                isLast={idx === steps.length - 1}
                isStreaming={isStreaming}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
