import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Users,
  Wifi,
  CalendarDays,
  FileText,
  FlaskConical,
  Pill,
  CreditCard,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ArrowRightLeft,
  ShieldCheck,
} from "lucide-react";

export type Role =
  | "Reception"
  | "Doctor"
  | "Nurse"
  | "Laboratory"
  | "Pharmacy"
  | "Cashier";

interface AppSidebarProps {
  currentRole?: Role;
  onRoleChange?: (role: Role) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const CURRENT_ROLE_KEY = "medcard_current_role";

export default function AppSidebar({
  currentRole = "Reception",
  onRoleChange,
  isOpenMobile = false,
  onCloseMobile,
}: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles: Role[] = [
    "Reception",
    "Doctor",
    "Nurse",
    "Laboratory",
    "Pharmacy",
    "Cashier",
  ];

  const handleRoleSelect = (role: Role) => {
    localStorage.setItem(CURRENT_ROLE_KEY, role);
    if (onRoleChange) {
      onRoleChange(role);
    }
    setRoleDropdownOpen(false);
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      label: "Patients",
      path: "/patients",
      icon: Users,
      badge: "12 Today",
    },
    {
      label: "NFC Scanner",
      path: "/nfc",
      icon: Wifi,
      badge: "Live",
      badgeClass: "badge-pulse",
    },
    {
      label: "Appointments",
      path: "/appointments",
      icon: CalendarDays,
      badge: "8 Queue",
    },
    {
      label: "Medical Records",
      path: "/medical-records",
      icon: FileText,
      badge: undefined,
    },
    {
      label: "Laboratory",
      path: "/laboratory",
      icon: FlaskConical,
      badge: "4 Pending",
    },
    {
      label: "Pharmacy",
      path: "/pharmacy",
      icon: Pill,
      badge: undefined,
    },
    {
      label: "Payments",
      path: "/payment",
      icon: CreditCard,
      badge: undefined,
    },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(CURRENT_ROLE_KEY);
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${isOpenMobile ? "mobile-open" : ""}`}
        aria-label="Application navigation"
      >
        {/* Brand Header */}
        <div className="sidebar-brand-wrapper">
          <div
            className="sidebar-brand cursor-pointer"
            onClick={() => handleNavigate("/dashboard")}
          >
            <div className="brand-mark">
              <Activity size={22} strokeWidth={2.4} />
            </div>
            <div className="brand-text">
              <strong>
                Med<span>Card</span>
              </strong>
              <small>Digital Health Grid</small>
            </div>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Role Selector Badge (Interactive for Demo Presentations) */}
        <div className="sidebar-role-selector">
          <div
            className="role-selector-header"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
          >
            <div className="role-avatar-mini">
              {currentRole.charAt(0).toUpperCase()}
            </div>
            <div className="role-meta">
              <span className="role-tag">WORKSPACE ROLE</span>
              <strong className="role-name">{currentRole}</strong>
            </div>
            <ChevronDown
              size={15}
              className={`role-chevron ${roleDropdownOpen ? "open" : ""}`}
            />
          </div>

          {roleDropdownOpen && (
            <div className="role-dropdown-menu">
              <div className="dropdown-label">
                <ArrowRightLeft size={11} /> Switch Workspace View
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`role-dropdown-item ${
                    currentRole === r ? "active" : ""
                  }`}
                  onClick={() => handleRoleSelect(r)}
                >
                  <span className="role-item-dot" />
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <div className="sidebar-nav-container">
          <span className="sidebar-nav-heading">CLINICAL WORKSPACES</span>

          <nav className="sidebar-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/dashboard" &&
                  location.pathname.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  type="button"
                  className={`sidebar-nav-btn ${isActive ? "active" : ""}`}
                  onClick={() => handleNavigate(item.path)}
                >
                  <div className="nav-btn-content">
                    <Icon size={19} className="nav-icon" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`nav-badge ${item.badgeClass || ""}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Navigation */}
        <div className="sidebar-footer-nav">
          <button
            type="button"
            className={`sidebar-nav-btn ${
              location.pathname === "/settings" ? "active" : ""
            }`}
            onClick={() => handleNavigate("/settings")}
          >
            <div className="nav-btn-content">
              <Settings size={18} className="nav-icon" />
              <span>Settings & Diagnostics</span>
            </div>
          </button>

          <button
            type="button"
            className="sidebar-nav-btn logout"
            onClick={handleLogout}
          >
            <div className="nav-btn-content">
              <LogOut size={18} className="nav-icon" />
              <span>Sign Out</span>
            </div>
          </button>

          <div className="sidebar-facility-tag">
            <ShieldCheck size={14} />
            <span>King Faisal Hospital • Kigali</span>
          </div>
        </div>
      </aside>
    </>
  );
}
