"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  User,
  Bell,
  Palette,
  Save,
  BookOpen,
} from "lucide-react";

interface UserProfile {
  fullName: string;
  email: string;
  grade: string;
  major: string;
  learningGoals: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "张三",
    email: "zhangsan@example.com",
    grade: "大三",
    major: "计算机科学与技术",
    learningGoals: "提高编程能力，掌握数据结构和算法",
  });

  const [notifications, setNotifications] = useState({
    assignmentReminder: true,
    courseReminder: true,
    gradeNotification: true,
    emailNotification: false,
  });

  const handleSaveProfile = () => {
    // TODO: Save profile to database
    alert("个人资料已保存");
  };

  const handleSaveNotifications = () => {
    // TODO: Save notification settings
    alert("通知设置已保存");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">设置</h1>
        <p className="text-muted-foreground">管理你的个人资料和应用设置</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              个人资料
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">姓名</label>
              <Input
                value={profile.fullName}
                onChange={(e) =>
                  setProfile({ ...profile, fullName: e.target.value })
                }
                placeholder="请输入姓名"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱</label>
              <Input
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                placeholder="请输入邮箱"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">年级</label>
              <Input
                value={profile.grade}
                onChange={(e) =>
                  setProfile({ ...profile, grade: e.target.value })
                }
                placeholder="请输入年级"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">专业</label>
              <Input
                value={profile.major}
                onChange={(e) =>
                  setProfile({ ...profile, major: e.target.value })
                }
                placeholder="请输入专业"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">学习目标</label>
              <Input
                value={profile.learningGoals}
                onChange={(e) =>
                  setProfile({ ...profile, learningGoals: e.target.value })
                }
                placeholder="请输入学习目标"
              />
            </div>

            <Button onClick={handleSaveProfile} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              保存个人资料
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                通知设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">作业提醒</p>
                  <p className="text-xs text-muted-foreground">
                    在作业截止前发送提醒
                  </p>
                </div>
                <Button
                  variant={notifications.assignmentReminder ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      assignmentReminder: !notifications.assignmentReminder,
                    })
                  }
                >
                  {notifications.assignmentReminder ? "开启" : "关闭"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">课程提醒</p>
                  <p className="text-xs text-muted-foreground">
                    在课程开始前发送提醒
                  </p>
                </div>
                <Button
                  variant={notifications.courseReminder ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      courseReminder: !notifications.courseReminder,
                    })
                  }
                >
                  {notifications.courseReminder ? "开启" : "关闭"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">成绩通知</p>
                  <p className="text-xs text-muted-foreground">
                    当有新成绩时发送通知
                  </p>
                </div>
                <Button
                  variant={notifications.gradeNotification ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      gradeNotification: !notifications.gradeNotification,
                    })
                  }
                >
                  {notifications.gradeNotification ? "开启" : "关闭"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">邮件通知</p>
                  <p className="text-xs text-muted-foreground">
                    通过邮件接收通知
                  </p>
                </div>
                <Button
                  variant={notifications.emailNotification ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      emailNotification: !notifications.emailNotification,
                    })
                  }
                >
                  {notifications.emailNotification ? "开启" : "关闭"}
                </Button>
              </div>

              <Button onClick={handleSaveNotifications} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                保存通知设置
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                外观设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">主题</p>
                  <p className="text-xs text-muted-foreground">
                    选择应用主题
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    浅色
                  </Button>
                  <Button variant="outline" size="sm">
                    深色
                  </Button>
                  <Button variant="default" size="sm">
                    系统
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">语言</p>
                  <p className="text-xs text-muted-foreground">
                    选择应用语言
                  </p>
                </div>
                <Badge variant="outline">中文</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                关于
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">应用名称:</span> AI 学习助手
                </p>
                <p className="text-sm">
                  <span className="font-medium">版本:</span> 1.0.0
                </p>
                <p className="text-sm">
                  <span className="font-medium">描述:</span> 基于 AI Agent 的智能学习助手系统
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
