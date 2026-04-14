import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";

/**
 * Route-level auth guard for /admin/* routes (H-3 fix).
 * Prevents lazy-loaded admin chunks from being parsed by unauthorized users.
 */
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoading, user } = useAdminAuth();

  // Still resolving auth state — show nothing (prevents flash redirect)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No session at all — redirect to login
  if (!user) {
    return <Navigate to="/diamony-secure-admin" replace />;
  }

  // Logged in but not admin — redirect to login with message
  if (!isAdmin) {
    return <Navigate to="/diamony-secure-admin" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
