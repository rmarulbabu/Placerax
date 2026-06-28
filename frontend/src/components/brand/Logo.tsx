import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-glow">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
          <path
            d="M5 19V5.5C5 4.67 5.67 4 6.5 4H13a4.5 4.5 0 0 1 0 9H9"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {showText && (
        <span className="font-display text-lg font-bold tracking-tight">Placera</span>
      )}
    </div>
  );
}
