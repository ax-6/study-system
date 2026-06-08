"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Calendar, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">欢迎回来</h1>
        <p className="text-muted-foreground">
          这是你的学习助手仪表板
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日课程</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 门</div>
            <p className="text-xs text-muted-foreground">
              今天有 3 节课要上
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待完成作业</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 项</div>
            <p className="text-xs text-muted-foreground">
              有 5 项作业待完成
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日待办</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 项</div>
            <p className="text-xs text-muted-foreground">
              有 8 项待办事项
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均成绩</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85 分</div>
            <p className="text-xs text-muted-foreground">
              本学期平均成绩
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>今日课程安排</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">高等数学</p>
                  <p className="text-xs text-muted-foreground">
                    08:00 - 09:40 · 教学楼 A301
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">数据结构</p>
                  <p className="text-xs text-muted-foreground">
                    10:00 - 11:40 · 教学楼 B205
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">英语写作</p>
                  <p className="text-xs text-muted-foreground">
                    14:00 - 15:40 · 外语楼 C102
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>近期作业</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                  <FileText className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">数学作业第 5 章</p>
                  <p className="text-xs text-muted-foreground">
                    截止时间: 明天 23:59
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                  <FileText className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">数据结构实验报告</p>
                  <p className="text-xs text-muted-foreground">
                    截止时间: 后天 23:59
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                  <FileText className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">英语作文</p>
                  <p className="text-xs text-muted-foreground">
                    截止时间: 下周一 23:59
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
