import { Navigate } from "react-router-dom";
    return <Navigate to="/login" replace />;
  }

  return children;
};
export default ProtectedRoute;
