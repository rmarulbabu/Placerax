import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/api/queryClient";
import { useThemeStore } from "@/store/themeStore";

export function Providers({ children }: { children: ReactNode }) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster
          theme={resolvedTheme}
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!glass !rounded-xl !border-white/10 !text-foreground",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
