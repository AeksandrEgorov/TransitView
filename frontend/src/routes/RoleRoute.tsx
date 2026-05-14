// This route guard checks if the logged-in user has one of the allowed roles.
// It is used for editor/admin dashboard sections that normal users should not open.

import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/auth";

interface Props {
  roles: UserRole[];
}

function RoleRoute({ roles }: Props) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
