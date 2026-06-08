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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { getCourses } from "@/app/actions/courses";

interface GradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    course_id: string;
    assignment_name?: string;
    score: number;
    max_score: number;
    weight?: number;
    type?: "midterm" | "final" | "assignment" | "quiz" | "other";
  }) => Promise<void>;
}

export function GradeDialog({ open, onOpenChange, onSubmit }: GradeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    course_id: "",
    assignment_name: "",
    score: "",
    max_score: "100",
    weight: "100",
    type: "assignment" as string,
  });

  useEffect(() => {
    if (open) {
      getCourses().then((data) => setCourses(data || []));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_id || !form.score) return;
    setLoading(true);
    try {
      await onSubmit({
        course_id: form.course_id,
        assignment_name: form.assignment_name || undefined,
        score: parseFloat(form.score),
        max_score: parseFloat(form.max_score),
        weight: parseFloat(form.weight) || 100,
        type: form.type as "midterm" | "final" | "assignment" | "quiz" | "other",
      });
      setForm({
        course_id: "",
        assignment_name: "",
        score: "",
        max_score: "100",
        weight: "100",
        type: "assignment",
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
          <DialogTitle>添加成绩</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>课程 *</Label>
            <Select
              value={form.course_id}
              onValueChange={(v) => setForm({ ...form, course_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择课程" />
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
          <div className="space-y-2">
            <Label htmlFor="assignment_name">作业/考试名称</Label>
            <Input
              id="assignment_name"
              value={form.assignment_name}
              onChange={(e) => setForm({ ...form, assignment_name: e.target.value })}
              placeholder="例如：期中考试"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="score">得分 *</Label>
              <Input
                id="score"
                type="number"
                value={form.score}
                onChange={(e) => setForm({ ...form, score: e.target.value })}
                placeholder="85"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_score">满分</Label>
              <Input
                id="max_score"
                type="number"
                value={form.max_score}
                onChange={(e) => setForm({ ...form, max_score: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">权重(%)</Label>
              <Input
                id="weight"
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>类型</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assignment">作业</SelectItem>
                <SelectItem value="quiz">测验</SelectItem>
                <SelectItem value="midterm">期中考试</SelectItem>
                <SelectItem value="final">期末考试</SelectItem>
                <SelectItem value="other">其他</SelectItem>
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
