import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { cn, initials } from "@/lib/utils";

/**
 * Self-contained account dropdown.
 *
 * Built without a headless library so behaviour is fully deterministic across
 * themes and devices: controlled open state, outside-click + Escape to close,
 * a solid (non-translucent) panel, and a high z-index so it is never hidden
 * behind the sticky topbar or page content.
 */
export function ProfileMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const onLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/login");
  };

  const itemClass =
    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 [&_svg]:size-4 [&_svg]:text-muted-foreground";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-surface-2 focus-ring"
      >
        <Avatar>
          {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
          <AvatarFallback>{initials(user.full_name)}</AvatarFallback>
        </Avatar>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium leading-tight">{user.full_name}</p>
          <Badge variant="muted" className="mt-0.5 capitalize">
            {user.role}
          </Badge>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute right-0 z-[100] mt-2 w-60 overflow-hidden rounded-xl border border-border",
              "bg-surface text-foreground shadow-xl shadow-black/20 ring-1 ring-black/5",
            )}
          >
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-sm font-medium">{user.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="p-1.5">
              <button type="button" role="menuitem" className={itemClass} onClick={() => go("/profile")}>
                <UserIcon /> Profile
              </button>
              <button
                type="button"
                role="menuitem"
                className={itemClass}
                onClick={() => go("/settings")}
              >
                <Settings /> Settings
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                role="menuitem"
                onClick={onLogout}
                className={cn(itemClass, "text-danger hover:bg-danger/10 [&_svg]:text-danger")}
              >
                <LogOut /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
