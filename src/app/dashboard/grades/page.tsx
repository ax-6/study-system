"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Plus,
  TrendingUp,
  TrendingDown,
  Award,
  BookOpen,
} from "lucide-react";

interface Grade {
  id: string;
  courseId: string;
  courseName: string;
  assignmentName: string | null;
  score: number;
  maxScore: number;
  weight: number;
  type: "midterm" | "final" | "assignment" | "quiz" | "other";
}

interface CourseGrade {
  courseId: string;
  courseName: string;
  grades: Grade[];
  average: number;
  trend: "up" | "down" | "stable";
}

const typeLabels = {
  midterm: "期中考试",
  final: "期末考试",
  assignment: "作业",
  quiz: "测验",
  other: "其他",
};

const typeColors = {
  midterm: "bg-blue-500/10 text-blue-500",
  final: "bg-purple-500/10 text-purple-500",
  assignment: "bg-green-500/10 text-green-500",
  quiz: "bg-yellow-500/10 text-yellow-500",
  other: "bg-gray-500/10 text-gray-500",
};

export default function GradesPage() {
  const [grades] = useState<Grade[]>([
    {
      id: "1",
      courseId: "1",
      courseName: "高等数学",
      assignmentName: "第一次作业",
      score: 85,
      maxScore: 100,
      weight: 10,
      type: "assignment",
    },
    {
      id: "2",
      courseId: "1",
      courseName: "高等数学",
      assignmentName: "第二次作业",
      score: 90,
      maxScore: 100,
      weight: 10,
      type: "assignment",
    },
    {
      id: "3",
      courseId: "1",
      courseName: "高等数学",
      assignmentName: "期中考试",
      score: 78,
      maxScore: 100,
      weight: 30,
      type: "midterm",
    },
    {
      id: "4",
      courseId: "2",
      courseName: "数据结构",
      assignmentName: "第一次实验",
      score: 95,
      maxScore: 100,
      weight: 15,
      type: "assignment",
    },
    {
      id: "5",
      courseId: "2",
      courseName: "数据结构",
      assignmentName: "第二次实验",
      score: 88,
      maxScore: 100,
      weight: 15,
      type: "assignment",
    },
    {
      id: "6",
      courseId: "2",
      courseName: "数据结构",
      assignmentName: "第一次测验",
      score: 82,
      maxScore: 100,
      weight: 20,
      type: "quiz",
    },
    {
      id: "7",
      courseId: "3",
      courseName: "英语写作",
      assignmentName: "第一次作文",
      score: 88,
      maxScore: 100,
      weight: 20,
      type: "assignment",
    },
    {
      id: "8",
      courseId: "3",
      courseName: "英语写作",
      assignmentName: "第二次作文",
      score: 92,
      maxScore: 100,
      weight: 20,
      type: "assignment",
    },
    {
      id: "9",
      courseId: "3",
      courseName: "英语写作",
      assignmentName: "期中考试",
      score: 85,
      maxScore: 100,
      weight: 30,
      type: "midterm",
    },
  ]);

  const courseGrades: CourseGrade[] = grades
    .reduce((acc, grade) => {
      const existing = acc.find((c) => c.courseId === grade.courseId);
      if (existing) {
        existing.grades.push(grade);
      } else {
        acc.push({
          courseId: grade.courseId,
          courseName: grade.courseName,
          grades: [grade],
          average: 0,
          trend: "stable",
        });
      }
      return acc;
    }, [] as CourseGrade[])
    .map((course) => {
      const totalWeight = course.grades.reduce((sum, g) => sum + g.weight, 0);
      const weightedSum = course.grades.reduce(
        (sum, g) => sum + (g.score / g.maxScore) * g.weight,
        0
      );
      const average = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

      // Determine trend (simplified - compare first half vs second half)
      const sortedGrades = [...course.grades].sort(
        (a, b) => a.id.localeCompare(b.id)
      );
      const mid = Math.floor(sortedGrades.length / 2);
      const firstHalf = sortedGrades.slice(0, mid);
      const secondHalf = sortedGrades.slice(mid);

      const firstAvg =
        firstHalf.length > 0
          ? firstHalf.reduce((sum, g) => sum + g.score / g.maxScore, 0) /
            firstHalf.length
          : 0;
      const secondAvg =
        secondHalf.length > 0
          ? secondHalf.reduce((sum, g) => sum + g.score / g.maxScore, 0) /
            secondHalf.length
          : 0;

      let trend: "up" | "down" | "stable" = "stable";
      if (secondAvg > firstAvg + 0.05) trend = "up";
      else if (secondAvg < firstAvg - 0.05) trend = "down";

      return { ...course, average, trend };
    });

  const overallAverage =
    courseGrades.length > 0
      ? courseGrades.reduce((sum, c) => sum + c.average, 0) / courseGrades.length
      : 0;

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return "text-green-500";
    if (percentage >= 80) return "text-blue-500";
    if (percentage >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">成绩管理</h1>
          <p className="text-muted-foreground">查看和管理你的学习成绩</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加成绩
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总体平均分</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallAverage.toFixed(1)} 分
            </div>
            <p className="text-xs text-muted-foreground">
              所有课程加权平均
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最高分课程</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courseGrades.length > 0
                ? courseGrades.reduce((max, c) =>
                    c.average > max.average ? c : max
                  ).courseName
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {courseGrades.length > 0
                ? `${courseGrades
                    .reduce((max, c) => (c.average > max.average ? c : max))
                    .average.toFixed(1)} 分`
                : "暂无数据"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成绩趋势</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courseGrades.filter((c) => c.trend === "up").length} 门上升
            </div>
            <p className="text-xs text-muted-foreground">
              {courseGrades.filter((c) => c.trend === "down").length} 门下降
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已录成绩</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grades.length} 条</div>
            <p className="text-xs text-muted-foreground">
              涵盖 {courseGrades.length} 门课程
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {courseGrades.map((course) => (
          <Card key={course.courseId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{course.courseName}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      平均分: {course.average.toFixed(1)} 分
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {course.trend === "up" && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      上升
                    </Badge>
                  )}
                  {course.trend === "down" && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500">
                      <TrendingDown className="mr-1 h-3 w-3" />
                      下降
                    </Badge>
                  )}
                  {course.trend === "stable" && (
                    <Badge variant="outline">稳定</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {course.grades.map((grade) => (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={typeColors[grade.type]}>
                        {typeLabels[grade.type]}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">
                          {grade.assignmentName || "未命名"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          权重: {grade.weight}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${getScoreColor(
                          grade.score,
                          grade.maxScore
                        )}`}
                      >
                        {grade.score}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{grade.maxScore}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {((grade.score / grade.maxScore) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
