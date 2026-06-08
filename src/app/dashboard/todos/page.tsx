"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  Circle,
  BookOpen,
  FileText,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { Calendar as BigCalendar } from "react-big-calendar";
import { localizer } from "@/lib/calendar-localizer";
import { getTodos, createTodo, toggleTodo, deleteTodo } from "@/app/actions/todos";
import { TodoDialog } from "@/components/dialogs/todo-dialog";
import type { Todo } from "@/types/database";

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

const sourceBgColors: Record<string, string> = {
  manual: "#6366f1",
  assignment: "#3b82f6",
  course: "#22c55e",
};

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const loadTodos = useCallback(async () => {
    const data = await getTodos();
    setTodos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreate = async (data: {
    title: string;
    description?: string;
    due_date?: string;
  }) => {
    const result = await createTodo(data);
    if (result.success) {
      await loadTodos();
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    const result = await toggleTodo(id, completed);
    if (result.success) {
      await loadTodos();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个待办吗？")) return;
    const result = await deleteTodo(id);
    if (result.success) {
      await loadTodos();
    }
  };

  const pendingTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  const filteredPendingTodos = useMemo(() => {
    if (!selectedDate) return pendingTodos;
    return pendingTodos.filter((t) => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return (
        dueDate.getFullYear() === selectedDate.getFullYear() &&
        dueDate.getMonth() === selectedDate.getMonth() &&
        dueDate.getDate() === selectedDate.getDate()
      );
    });
  }, [pendingTodos, selectedDate]);

  const calendarEvents = useMemo(() => {
    return todos
      .filter((t) => t.due_date)
      .map((t) => ({
        id: t.id,
        title: t.title,
        start: new Date(t.due_date!),
        end: new Date(t.due_date!),
        allDay: true,
        resource: t,
      }));
  }, [todos]);

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const diffTime = new Date(dueDate).getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDueDateBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    const days = getDaysUntilDue(dueDate);
    if (days === null) return null;
    if (days < 0) return <Badge variant="destructive">已逾期</Badge>;
    if (days === 0) return <Badge variant="destructive">今天截止</Badge>;
    if (days === 1)
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
          明天截止
        </Badge>
      );
    if (days <= 3)
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
          {days} 天后
        </Badge>
      );
    return <Badge variant="outline">{days} 天后</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">日程管理</h1>
          <p className="text-muted-foreground">管理你的待办事项和日程</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
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
                pendingTodos.filter(
                  (t) => t.due_date && getDaysUntilDue(t.due_date) === 0
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">列表视图</TabsTrigger>
          <TabsTrigger value="calendar">日历视图</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>日历视图</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <BigCalendar
                  localizer={localizer}
                  events={calendarEvents}
                  defaultView="month"
                  views={["month"]}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: "100%" }}
                  eventPropGetter={(event) => {
                    const todo = event.resource as Todo;
                    if (todo.completed) {
                      return {
                        style: {
                          backgroundColor: "#94a3b8",
                          color: "white",
                          borderRadius: "4px",
                          opacity: 0.6,
                          textDecoration: "line-through",
                          fontSize: "12px",
                        },
                      };
                    }
                    return {
                      style: {
                        backgroundColor: sourceBgColors[todo.source_type] || "#6366f1",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "12px",
                      },
                    };
                  }}
                  onSelectSlot={(slotInfo) => {
                    setSelectedDate(
                      selectedDate &&
                        selectedDate.getTime() === slotInfo.start.getTime()
                        ? null
                        : slotInfo.start
                    );
                  }}
                  selectable
                  messages={{
                    month: "月",
                    week: "周",
                    day: "天",
                    today: "今天",
                    previous: "上一月",
                    next: "下一月",
                    noEventsInRange: "该时间段无待办事项",
                  }}
                />
              </div>
              {selectedDate && (
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    已选择: {selectedDate.toLocaleDateString("zh-CN")}
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="ml-1 rounded-full hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    显示该日期的待办事项
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  待完成事项
                  {selectedDate && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({selectedDate.toLocaleDateString("zh-CN")})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredPendingTodos.length > 0 ? (
                    filteredPendingTodos.map((todo) => {
                      const SourceIcon = sourceIcons[todo.source_type];
                      const daysUntilDue = getDaysUntilDue(todo.due_date);

                      return (
                        <div
                          key={todo.id}
                          className="flex items-start gap-4 rounded-lg border p-4"
                        >
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => handleToggle(todo.id, true)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium">{todo.title}</h3>
                              {getDueDateBadge(todo.due_date)}
                            </div>
                            {todo.description && (
                              <p className="text-sm text-muted-foreground">
                                {todo.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div
                                className={`flex items-center gap-1 ${sourceColors[todo.source_type]}`}
                              >
                                <SourceIcon className="h-3 w-3" />
                                <span>
                                  {todo.source_type === "manual"
                                    ? "手动添加"
                                    : todo.source_type === "assignment"
                                      ? "作业"
                                      : "课程"}
                                </span>
                              </div>
                              {todo.due_date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    截止:{" "}
                                    {new Date(todo.due_date).toLocaleDateString("zh-CN")}
                                    {daysUntilDue !== null &&
                                      daysUntilDue < 0 &&
                                      ` (已逾期 ${Math.abs(daysUntilDue)} 天)`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(todo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle className="mb-2 h-12 w-12" />
                      <p>
                        {selectedDate
                          ? "该日期无待办事项"
                          : "所有待办事项已完成！"}
                      </p>
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
                  {completedTodos.length > 0 ? (
                    completedTodos.map((todo) => {
                      const SourceIcon = sourceIcons[todo.source_type];

                      return (
                        <div
                          key={todo.id}
                          className="flex items-start gap-4 rounded-lg border p-4 opacity-60"
                        >
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => handleToggle(todo.id, false)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <h3 className="text-sm font-medium line-through">
                              {todo.title}
                            </h3>
                            {todo.description && (
                              <p className="text-sm text-muted-foreground line-through">
                                {todo.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div
                                className={`flex items-center gap-1 ${sourceColors[todo.source_type]}`}
                              >
                                <SourceIcon className="h-3 w-3" />
                                <span>
                                  {todo.source_type === "manual"
                                    ? "手动添加"
                                    : todo.source_type === "assignment"
                                      ? "作业"
                                      : "课程"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(todo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Circle className="mb-2 h-12 w-12" />
                      <p>暂无已完成事项</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <TodoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
