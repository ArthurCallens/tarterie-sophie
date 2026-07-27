import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-cacao-soft">
        Bezig met laden…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
