import { useState, useEffect, type ReactNode } from "react";
import AppSidebar, { type Role, CURRENT_ROLE_KEY } from "./AppSidebar";
import AppTopbar from "./AppTopbar";

interface AppLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
}

export default function AppLayout({
  children,
  pageTitle = "Dashboard",
  pageSubtitle,
  actionButton,
}: AppLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    const storedRole = localStorage.getItem(CURRENT_ROLE_KEY);
    if (
      storedRole === "Reception" ||
      storedRole === "Doctor" ||
      storedRole === "Nurse" ||
      storedRole === "Laboratory" ||
      storedRole === "Pharmacy" ||
      storedRole === "Cashier"
    ) {
      return storedRole;
    }
    return "Reception";
  });

  useEffect(() => {
    const syncRole = () => {
      const stored = localStorage.getItem(CURRENT_ROLE_KEY);
      if (stored && stored !== currentRole) {
        setCurrentRole(stored as Role);
      }
    };
    window.addEventListener("storage", syncRole);
    return () => window.removeEventListener("storage", syncRole);
  }, [currentRole]);

  const handleRoleChange = (newRole: Role) => {
    setCurrentRole(newRole);
  };

  return (
    <div className="app-dashboard-layout">
      {/* Sidebar Navigation */}
      <AppSidebar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Column */}
      <div className="app-main-area">
        {/* Sticky Topbar */}
        <AppTopbar
          currentRole={currentRole}
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          onToggleMobileMenu={() => setMobileSidebarOpen(true)}
          actionButton={actionButton}
        />

        {/* Scrollable Page Content Container */}
        <main className="app-main-scrollable">
          <div className="app-page-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
