"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  Circle,
  BookOpen,
  FileText,
} from "lucide-react";

interface Todo {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  completed: boolean;
  sourceType: "manual" | "assignment" | "course";
  sourceName?: string;
}

const sourceIcons = {
  manual: Circle,
  assignment: FileText,
  course: BookOpen,
};

const sourceColors = {
  manual: "text-muted-foreground",
  assignment: "text-blue-500",
  course: "text-green-500",
};

const initialTodos: Todo[] = [
  {
    id: "1",
    title: "完成数学作业第 5 章",
    description: "完成第 5 章课后习题 1-10 题",
    dueDate: "2024-03-15",
    completed: false,
    sourceType: "assignment",
    sourceName: "高等数学",
  },
  {
    id: "2",
    title: "准备数据结构实验",
    description: "阅读实验指导书，准备实验环境",
    dueDate: "2024-03-14",
    completed: false,
    sourceType: "course",
    sourceName: "数据结构",
  },
  {
    id: "3",
    title: "复习英语单词",
    description: "复习第 1-3 单元的单词",
    dueDate: null,
    completed: false,
    sourceType: "manual",
  },
  {
    id: "4",
    title: "去图书馆还书",
    description: "归还借阅的 3 本书",
    dueDate: "2024-03-16",
    completed: false,
    sourceType: "manual",
  },
  {
    id: "5",
    title: "完成英语作文",
    description: "写一篇关于环境保护的英语作文",
    dueDate: "2024-03-18",
    completed: true,
    sourceType: "assignment",
    sourceName: "英语写作",
  },
  {
    id: "6",
    title: "参加数学辅导课",
    description: "周三下午 2 点的辅导课",
    dueDate: "2024-03-13",
    completed: true,
    sourceType: "course",
    sourceName: "高等数学",
  },
  {
    id: "7",
    title: "整理笔记",
    description: "整理本周各科笔记",
    dueDate: null,
    completed: false,
    sourceType: "manual",
  },
  {
    id: "8",
    title: "预习数据结构第 6 章",
    description: "阅读教材第 6 章内容",
    dueDate: "2024-03-17",
    completed: false,
    sourceType: "course",
    sourceName: "数据结构",
  },
];

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const pendingTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateBadge = (dueDate: string | null) => {
    if (!dueDate) return null;

    const daysUntilDue = getDaysUntilDue(dueDate);
    if (daysUntilDue === null) return null;

    if (daysUntilDue < 0) {
      return <Badge variant="destructive">已逾期</Badge>;
    } else if (daysUntilDue === 0) {
      return <Badge variant="destructive">今天截止</Badge>;
    } else if (daysUntilDue === 1) {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
          明天截止
        </Badge>
      );
    } else if (daysUntilDue <= 3) {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
          {daysUntilDue} 天后
        </Badge>
      );
    } else {
      return <Badge variant="outline">{daysUntilDue} 天后</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">日程管理</h1>
          <p className="text-muted-foreground">管理你的待办事项和日程</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加待办
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待完成</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTodos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTodos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日待办</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                todos.filter(
                  (todo) =>
                    !todo.completed &&
                    todo.dueDate &&
                    getDaysUntilDue(todo.dueDate) === 0
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>待完成事项</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTodos.map((todo) => {
                const SourceIcon = sourceIcons[todo.sourceType];
                const daysUntilDue = getDaysUntilDue(todo.dueDate);

                return (
                  <div
                    key={todo.id}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{todo.title}</h3>
                        {getDueDateBadge(todo.dueDate)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {todo.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div
                          className={`flex items-center gap-1 ${sourceColors[todo.sourceType]}`}
                        >
                          <SourceIcon className="h-3 w-3" />
                          <span>
                            {todo.sourceType === "manual"
                              ? "手动添加"
                              : todo.sourceName}
                          </span>
                        </div>
                        {todo.dueDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              截止日期: {todo.dueDate}
                              {daysUntilDue !== null &&
                                daysUntilDue < 0 &&
                                ` (已逾期 ${Math.abs(daysUntilDue)} 天)`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {pendingTodos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle className="mb-2 h-12 w-12" />
                  <p>所有待办事项已完成！</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>已完成事项</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedTodos.map((todo) => {
                const SourceIcon = sourceIcons[todo.sourceType];

                return (
                  <div
                    key={todo.id}
                    className="flex items-start gap-4 rounded-lg border p-4 opacity-60"
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <h3 className="text-sm font-medium line-through">
                        {todo.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-through">
                        {todo.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div
                          className={`flex items-center gap-1 ${sourceColors[todo.sourceType]}`}
                        >
                          <SourceIcon className="h-3 w-3" />
                          <span>
                            {todo.sourceType === "manual"
                              ? "手动添加"
                              : todo.sourceName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {completedTodos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Circle className="mb-2 h-12 w-12" />
                  <p>暂无已完成事项</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
