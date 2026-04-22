import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import LoginPage from "./pages/LoginPage";
import ProjectsPage from "./pages/ProjectsPage";
import TaskBoardPage from "./pages/TaskBoardPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";
import { useAuthStore } from "./store/auth.store";
import { connectSocket } from "./services/socket.service";

function App() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.token) {
      connectSocket(user.token);
    }
  }, [isAuthenticated, user?.token]);

  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" closeButton />
      <Routes>
        {/* Root — redirect based on auth state */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/projects" : "/login"} replace />}
        />

        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected */}
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <TaskBoardPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
