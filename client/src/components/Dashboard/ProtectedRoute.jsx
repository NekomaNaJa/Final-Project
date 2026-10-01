import { Navigate } from "react-router-dom";
import { getTokenPayload } from "../../utils/auth";

const ProtectedRoute = ({ children }) => {
  const payload = getTokenPayload();

  if (!payload) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
export default ProtectedRoute;
