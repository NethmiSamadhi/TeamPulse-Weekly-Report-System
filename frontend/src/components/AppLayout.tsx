import { Activity, FileClock, FilePlus2, Files, FolderKanban, LayoutDashboard, LogOut, Menu, UserCog, Users, X, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

type NavigationItem = { label: string; path: string; icon: LucideIcon; roles?: UserRole[] };

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "New Weekly Report", path: "/reports/new", icon: FilePlus2, roles: ["TEAM_MEMBER"] },
  { label: "My Report History", path: "/reports", icon: FileClock, roles: ["TEAM_MEMBER"] },
  { label: "Team Reports", path: "/reports", icon: Files, roles: ["MANAGER", "ADMIN"] },
  { label: "Team Members", path: "/team", icon: Users, roles: ["MANAGER", "ADMIN"] },
  { label: "Projects", path: "/projects", icon: FolderKanban, roles: ["MANAGER", "ADMIN"] },
  { label: "User Management", path: "/users", icon: UserCog, roles: ["ADMIN"] },
];

function roleLabel(role?: UserRole) {
  if (role === "TEAM_MEMBER") return "Team Member";
  if (role === "MANAGER") return "Manager";
  return "Administrator";
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const visibleNavigation = navigationItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className={sidebarOpen ? "sidebar sidebar-open" : "sidebar"}>
        <div className="sidebar-brand">
          <div className="brand-mark"><span>TP</span></div>
          <div><strong>TeamPulse</strong><span>Weekly Intelligence</span></div>
          <button type="button" className="mobile-close-button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <div className="workspace-label"><Activity size={15} /><span>Team workspace</span></div>
        <nav className="sidebar-navigation">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={`${item.path}-${item.label}`} to={item.path} end={item.path === "/dashboard"} onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? "navigation-link active" : "navigation-link"}>
                <Icon size={19} /><span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{user?.fullName.split(" ").map((name) => name[0]).slice(0, 2).join("")}</div>
          <div className="sidebar-user-details"><strong>{user?.fullName}</strong><span>{roleLabel(user?.role)}</span></div>
          <button type="button" className="sidebar-logout" onClick={() => void handleLogout()} aria-label="Sign out"><LogOut size={18} /></button>
        </div>
      </aside>
      {sidebarOpen && <button type="button" className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <div className="app-main">
        <header className="mobile-header">
          <button type="button" className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
          <strong>TeamPulse</strong>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
