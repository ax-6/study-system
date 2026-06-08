"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
  Circle,
  BookOpen,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  getAssignments,
  createAssignment,
  updateAssignmentStatus,
  deleteAssignment,
} from "@/app/actions/assignments";
import { AssignmentDialog } from "@/components/dialogs/assignment-dialog";
import type { Assignment } from "@/types/database";

interface AssignmentWithCourse extends Assignment {
  courses: { name: string } | null;
}

const priorityColors = {
  low: "bg-green-500/10 text-green-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-red-500/10 text-red-500",
};

const priorityLabels = { low: "低", medium: "中", high: "高" };

const statusIcons = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle,
  overdue: AlertCircle,
};

const statusColors = {
  pending: "text-muted-foreground",
  in_progress: "text-blue-500",
  completed: "text-green-500",
  overdue: "text-red-500",
};

const statusLabels = {
  pending: "待完成",
  in_progress: "进行中",
  completed: "已完成",
  overdue: "已逾期",
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "in_progress" | "completed" | "overdue"
  >("all");

  const loadAssignments = useCallback(async () => {
    const data = await getAssignments();
    setAssignments(data as AssignmentWithCourse[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleCreate = async (data: {
    title: string;
    description?: string;
    course_id?: string;
    due_date: string;
    priority?: "low" | "medium" | "high";
  }) => {
    const result = await createAssignment(data);
    if (result.success) {
      await loadAssignments();
    }
  };

  const handleStatusChange = async (
    id: string,
    status: "pending" | "in_progress" | "completed" | "overdue"
  ) => {
    const result = await updateAssignmentStatus(id, status);
    if (result.success) {
      await loadAssignments();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个作业吗？")) return;
    const result = await deleteAssignment(id);
    if (result.success) {
      await loadAssignments();
    }
  };

  const filteredAssignments = assignments.filter(
    (a) => filter === "all" || a.status === filter
  );

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    inProgress: assignments.filter((a) => a.status === "in_progress").length,
    completed: assignments.filter((a) => a.status === "completed").length,
    overdue: assignments.filter((a) => a.status === "overdue").length,
  };

  const getDaysUntilDue = (dueDate: string) => {
    const diffTime = new Date(dueDate).getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
          <h1 className="text-3xl font-bold">作业管理</h1>
          <p className="text-muted-foreground">管理你的作业和任务</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加作业
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {(
          [
            { key: "all", label: "全部作业", icon: FileText, count: stats.total },
            { key: "pending", label: "待完成", icon: Circle, count: stats.pending },
            {
              key: "in_progress",
              label: "进行中",
              icon: Clock,
              count: stats.inProgress,
            },
            {
              key: "completed",
              label: "已完成",
              icon: CheckCircle,
              count: stats.completed,
            },
            {
              key: "overdue",
              label: "已逾期",
              icon: AlertCircle,
              count: stats.overdue,
            },
          ] as const
        ).map(({ key, label, icon: Icon, count }) => (
          <Card
            key={key}
            className={`cursor-pointer ${filter === key ? "border-primary" : ""}`}
            onClick={() => setFilter(key)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>作业列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAssignments.length > 0 ? (
              filteredAssignments.map((assignment) => {
                const StatusIcon = statusIcons[assignment.status];
                const daysUntilDue = getDaysUntilDue(assignment.due_date);

                return (
                  <div
                    key={assignment.id}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <div className={`mt-1 ${statusColors[assignment.status]}`}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{assignment.title}</h3>
                        <Badge
                          variant="outline"
                          className={priorityColors[assignment.priority]}
                        >
                          {priorityLabels[assignment.priority]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={statusColors[assignment.status]}
                        >
                          {statusLabels[assignment.status]}
                        </Badge>
                      </div>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {assignment.courses?.name && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span>{assignment.courses.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            截止日期:{" "}
                            {new Date(assignment.due_date).toLocaleDateString("zh-CN")}
                            {daysUntilDue > 0 && ` (${daysUntilDue} 天后)`}
                            {daysUntilDue === 0 && " (今天)"}
                            {daysUntilDue < 0 &&
                              ` (已逾期 ${Math.abs(daysUntilDue)} 天)`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {assignment.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(assignment.id, "in_progress")
                          }
                        >
                          开始
                        </Button>
                      )}
                      {assignment.status === "in_progress" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(assignment.id, "completed")
                          }
                        >
                          完成
                        </Button>
                      )}
                      {assignment.status === "overdue" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(assignment.id, "completed")
                          }
                        >
                          补交
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDelete(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                {filter === "all"
                  ? "暂无作业，点击'添加作业'开始"
                  : `没有${statusLabels[filter]}的作业`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
