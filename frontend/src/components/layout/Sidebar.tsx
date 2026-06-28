import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { navForRole } from "@/config/navigation";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  if (!user) return null;

  const items = navForRole(user.role);
  const groups = [...new Set(items.map((i) => i.group ?? "Menu"))];

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 76 : 256 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/[0.06] bg-surface/40 backdrop-blur-xl lg:flex"
    >
      <div className="flex h-16 items-center justify-between px-4">
        {sidebarCollapsed ? <Logo showText={false} /> : <Logo />}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 text-muted-foreground"
        >
          <ChevronLeft className={cn("transition-transform", sidebarCollapsed && "rotate-180")} />
        </Button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group} className="space-y-1">
            {!sidebarCollapsed && (
              <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {group}
              </p>
            )}
            {items
              .filter((i) => (i.group ?? "Menu") === group)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to.split("?")[0].split("/").length <= 2}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-gradient-brand/90 text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                      sidebarCollapsed && "justify-center px-0",
                    )
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className="size-[18px] shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
          </div>
        ))}
      </nav>

      {!sidebarCollapsed && (
        <div className="m-3 rounded-xl glass-2 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Placera Pro</p>
          <p className="mt-0.5">Unlock advanced analytics & AI tools.</p>
        </div>
      )}
    </motion.aside>
  );
}
