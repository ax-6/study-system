"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, AlertCircle, BookOpen, Calendar, FileText } from "lucide-react";

export interface ActionCardData {
  type: "course" | "assignment" | "todo" | "grade" | "confirmation";
  title: string;
  description?: string;
  details?: Record<string, string>;
  actions?: Array<{
    label: string;
    variant?: "default" | "secondary" | "outline" | "destructive";
    action: string;
  }>;
}

interface ActionCardProps {
  data: ActionCardData;
  onAction?: (action: string) => void;
}

const iconMap = {
  course: BookOpen,
  assignment: FileText,
  todo: Calendar,
  grade: CheckCircle,
  confirmation: AlertCircle,
};

export function ActionCard({ data, onAction }: ActionCardProps) {
  const Icon = iconMap[data.type] || AlertCircle;

  return (
    <Card className="max-w-sm border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">{data.title}</CardTitle>
        </div>
        {data.description && (
          <p className="text-sm text-muted-foreground">{data.description}</p>
        )}
      </CardHeader>
      {data.details && (
        <CardContent className="pb-3">
          <div className="space-y-1.5 text-sm">
            {Object.entries(data.details).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground">{key}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
      {data.actions && data.actions.length > 0 && (
        <CardFooter className="gap-2 pt-0">
          {data.actions.map((action) => (
            <Button
              key={action.action}
              variant={action.variant || "default"}
              size="sm"
              onClick={() => onAction?.(action.action)}
            >
              {action.label}
            </Button>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}
