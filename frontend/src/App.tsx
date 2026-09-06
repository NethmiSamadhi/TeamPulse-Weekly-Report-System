import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NewReportPage } from "./pages/NewReportPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ReportDetailPage } from "./pages/ReportDetailPage";
import { ReportsPage } from "./pages/ReportsPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/reports"
          element={<ReportsPage />}
        />

        <Route
          path="/reports/new"
          element={
            <ProtectedRoute
              allowedRoles={["TEAM_MEMBER"]}
            >
              <NewReportPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/:reportId/edit"
          element={
            <ProtectedRoute
              allowedRoles={["TEAM_MEMBER"]}
            >
              <NewReportPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/:reportId"
          element={<ReportDetailPage />}
        />

        <Route
          path="/team"
          element={
            <ProtectedRoute
              allowedRoles={["MANAGER", "ADMIN"]}
            >
              <PlaceholderPage
                eyebrow="Team management"
                title="Team members"
                description="Manage team members and monitor reporting activity."
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute
              allowedRoles={["MANAGER", "ADMIN"]}
            >
              <PlaceholderPage
                eyebrow="Project management"
                title="Projects"
                description="Create and manage TeamPulse projects."
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
            >
              <PlaceholderPage
                eyebrow="Administration"
                title="Users"
                description="Manage system users and access roles."
              />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}