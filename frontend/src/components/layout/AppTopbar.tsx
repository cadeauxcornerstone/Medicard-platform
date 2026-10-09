import {
  Menu,
  Search,
  Bell,
  Wifi,
  Plus,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { Role } from "./AppSidebar";

interface AppTopbarProps {
  currentRole?: Role;
  pageTitle?: string;
  pageSubtitle?: string;
  onToggleMobileMenu?: () => void;

  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };

  secondaryActionButton?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
}

export default function AppTopbar({
  currentRole = "Reception",
  pageTitle = "Dashboard",
  pageSubtitle,
  onToggleMobileMenu,
  actionButton,
  secondaryActionButton,
}: AppTopbarProps) {
  const navigate = useNavigate();

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      title: "MedCard Tap Identified",
      desc: "Patient Alice Mutoni (MC-9021-X) checked in at Reception.",
      time: "2 mins ago",
    },
    {
      id: 2,
      title: "Laboratory Order Ready",
      desc: "CBC & Lipid panel results uploaded for Patient Jean Rukundo.",
      time: "14 mins ago",
    },
    {
      id: 3,
      title: "Pharmacy Dispensed",
      desc: "Amoxicillin 500mg prescription fulfilled via MedCard Wallet.",
      time: "32 mins ago",
    },
  ];

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      navigate(
        `/patients?search=${encodeURIComponent(
          searchQuery.trim()
        )}`
      );
    }
  };

  return (
    <header className="h-16 md:h-20 bg-white border-b border-border flex items-center gap-4 px-4 md:px-6">

      <div className="flex items-center gap-4 flex-1">
        {onToggleMobileMenu && (
          <button
            type="button"
            className="md:hidden p-2 hover:bg-section-tint rounded-full transition-colors"
            onClick={onToggleMobileMenu}
            aria-label="Open sidebar menu"
          >
            <Menu size={22} />
          </button>
        )}

        <div className="hidden md:block">
          <h1 className="text-lg md:text-xl font-bold text-navy">
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <span className="text-xs text-body-text">
              {pageSubtitle}
            </span>
          )}
        </div>
      </div>

      <div className="hidden lg:block flex-1 max-w-md">
        <form
          className={`relative flex items-center border rounded-xl transition-colors ${
            searchFocused ? "border-teal ring-2 ring-teal/20" : "border-border"
          }`}
          onSubmit={handleSearchSubmit}
        >
          <Search
            size={18}
            className="absolute left-3 text-body-text"
          />

          <input
            type="text"
            placeholder="Search patient, MedCard UID, National ID..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            onFocus={() =>
              setSearchFocused(true)
            }
            onBlur={() =>
              setSearchFocused(false)
            }
            className="w-full pl-10 pr-10 py-2.5 bg-transparent text-navy placeholder:text-muted-text focus:outline-none text-sm"
            aria-label="Search patient records"
          />

          {searchQuery && (
            <button
              type="button"
              className="absolute right-3 p-1 hover:bg-section-tint rounded-full transition-colors"
              onClick={() =>
                setSearchQuery("")
              }
            >
              <X size={14} className="text-body-text" />
            </button>
          )}
        </form>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {actionButton && (
          <button
            type="button"
            className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors"
            onClick={actionButton.onClick}
          >
            {actionButton.icon || <Plus size={15} />}
            <span>{actionButton.label}</span>
          </button>
        )}

        {secondaryActionButton && (
          <button
            type="button"
            className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors"
            onClick={secondaryActionButton.onClick}
          >
            {secondaryActionButton.icon}
            <span>{secondaryActionButton.label}</span>
          </button>
        )}

        <button
          type="button"
          className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal border-2 border-teal rounded-full hover:bg-teal hover:text-white transition-colors"
          onClick={() => navigate("/nfc")}
          title="Open NFC Patient Tap Scanner"
        >
          <Wifi size={15} className="animate-pulse" />
          <span>Scan MedCard</span>
        </button>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-pale-cyan rounded-full">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
          <span className="text-xs font-semibold text-teal">
            Live Sync
          </span>
        </div>

        <div className="relative">
          <button
            type="button"
            className="relative p-2 hover:bg-section-tint rounded-full transition-colors"
            onClick={() =>
              setShowNotifications(
                !showNotifications
              )
            }
            aria-label="View notifications"
          >
            <Bell size={18} className="text-body-text" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-lg overflow-hidden z-50">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <strong className="text-navy">Activity Feed</strong>
                <span className="text-xs font-semibold text-teal">3 new</span>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 border-b border-border hover:bg-section-tint transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-pale-cyan rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={14} className="text-teal" />
                      </div>
                      <div className="flex-1">
                        <strong className="text-navy text-sm">{n.title}</strong>
                        <p className="text-body-text text-xs">{n.desc}</p>
                        <small className="text-muted-text text-xs">{n.time}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-border">
                <button
                  type="button"
                  onClick={() =>
                    setShowNotifications(false)
                  }
                  className="w-full text-sm font-semibold text-navy hover:text-teal transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className="flex items-center gap-3 p-2 hover:bg-section-tint rounded-xl cursor-pointer transition-colors"
          onClick={() =>
            navigate("/settings")
          }
          title="Facility settings"
        >
          <div className="w-9 h-9 bg-pale-cyan rounded-full flex items-center justify-center font-bold text-navy text-sm">
            {currentRole
              .charAt(0)
              .toUpperCase()}
          </div>
          <div className="hidden md:block">
            <strong className="text-navy text-sm block">{currentRole} Staff</strong>
            <small className="text-body-text text-xs">KFH Kigali</small>
          </div>
        </div>
      </div>
    </header>
  );
}
