import {
  Menu,
  Search,
  Bell,
  Wifi,
  Plus,
  X,
  CheckCircle2,
  Wallet,
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
}: AppTopbarProps) {
  const navigate = useNavigate();

  const [searchFocused, setSearchFocused] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [showNotifications, setShowNotifications] =
    useState(false);

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

  const handleSearchSubmit = (
    e: FormEvent
  ) => {
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
    <header className="app-topbar">

      {/* =====================================================
          LEFT SIDE
      ===================================================== */}

      <div className="topbar-left">

        {onToggleMobileMenu && (
          <button
            type="button"
            className="topbar-hamburger-btn"
            onClick={onToggleMobileMenu}
            aria-label="Open sidebar menu"
          >
            <Menu size={22} />
          </button>
        )}

        <div className="topbar-title-block">

          <div className="topbar-eyebrow">
            <span className="eyebrow-dot" />
            <span>
              {currentRole} Workspace
            </span>
          </div>

          <h1 className="topbar-page-title">
            {pageTitle}
          </h1>

          {pageSubtitle && (
            <span className="topbar-page-subtitle">
              {pageSubtitle}
            </span>
          )}

        </div>
      </div>


      {/* =====================================================
          CENTER SEARCH
      ===================================================== */}

      <div className="topbar-center">

        <form
          className={`topbar-search-form ${
            searchFocused ? "focused" : ""
          }`}
          onSubmit={handleSearchSubmit}
        >

          <Search
            size={16}
            className="search-icon"
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
            aria-label="Search patient records"
          />

          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() =>
                setSearchQuery("")
              }
            >
              <X size={14} />
            </button>
          )}

        </form>

      </div>


      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <div className="topbar-right">

        {/* -------------------------------------------------
            PRIMARY PAGE ACTION
        ------------------------------------------------- */}

        {actionButton && (
          <button
            type="button"
            className="topbar-primary-action-btn"
            onClick={actionButton.onClick}
          >
            {actionButton.icon || (
              <Plus size={15} />
            )}

            <span>
              {actionButton.label}
            </span>
          </button>
        )}


        {/* -------------------------------------------------
            RECEPTIONIST ONLY — TOP UP WALLET
            This does NOT appear in the sidebar.
        ------------------------------------------------- */}

        {currentRole === "Reception" && (
          <button
            type="button"
            className="topbar-primary-action-btn"
            onClick={() => navigate("/top-up")}
            title="Top up patient MedCard wallet"
          >
            <Wallet size={15} />

            <span>
              Top Up Wallet
            </span>
          </button>
        )}


        {/* -------------------------------------------------
            NFC SCANNER
        ------------------------------------------------- */}

        <button
          type="button"
          className="topbar-nfc-btn"
          onClick={() => navigate("/nfc")}
          title="Open NFC Patient Tap Scanner"
        >
          <Wifi
            size={15}
            className="nfc-pulse-icon"
          />

          <span className="nfc-btn-text">
            Scan MedCard
          </span>
        </button>


        {/* -------------------------------------------------
            LIVE SYSTEM STATUS
        ------------------------------------------------- */}

        <div className="topbar-status-pill">

          <span className="live-indicator-dot" />

          <span className="status-text">
            Live Sync
          </span>

        </div>


        {/* -------------------------------------------------
            NOTIFICATIONS
        ------------------------------------------------- */}

        <div className="topbar-notif-wrapper">

          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() =>
              setShowNotifications(
                !showNotifications
              )
            }
            aria-label="View notifications"
          >
            <Bell size={17} />

            <span className="notif-badge">
              3
            </span>
          </button>


          {showNotifications && (
            <div className="notifications-dropdown">

              <div className="notif-header">

                <strong>
                  Activity Feed
                </strong>

                <span className="notif-count">
                  3 new
                </span>

              </div>


              <div className="notif-list">

                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="notif-item"
                  >

                    <div className="notif-item-icon">
                      <CheckCircle2 size={15} />
                    </div>

                    <div className="notif-item-body">

                      <strong>
                        {n.title}
                      </strong>

                      <p>
                        {n.desc}
                      </p>

                      <small>
                        {n.time}
                      </small>

                    </div>

                  </div>
                ))}

              </div>


              <div className="notif-footer">

                <button
                  type="button"
                  onClick={() =>
                    setShowNotifications(false)
                  }
                >
                  Close
                </button>

              </div>

            </div>
          )}

        </div>


        {/* -------------------------------------------------
            USER PROFILE
        ------------------------------------------------- */}

        <div
          className="topbar-user-profile"
          onClick={() =>
            navigate("/settings")
          }
          title="Facility settings"
        >

          <div className="topbar-avatar">
            {currentRole
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="topbar-user-info">

            <strong className="user-name">
              {currentRole} Staff
            </strong>

            <small className="user-facility">
              KFH Kigali
            </small>

          </div>

        </div>

      </div>

    </header>
  );
}