import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatWidgetProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  delta?: number;
  hint?: string;
  index?: number;
}

export function StatWidget({ label, value, icon: Icon, delta, hint, index = 0 }: StatWidgetProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="p-5 transition-colors hover:bg-surface-2/40">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-display text-3xl font-bold tabular-nums">{value}</p>
          </div>
          {Icon && (
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
          )}
        </div>
        {(delta !== undefined || hint) && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {delta !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                  positive ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
                )}
              >
                {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {Math.abs(delta)}%
              </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
