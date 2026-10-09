import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
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
      path: "/nfc/scan",
      icon: Wifi,
      badge: "Live",
      badgeClass: "animate-pulse",
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
    localStorage.removeItem("medcard_authenticated");
    localStorage.removeItem("medcard_auth_token");
    localStorage.removeItem("medcard_user_data");
    localStorage.removeItem("medcard_current_facility");
    navigate("/login");
  };

  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-navy text-white flex flex-col transition-transform duration-300 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        aria-label="Application navigation"
      >
        <div className="p-4 border-b border-white/10">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleNavigate("/dashboard")}
          >
            <img
              src="/medcard-logo.svg"
              alt="MedCard"
              className="h-10 w-auto"
            />
            <div>
              <strong className="text-lg">MedCard</strong>
              <small className="block text-xs text-soft-text-on-navy">Healthcare Technology</small>
            </div>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-4 border-b border-white/10">
          <div
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
          >
            <div className="w-10 h-10 bg-teal rounded-full flex items-center justify-center font-bold">
              {currentRole.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold text-teal block">WORKSPACE ROLE</span>
              <strong className="text-sm">{currentRole}</strong>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform ${roleDropdownOpen ? "rotate-180" : ""}`}
            />
          </div>

          {roleDropdownOpen && (
            <div className="mt-2 p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-soft-text-on-navy mb-3">
                <ArrowRightLeft size={11} />
                <span>Switch Workspace View</span>
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    currentRole === r
                      ? "bg-teal text-navy"
                      : "hover:bg-white/10"
                  }`}
                  onClick={() => handleRoleSelect(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <span className="text-xs font-semibold text-soft-text-on-navy block mb-3">CLINICAL WORKSPACES</span>

          <nav className="space-y-1">
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-teal text-navy"
                      : "hover:bg-white/10"
                  }`}
                  onClick={() => handleNavigate(item.path)}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isActive
                          ? "bg-navy text-white"
                          : "bg-pale-cyan text-teal"
                      } ${item.badgeClass || ""}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 space-y-1">
          <button
            type="button"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              location.pathname === "/settings"
                ? "bg-teal text-navy"
                : "hover:bg-white/10"
            }`}
            onClick={() => handleNavigate("/settings")}
          >
            <Settings size={18} />
            <span>Settings & Diagnostics</span>
          </button>

          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors text-red-300"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-2 text-xs text-soft-text-on-navy">
            <ShieldCheck size={14} />
            <span>King Faisal Hospital • Kigali</span>
          </div>
        </div>
      </aside>
    </>
  );
}
