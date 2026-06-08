"use client";

import { useState } from "react";
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
} from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  courseName: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed" | "overdue";
}

const priorityColors = {
  low: "bg-green-500/10 text-green-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-red-500/10 text-red-500",
};

const priorityLabels = {
  low: "低",
  medium: "中",
  high: "高",
};

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
  const [assignments] = useState<Assignment[]>([
    {
      id: "1",
      title: "数学作业第 5 章",
      description: "完成第 5 章课后习题 1-10 题",
      courseName: "高等数学",
      dueDate: "2024-03-15",
      priority: "high",
      status: "pending",
    },
    {
      id: "2",
      title: "数据结构实验报告",
      description: "完成链表实验并撰写实验报告",
      courseName: "数据结构",
      dueDate: "2024-03-16",
      priority: "medium",
      status: "in_progress",
    },
    {
      id: "3",
      title: "英语作文",
      description: "写一篇关于环境保护的英语作文",
      courseName: "英语写作",
      dueDate: "2024-03-18",
      priority: "low",
      status: "pending",
    },
    {
      id: "4",
      title: "数学期中考试复习",
      description: "复习第 1-5 章内容",
      courseName: "高等数学",
      dueDate: "2024-03-20",
      priority: "high",
      status: "pending",
    },
    {
      id: "5",
      title: "数据结构课程设计",
      description: "完成二叉树的课程设计",
      courseName: "数据结构",
      dueDate: "2024-03-25",
      priority: "medium",
      status: "pending",
    },
    {
      id: "6",
      title: "英语阅读理解",
      description: "完成阅读理解练习",
      courseName: "英语写作",
      dueDate: "2024-03-10",
      priority: "low",
      status: "completed",
    },
    {
      id: "7",
      title: "数学作业第 4 章",
      description: "完成第 4 章课后习题",
      courseName: "高等数学",
      dueDate: "2024-03-08",
      priority: "medium",
      status: "overdue",
    },
  ]);

  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed" | "overdue">("all");

  const filteredAssignments = assignments.filter(
    (assignment) => filter === "all" || assignment.status === filter
  );

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    inProgress: assignments.filter((a) => a.status === "in_progress").length,
    completed: assignments.filter((a) => a.status === "completed").length,
    overdue: assignments.filter((a) => a.status === "overdue").length,
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">作业管理</h1>
          <p className="text-muted-foreground">管理你的作业和任务</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加作业
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card
          className={`cursor-pointer ${filter === "all" ? "border-primary" : ""}`}
          onClick={() => setFilter("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">全部作业</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer ${filter === "pending" ? "border-primary" : ""}`}
          onClick={() => setFilter("pending")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待完成</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer ${filter === "in_progress" ? "border-primary" : ""}`}
          onClick={() => setFilter("in_progress")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer ${filter === "completed" ? "border-primary" : ""}`}
          onClick={() => setFilter("completed")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer ${filter === "overdue" ? "border-primary" : ""}`}
          onClick={() => setFilter("overdue")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已逾期</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>作业列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const StatusIcon = statusIcons[assignment.status];
              const daysUntilDue = getDaysUntilDue(assignment.dueDate);

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
                      <Badge variant="outline" className={priorityColors[assignment.priority]}>
                        {priorityLabels[assignment.priority]}
                      </Badge>
                      <Badge variant="outline" className={statusColors[assignment.status]}>
                        {statusLabels[assignment.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {assignment.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>{assignment.courseName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          截止日期: {assignment.dueDate}
                          {daysUntilDue > 0 && ` (${daysUntilDue} 天后)`}
                          {daysUntilDue === 0 && " (今天)"}
                          {daysUntilDue < 0 && ` (已逾期 ${Math.abs(daysUntilDue)} 天)`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {assignment.status === "pending" && (
                      <Button size="sm" variant="outline">
                        开始
                      </Button>
                    )}
                    {assignment.status === "in_progress" && (
                      <Button size="sm" variant="outline">
                        完成
                      </Button>
                    )}
                    {assignment.status === "overdue" && (
                      <Button size="sm" variant="outline">
                        补交
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
