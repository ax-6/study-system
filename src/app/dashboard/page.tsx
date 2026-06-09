"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Calendar, BarChart3, Bot, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getDashboardStats } from "@/app/actions/profile";
import { getCourses } from "@/app/actions/courses";
import { getAssignments } from "@/app/actions/assignments";

interface DashboardStats {
  courses: number;
  assignments: number;
  todos: number;
  avgGrade: number;
}

interface CourseItem {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  location: string | null;
}

interface AssignmentItem {
  id: string;
  title: string;
  due_date: string;
  courses: { name: string } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    courses: 0,
    assignments: 0,
    todos: 0,
    avgGrade: 0,
  });
  const [todayCourses, setTodayCourses] = useState<CourseItem[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, coursesData, assignmentsData] = await Promise.all([
          getDashboardStats(),
          getCourses(),
          getAssignments(),
        ]);

        setStats(statsData);

        // Get today's day of week (1=Monday, 7=Sunday)
        const today = new Date().getDay();
        const dayOfWeek = today === 0 ? 7 : today;
        setTodayCourses(
          coursesData
            .filter((c) => c.day_of_week === dayOfWeek)
            .slice(0, 5)
        );

        // Get upcoming assignments
        const now = new Date().toISOString();
        setRecentAssignments(
          assignmentsData
            .filter((a) => a.status !== "completed" && a.due_date >= now)
            .slice(0, 5)
        );
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
          <h1 className="text-3xl font-bold">欢迎回来</h1>
          <p className="text-muted-foreground">这是你的智慧学习AI Agent仪表板</p>
        </div>
        <Button onClick={() => router.push("/")} className="gap-2">
          <Bot className="h-4 w-4" />
          打开 智慧学习AI Agent
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => router.push("/dashboard/courses")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">课程总数</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.courses} 门</div>
            <p className="text-xs text-muted-foreground">本学期已添加课程</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => router.push("/dashboard/assignments")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待完成作业</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignments} 项</div>
            <p className="text-xs text-muted-foreground">有待完成的作业</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => router.push("/dashboard/todos")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待办事项</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todos} 项</div>
            <p className="text-xs text-muted-foreground">有未完成的待办</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => router.push("/dashboard/grades")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均成绩</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgGrade} 分</div>
            <p className="text-xs text-muted-foreground">本学期平均成绩</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>今日课程安排</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/courses")}
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayCourses.length > 0 ? (
                todayCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 rounded-lg border p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{course.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.start_time?.slice(0, 5)} - {course.end_time?.slice(0, 5)}
                        {course.location && ` · ${course.location}`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  今天没有课程安排
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>近期作业</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/assignments")}
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAssignments.length > 0 ? (
                recentAssignments.map((assignment) => {
                  const dueDate = new Date(assignment.due_date);
                  const daysUntil = Math.ceil(
                    (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-4 rounded-lg border p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                        <FileText className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.courses?.name && `${assignment.courses.name} · `}
                          截止: {dueDate.toLocaleDateString("zh-CN")}
                          {daysUntil <= 0
                            ? " (已逾期)"
                            : daysUntil === 1
                              ? " (明天)"
                              : ` (${daysUntil}天后)`}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  暂无近期作业
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Agent Quick Access */}
      <Card
        className="cursor-pointer border-primary/20 bg-primary/5 transition-colors hover:bg-primary/10"
        onClick={() => router.push("/")}
      >
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">需要帮助？试试 智慧学习AI Agent</h3>
            <p className="text-sm text-muted-foreground">
              智慧学习AI Agent可以帮你管理课程、跟踪作业、分析成绩，直接用自然语言对话即可
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}
