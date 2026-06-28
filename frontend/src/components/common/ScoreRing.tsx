import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
}

export function ScoreRing({
  value,
  size = 120,
  stroke = 10,
  label,
  className,
}: ScoreRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  const tone =
    clamped >= 75 ? "hsl(var(--success))" : clamped >= 50 ? "hsl(var(--primary))" : "hsl(var(--warning))";

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--surface-2))"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-mono text-2xl font-bold tabular-nums">{Math.round(clamped)}</div>
          {label && <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>}
        </div>
      </div>
    </div>
  );
}
