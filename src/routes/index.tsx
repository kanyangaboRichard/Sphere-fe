import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import DashboardLayout from "../components/layouts/Dashboardlayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ArticlesPage from "../pages/articles/ArticlesPage";

const isAuthenticated = () => !!localStorage.getItem("sphere_token");

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="p-6">
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">🚧</div>
        <h2 className="font-condensed text-2xl font-bold text-gray-800 tracking-wide mb-2">
          {title}
        </h2>
        <p className="text-sm text-gray-400">This page is being built.</p>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        {/* Content */}
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="articles/new" element={<ComingSoon title="New Article" />} />
        <Route path="articles/:id" element={<ComingSoon title="Edit Article" />} />
        <Route path="categories" element={<ComingSoon title="Categories" />} />
        <Route path="authors" element={<ComingSoon title="Authors" />} />
        <Route path="media" element={<ComingSoon title="Media Library" />} />
        <Route path="videos" element={<ComingSoon title="Videos" />} />

        {/* Website */}
        <Route path="theme" element={<ComingSoon title="Theme & Appearance" />} />
        <Route path="ticker" element={<ComingSoon title="Breaking Ticker" />} />
        <Route path="navigation" element={<ComingSoon title="Navigation Links" />} />

        {/* Settings */}
        <Route path="roles" element={<ComingSoon title="Roles & Permissions" />} />
        <Route path="audit-logs" element={<ComingSoon title="Audit Logs" />} />
        <Route path="settings" element={<ComingSoon title="Settings" />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}