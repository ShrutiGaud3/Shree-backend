import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Loader } from "./ui.jsx";

export const Protected = () => {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
};

export const AdminOnly = () => {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
};
