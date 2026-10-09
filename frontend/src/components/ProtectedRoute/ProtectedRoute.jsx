import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  allowedRoles = null,
}) => {
  const { usuario } = useContext(AuthContext);

  if (!usuario) {
    return <Navigate to="/microcredito/login" replace />;
  }

  if (requireAdmin && usuario.tipo !== "admin") {
    return <Navigate to="/imperial/dashboard/home" replace />;
  }

  if (
    Array.isArray(allowedRoles) &&
    !allowedRoles.includes(String(usuario.tipo || "").toLowerCase())
  ) {
    return <Navigate to="/imperial/dashboard/home" replace />;
  }

  return children;
};

export default ProtectedRoute;

