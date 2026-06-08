"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { getCourses } from "@/app/actions/courses";

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    course_id?: string;
    due_date: string;
    priority?: "low" | "medium" | "high";
  }) => Promise<void>;
}

export function AssignmentDialog({ open, onOpenChange, onSubmit }: AssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    course_id: "",
    due_date: "",
    priority: "medium" as "low" | "medium" | "high",
  });

  useEffect(() => {
    if (open) {
      getCourses().then((data) => setCourses(data || []));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.due_date) return;
    setLoading(true);
    try {
      await onSubmit({
        title: form.title,
        description: form.description || undefined,
        course_id: form.course_id || undefined,
        due_date: new Date(form.due_date).toISOString(),
        priority: form.priority,
      });
      setForm({
        title: "",
        description: "",
        course_id: "",
        due_date: "",
        priority: "medium",
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
          <DialogTitle>添加作业</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">作业标题 *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="例如：数学作业第5章"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">作业描述</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="描述作业要求..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>关联课程</Label>
            <Select
              value={form.course_id}
              onValueChange={(v) => setForm({ ...form, course_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择课程（可选）" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">截止日期 *</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>优先级</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm({ ...form, priority: v as "low" | "medium" | "high" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
