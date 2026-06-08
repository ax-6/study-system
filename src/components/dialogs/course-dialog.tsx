"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    code?: string;
    instructor?: string;
    location?: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    color?: string;
  }) => Promise<void>;
}

const dayNames = [
  { value: "1", label: "周一" },
  { value: "2", label: "周二" },
  { value: "3", label: "周三" },
  { value: "4", label: "周四" },
  { value: "5", label: "周五" },
  { value: "6", label: "周六" },
  { value: "7", label: "周日" },
];

const colors = [
  { value: "bg-blue-500", label: "蓝色" },
  { value: "bg-green-500", label: "绿色" },
  { value: "bg-purple-500", label: "紫色" },
  { value: "bg-red-500", label: "红色" },
  { value: "bg-yellow-500", label: "黄色" },
  { value: "bg-pink-500", label: "粉色" },
  { value: "bg-indigo-500", label: "靛蓝" },
  { value: "bg-teal-500", label: "青色" },
];

export function CourseDialog({ open, onOpenChange, onSubmit }: CourseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    instructor: "",
    location: "",
    day_of_week: "1",
    start_time: "08:00",
    end_time: "09:40",
    color: "bg-blue-500",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        name: form.name,
        code: form.code || undefined,
        instructor: form.instructor || undefined,
        location: form.location || undefined,
        day_of_week: parseInt(form.day_of_week),
        start_time: form.start_time,
        end_time: form.end_time,
        color: form.color,
      });
      setForm({
        name: "",
        code: "",
        instructor: "",
        location: "",
        day_of_week: "1",
        start_time: "08:00",
        end_time: "09:40",
        color: "bg-blue-500",
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加课程</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">课程名称 *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例如：高等数学"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">课程代码</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="例如：MATH101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructor">授课教师</Label>
              <Input
                id="instructor"
                value={form.instructor}
                onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                placeholder="例如：张教授"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">上课地点</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="例如：教学楼 A301"
            />
          </div>
          <div className="space-y-2">
            <Label>星期</Label>
            <Select
              value={form.day_of_week}
              onValueChange={(v) => setForm({ ...form, day_of_week: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayNames.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">开始时间</Label>
              <Input
                id="start_time"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">结束时间</Label>
              <Input
                id="end_time"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>颜色</Label>
            <Select
              value={form.color}
              onValueChange={(v) => setForm({ ...form, color: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colors.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded ${c.value}`} />
                      {c.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              添加
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
