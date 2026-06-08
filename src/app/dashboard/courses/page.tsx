"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Clock, MapPin, User } from "lucide-react";

interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  location: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  color: string;
}

const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00"
];

export default function CoursesPage() {
  const [courses] = useState<Course[]>([
    {
      id: "1",
      name: "高等数学",
      code: "MATH101",
      instructor: "张教授",
      location: "教学楼 A301",
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "09:40",
      color: "bg-blue-500",
    },
    {
      id: "2",
      name: "数据结构",
      code: "CS201",
      instructor: "李教授",
      location: "教学楼 B205",
      dayOfWeek: 1,
      startTime: "10:00",
      endTime: "11:40",
      color: "bg-green-500",
    },
    {
      id: "3",
      name: "英语写作",
      code: "ENG102",
      instructor: "王老师",
      location: "外语楼 C102",
      dayOfWeek: 1,
      startTime: "14:00",
      endTime: "15:40",
      color: "bg-purple-500",
    },
    {
      id: "4",
      name: "高等数学",
      code: "MATH101",
      instructor: "张教授",
      location: "教学楼 A301",
      dayOfWeek: 3,
      startTime: "08:00",
      endTime: "09:40",
      color: "bg-blue-500",
    },
    {
      id: "5",
      name: "数据结构",
      code: "CS201",
      instructor: "李教授",
      location: "教学楼 B205",
      dayOfWeek: 3,
      startTime: "10:00",
      endTime: "11:40",
      color: "bg-green-500",
    },
    {
      id: "6",
      name: "英语写作",
      code: "ENG102",
      instructor: "王老师",
      location: "外语楼 C102",
      dayOfWeek: 5,
      startTime: "14:00",
      endTime: "15:40",
      color: "bg-purple-500",
    },
  ]);

  const getCoursesForDay = (dayOfWeek: number) => {
    return courses.filter((course) => course.dayOfWeek === dayOfWeek);
  };

  const getCourseStyle = (startTime: string, endTime: string) => {
    const startHour = parseInt(startTime.split(":")[0]);
    const startMinute = parseInt(startTime.split(":")[1]);
    const endHour = parseInt(endTime.split(":")[0]);
    const endMinute = parseInt(endTime.split(":")[1]);

    const top = (startHour - 8) * 60 + startMinute;
    const height = (endHour - startHour) * 60 + (endMinute - startMinute);

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">课程表</h1>
          <p className="text-muted-foreground">管理你的课程安排</p>
        </div>
        <Button>
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
            {/* Time column */}
            <div className="space-y-0">
              <div className="h-12" />
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-[60px] flex items-center justify-end pr-2 text-xs text-muted-foreground"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {dayNames.slice(1, 8).map((day, index) => (
              <div key={day} className="relative">
                <div className="h-12 flex items-center justify-center font-medium">
                  {day}
                </div>
                <div className="relative h-[780px] border-l">
                  {/* Time grid lines */}
                  {timeSlots.map((time) => (
                    <div
                      key={time}
                      className="absolute w-full border-t border-muted"
                      style={{ top: `${(parseInt(time.split(":")[0]) - 8) * 60}px` }}
                    />
                  ))}

                  {/* Courses */}
                  {getCoursesForDay(index + 1).map((course) => {
                    const style = getCourseStyle(course.startTime, course.endTime);
                    return (
                      <div
                        key={course.id}
                        className={`absolute left-1 right-1 rounded-md p-2 text-white text-xs overflow-hidden ${course.color}`}
                        style={style}
                      >
                        <div className="font-medium truncate">{course.name}</div>
                        <div className="flex items-center gap-1 mt-1 opacity-90">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{course.location}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 opacity-90">
                          <User className="h-3 w-3" />
                          <span className="truncate">{course.instructor}</span>
                        </div>
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
            {courses
              .filter((course, index, self) =>
                index === self.findIndex((c) => c.code === course.code)
              )
              .map((course) => (
                <div
                  key={course.code}
                  className="flex items-center gap-4 rounded-lg border p-4"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${course.color} text-white`}
                  >
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{course.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {course.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{course.instructor}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{course.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {course.startTime} - {course.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
