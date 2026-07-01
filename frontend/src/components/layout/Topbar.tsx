import { useNavigate } from "react-router-dom";
import { Bot, Search } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileMenu } from "./ProfileMenu";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-background/70 px-4 backdrop-blur-xl sm:px-6">
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search jobs, companies, candidates…"
          className="h-10 w-full rounded-lg border border-input bg-surface-2/50 pl-9 pr-16 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {user.role === "student" && (
          <Button
            variant="secondary"
            size="icon"
            className="hidden sm:inline-flex"
            title="AI Assistant"
            onClick={() => navigate("/student/assistant")}
          >
            <Bot className="size-[18px]" />
          </Button>
        )}
        <ThemeToggle />
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
