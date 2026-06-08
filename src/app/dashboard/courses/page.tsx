"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Clock, MapPin, User, Trash2, Loader2 } from "lucide-react";
import { Calendar as BigCalendar } from "react-big-calendar";
import { startOfWeek, addDays, setHours, setMinutes } from "date-fns";
import { localizer } from "@/lib/calendar-localizer";
import { getCourses, createCourse, deleteCourse } from "@/app/actions/courses";
import { CourseDialog } from "@/components/dialogs/course-dialog";
import type { Course } from "@/types/database";

const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const colorToHex: Record<string, string> = {
  "bg-blue-500": "#3b82f6",
  "bg-green-500": "#22c55e",
  "bg-purple-500": "#a855f7",
  "bg-red-500": "#ef4444",
  "bg-yellow-500": "#eab308",
  "bg-pink-500": "#ec4899",
  "bg-indigo-500": "#6366f1",
  "bg-teal-500": "#14b8a6",
};

function courseToEvent(course: Course, weekStart: Date) {
  const dayOffset = course.day_of_week - 1;
  const eventDate = addDays(weekStart, dayOffset);

  const [startH, startM] = course.start_time.split(":").map(Number);
  const [endH, endM] = course.end_time.split(":").map(Number);

  const start = setMinutes(setHours(eventDate, startH), startM);
  const end = setMinutes(setHours(eventDate, endH), endM);

  return {
    id: course.id,
    title: course.name,
    start,
    end,
    resource: course,
  };
}

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

  const events = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return courses.map((c) => courseToEvent(c, weekStart));
  }, [courses]);

  const minTime = useMemo(() => setMinutes(setHours(new Date(), 8), 0), []);
  const maxTime = useMemo(() => setMinutes(setHours(new Date(), 21), 0), []);

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
          <div className="h-[600px]">
            <BigCalendar
              localizer={localizer}
              events={events}
              defaultView="week"
              views={["week", "day"]}
              toolbar={false}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              eventPropGetter={(event) => {
                const course = event.resource as Course;
                return {
                  style: {
                    backgroundColor: colorToHex[course.color] || "#3b82f6",
                    color: "white",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "12px",
                  },
                };
              }}
              onSelectEvent={(event) => {
                handleDelete(event.resource.id);
              }}
              min={minTime}
              max={maxTime}
              formats={{
                dayHeaderFormat: (date: Date) => dayNames[date.getDay()],
                timeGutterFormat: (date: Date) =>
                  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
              }}
              messages={{
                week: "周",
                day: "天",
                today: "今天",
                previous: "上一周",
                next: "下一周",
              }}
              components={{
                event: ({ event }) => {
                  const course = event.resource as Course;
                  return (
                    <div className="truncate px-1">
                      <div className="truncate text-xs font-medium">{event.title}</div>
                      {course.location && (
                        <div className="truncate text-xs opacity-90">{course.location}</div>
                      )}
                    </div>
                  );
                },
              }}
            />
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
