import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ReportDetailPage } from "./pages/ReportDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reports/new" element={<ProtectedRoute allowedRoles={["TEAM_MEMBER"]}><PlaceholderPage eyebrow="Weekly reporting" title="Create Weekly Report" description="Capture completed work, future plans, blockers and achievements." /></ProtectedRoute>} />
        <Route path="/reports"element={<ReportsPage />}/>
        <Route path="reports/:reportId" element={<ReportDetailPage />}/>
        <Route path="/reports/:reportId" element={<PlaceholderPage eyebrow="Report details" title="Weekly Report Detail" description="Review report content, versions and feedback." />} />
        <Route path="/team" element={<ProtectedRoute allowedRoles={["MANAGER", "ADMIN"]}><PlaceholderPage eyebrow="People" title="Team Members" description="Review individual reporting history and performance insights." /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute allowedRoles={["MANAGER", "ADMIN"]}><PlaceholderPage eyebrow="Administration" title="Project Management" description="Create, update and archive report categories." /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute allowedRoles={["ADMIN"]}><PlaceholderPage eyebrow="Administration" title="User Management" description="Manage accounts, access and assigned roles." /></ProtectedRoute>} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
