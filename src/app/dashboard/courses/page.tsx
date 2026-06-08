"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Clock, MapPin, User, Trash2, Loader2 } from "lucide-react";
import { getCourses, createCourse, deleteCourse } from "@/app/actions/courses";
import { CourseDialog } from "@/components/dialogs/course-dialog";
import type { Course } from "@/types/database";

const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00",
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadCourses = useCallback(async () => {
    const data = await getCourses();
    setCourses(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleCreate = async (data: {
    name: string;
    code?: string;
    instructor?: string;
    location?: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    color?: string;
  }) => {
    const result = await createCourse(data);
    if (result.success) {
      await loadCourses();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这门课程吗？")) return;
    const result = await deleteCourse(id);
    if (result.success) {
      await loadCourses();
    }
  };

  const getCoursesForDay = (dayOfWeek: number) => {
    return courses.filter((course) => course.day_of_week === dayOfWeek);
  };

  const getCourseStyle = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const top = (startH - 8) * 60 + startM;
    const height = (endH - startH) * 60 + (endM - startM);
    return { top: `${top}px`, height: `${height}px` };
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
          <h1 className="text-3xl font-bold">课程表</h1>
          <p className="text-muted-foreground">管理你的课程安排</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加课程
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>本周课程安排</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-4">
            <div className="space-y-0">
              <div className="h-12" />
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="flex h-[60px] items-center justify-end pr-2 text-xs text-muted-foreground"
                >
                  {time}
                </div>
              ))}
            </div>
            {dayNames.slice(1, 8).map((day, index) => (
              <div key={day} className="relative">
                <div className="flex h-12 items-center justify-center font-medium">
                  {day}
                </div>
                <div className="relative h-[780px] border-l">
                  {timeSlots.map((time) => (
                    <div
                      key={time}
                      className="absolute w-full border-t border-muted"
                      style={{
                        top: `${(parseInt(time.split(":")[0]) - 8) * 60}px`,
                      }}
                    />
                  ))}
                  {getCoursesForDay(index + 1).map((course) => {
                    const style = getCourseStyle(course.start_time, course.end_time);
                    return (
                      <div
                        key={course.id}
                        className={`absolute left-1 right-1 cursor-pointer overflow-hidden rounded-md p-2 text-xs text-white hover:opacity-90 ${course.color}`}
                        style={style}
                        onClick={() => handleDelete(course.id)}
                        title="点击删除"
                      >
                        <div className="truncate font-medium">{course.name}</div>
                        {course.location && (
                          <div className="mt-1 flex items-center gap-1 opacity-90">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{course.location}</span>
                          </div>
                        )}
                        {course.instructor && (
                          <div className="mt-1 flex items-center gap-1 opacity-90">
                            <User className="h-3 w-3" />
                            <span className="truncate">{course.instructor}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>课程列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.length > 0 ? (
              courses
                .filter(
                  (course, index, self) =>
                    index === self.findIndex((c) => c.code === course.code && c.code)
                )
                .map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 rounded-lg border p-4"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${course.color}`}
                    >
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{course.name}</p>
                        {course.code && (
                          <span className="text-xs text-muted-foreground">
                            {course.code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {course.instructor && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{course.instructor}</span>
                          </div>
                        )}
                        {course.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{course.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {dayNames[course.day_of_week]} {course.start_time?.slice(0, 5)} -{" "}
                            {course.end_time?.slice(0, 5)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDelete(course.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                暂无课程，点击"添加课程"开始
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <CourseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
