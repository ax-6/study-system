"use client";

import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { getProfile, updateProfile } from "@/app/actions/profile";
import { useAuth } from "@/components/providers/auth-provider";

interface UserProfile {
  full_name: string;
  email: string;
  grade: string;
  major: string;
  learning_goals: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    email: "",
    grade: "",
    major: "",
    learning_goals: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    assignmentReminder: true,
    courseReminder: true,
    gradeNotification: true,
    emailNotification: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      const data = await getProfile();
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || user?.email || "",
          grade: data.grade || "",
          major: data.major || "",
          learning_goals: data.learning_goals || "",
        });
      } else if (user) {
        setProfile((prev) => ({ ...prev, email: user.email || "" }));
      }
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const result = await updateProfile({
        full_name: profile.full_name,
        grade: profile.grade,
        major: profile.major,
        learning_goals: profile.learning_goals,
      });
      if (result.success) {
        alert("个人资料已保存");
      } else {
        alert("保存失败: " + result.error);
      }
    } finally {
      setSaving(false);
    }
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
                value={profile.full_name}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
                placeholder="请输入姓名"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱</label>
              <Input
                value={profile.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">年级</label>
              <Input
                value={profile.grade}
                onChange={(e) =>
                  setProfile({ ...profile, grade: e.target.value })
                }
                placeholder="例如：大三"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">专业</label>
              <Input
                value={profile.major}
                onChange={(e) =>
                  setProfile({ ...profile, major: e.target.value })
                }
                placeholder="例如：计算机科学与技术"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">学习目标</label>
              <Input
                value={profile.learning_goals}
                onChange={(e) =>
                  setProfile({ ...profile, learning_goals: e.target.value })
                }
                placeholder="例如：提高编程能力"
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
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
              {(
                [
                  {
                    key: "assignmentReminder" as const,
                    label: "作业提醒",
                    desc: "在作业截止前发送提醒",
                  },
                  {
                    key: "courseReminder" as const,
                    label: "课程提醒",
                    desc: "在课程开始前发送提醒",
                  },
                  {
                    key: "gradeNotification" as const,
                    label: "成绩通知",
                    desc: "当有新成绩时发送通知",
                  },
                  {
                    key: "emailNotification" as const,
                    label: "邮件通知",
                    desc: "通过邮件接收通知",
                  },
                ] as const
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Button
                    variant={notifications[key] ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setNotifications({
                        ...notifications,
                        [key]: !notifications[key],
                      })
                    }
                  >
                    {notifications[key] ? "开启" : "关闭"}
                  </Button>
                </div>
              ))}
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
                  <p className="text-xs text-muted-foreground">选择应用主题</p>
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
                  <p className="text-xs text-muted-foreground">选择应用语言</p>
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
                  <span className="font-medium">应用名称:</span> 智学助手
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
