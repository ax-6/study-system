"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match && !className;

          if (isInline) {
            return (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          }

          return (
            <div className="relative my-2">
              <div className="flex items-center justify-between bg-[#282c34] text-muted-foreground text-xs px-4 py-1.5 rounded-t-md">
                <span>{match?.[1] || "code"}</span>
                <button
                  className="hover:text-foreground transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      String(children).replace(/\n$/, "")
                    );
                  }}
                >
                  复制
                </button>
              </div>
              <SyntaxHighlighter
                style={oneDark}
                language={match?.[1] || "text"}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  fontSize: "0.875rem",
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            </div>
          );
        },
        h1({ children }) {
          return (
            <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
          );
        },
        h2({ children }) {
          return (
            <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>
          );
        },
        h3({ children }) {
          return (
            <h3 className="text-base font-semibold mt-2 mb-1">
              {children}
            </h3>
          );
        },
        ul({ children }) {
          return <ul className="list-disc pl-5 my-1 space-y-0.5">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal pl-5 my-1 space-y-0.5">{children}</ol>;
        },
        li({ children }) {
          return <li className="leading-relaxed">{children}</li>;
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-primary/40 pl-3 py-1 my-2 bg-muted/50 rounded-r">
              {children}
            </blockquote>
          );
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          );
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-2">
              <table className="border-collapse text-sm w-full">
                {children}
              </table>
            </div>
          );
        },
        thead({ children }) {
          return <thead className="bg-muted">{children}</thead>;
        },
        th({ children }) {
          return (
            <th className="border border-border px-3 py-1.5 text-left font-medium">
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td className="border border-border px-3 py-1.5">{children}</td>
          );
        },
        hr() {
          return <hr className="my-3 border-border" />;
        },
        strong({ children }) {
          return <strong className="font-semibold">{children}</strong>;
        },
        em({ children }) {
          return <em className="italic">{children}</em>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
