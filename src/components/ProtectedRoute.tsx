import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AuthLoadingScreen from "@/components/AuthLoadingScreen";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
