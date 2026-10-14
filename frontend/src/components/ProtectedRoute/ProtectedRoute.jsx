import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { encerrarSessaoExpirada, tokenEstaValido } from "../../utils/sessaoToken";

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  allowedRoles = null,
}) => {
  const { usuario } = useContext(AuthContext);

  if (!usuario || !tokenEstaValido(usuario.token || localStorage.getItem("token"))) {
    encerrarSessaoExpirada();
    return <Navigate to="/microcredito/login" replace />;
  }

  if (requireAdmin && usuario.tipo !== "admin") {
    return <Navigate to="/microcredito/dashboard/home" replace />;
  }

  if (
    Array.isArray(allowedRoles) &&
    !allowedRoles.includes(String(usuario.tipo || "").toLowerCase())
  ) {
    return <Navigate to="/microcredito/dashboard/home" replace />;
  }

  return children;
};

export default ProtectedRoute;

