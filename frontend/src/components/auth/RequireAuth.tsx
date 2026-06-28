import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { homeForRole } from "@/config/navigation";
import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/types";

function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full w-1/2 animate-[shimmer_1.2s_infinite] bg-gradient-brand" />
        </div>
      </div>
    </div>
  );
}

export function RequireAuth({ roles }: { roles?: Role[] }) {
  const { user, isAuthenticated, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) return <FullScreenLoader />;
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  if (user.role === "student" && !user.onboarding_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}
