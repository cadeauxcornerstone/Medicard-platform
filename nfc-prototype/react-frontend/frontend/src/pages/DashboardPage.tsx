import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Wifi,
  CalendarDays,
  FlaskConical,
  Pill,
  ArrowRight,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";
import PatientIdentificationPanel from "../components/nfc/PatientIdentificationPanel";
import { socket } from "../services/socket";
import { type Role, CURRENT_ROLE_KEY } from "../components/layout/AppSidebar";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [currentRole, setCurrentRole] = useState<Role>(() => {
    const stored = localStorage.getItem(CURRENT_ROLE_KEY);
    if (
      stored === "Reception" ||
      stored === "Doctor" ||
      stored === "Nurse" ||
      stored === "Laboratory" ||
      stored === "Pharmacy" ||
      stored === "Cashier"
    ) {
      return stored as Role;
    }
    return "Reception";
  });

  // Keep role synced
  useEffect(() => {
    const stored = localStorage.getItem(CURRENT_ROLE_KEY);
    if (stored) {
      setCurrentRole(stored as Role);
    }
  }, []);

  // Real-time socket events
  useEffect(() => {
    const handlePatientIdentified = () => {
      // Handled in sub-panel
    };

    const handleIdentificationFailed = () => {
      // Handled in sub-panel
    };

    socket.on("patient:identified", handlePatientIdentified);
    socket.on("card:identification-failed", handleIdentificationFailed);

    return () => {
      socket.off("patient:identified", handlePatientIdentified);
      socket.off("card:identification-failed", handleIdentificationFailed);
    };
  }, []);

  return (
    <AppLayout
      pageTitle={`${currentRole} Command Center`}
      pageSubtitle="Connected Healthcare Operations • Rwanda National Health Grid"
      actionButton={
        currentRole === "Reception"
          ? {
              label: "Register New Patient",
              onClick: () => navigate("/register-patient"),
              icon: <UserRoundPlus size={16} />,
            }
          : undefined
      }
    >
      <div className="dashboard-content-wrapper">
        {/* Metric Cards Top Row */}
        <div className="analytics-metrics-grid">
          <div
            className="metric-stat-card clickable"
            onClick={() => navigate("/patients")}
          >
            <div className="metric-data">
              <span className="metric-label">Registered Patients</span>
              <strong className="metric-value">4,892</strong>
              <small className="metric-trend positive">+14 enrolled today</small>
            </div>
          </div>

          <div
            className="metric-stat-card clickable"
            onClick={() => navigate("/nfc")}
          >
            <div className="metric-data">
              <span className="metric-label">MedCard NFC Scans</span>
              <strong className="metric-value">128</strong>
              <small className="metric-trend highlight">Instant Tap ID</small>
            </div>
          </div>

          <div
            className="metric-stat-card clickable"
            onClick={() => navigate("/appointments")}
          >
            <div className="metric-data">
              <span className="metric-label">Today's Appointments</span>
              <strong className="metric-value">46</strong>
              <small className="metric-trend positive">8 currently waiting</small>
            </div>
          </div>

          <div
            className="metric-stat-card clickable"
            onClick={() => navigate("/payment")}
          >
            <div className="metric-data">
              <span className="metric-label">Settled Claims</span>
              <strong className="metric-value">RWF 4.2M</strong>
              <small className="metric-trend positive">100% digital sync</small>
            </div>
          </div>
        </div>

        {/* Real-time Patient Identification Banner (Preserved Core Functionality) */}
        <div className="dashboard-identification-section">
          <PatientIdentificationPanel />
        </div>

        {/* Fast Action Quick-Access Tiles */}
        <div className="dashboard-quick-actions-bar">
          <span className="quick-actions-title">Clinical Stations Quick-Access:</span>
          <div className="quick-actions-grid">
            <button
              type="button"
              className="quick-action-tile"
              onClick={() => navigate("/patients")}
            >
              <div className="tile-icon green">
                <Users size={16} />
              </div>
              <div className="tile-text">
                <strong>Patient Registry</strong>
                <small>4,892 active files</small>
              </div>
              <ArrowRight size={14} className="tile-arrow" />
            </button>

            <button
              type="button"
              className="quick-action-tile"
              onClick={() => navigate("/appointments")}
            >
              <div className="tile-icon green">
                <CalendarDays size={16} />
              </div>
              <div className="tile-text">
                <strong>Clinic Queue</strong>
                <small>8 waiting in lobby</small>
              </div>
              <ArrowRight size={14} className="tile-arrow" />
            </button>

            <button
              type="button"
              className="quick-action-tile"
              onClick={() => navigate("/laboratory")}
            >
              <div className="tile-icon green">
                <FlaskConical size={16} />
              </div>
              <div className="tile-text">
                <strong>Laboratory Portal</strong>
                <small>4 orders pending</small>
              </div>
              <ArrowRight size={14} className="tile-arrow" />
            </button>

            <button
              type="button"
              className="quick-action-tile"
              onClick={() => navigate("/pharmacy")}
            >
              <div className="tile-icon green">
                <Pill size={16} />
              </div>
              <div className="tile-text">
                <strong>E-Pharmacy</strong>
                <small>Rx dispensing station</small>
              </div>
              <ArrowRight size={14} className="tile-arrow" />
            </button>
          </div>
        </div>

        {/* 2-Column Live Panels: Active Lobby Queue & Recent NFC Card Feed */}
        <div className="dashboard-two-panel-grid">
          {/* Panel 1: Live Patient Queue */}
          <div className="dashboard-panel-card">
            <div className="panel-card-header">
              <div className="panel-header-title">
                <span className="eyebrow">CLINIC DISPATCH</span>
                <h3>Live Lobby Queue</h3>
              </div>
              <button
                type="button"
                className="action-pill-btn secondary small"
                onClick={() => navigate("/appointments")}
              >
                <span>View Full Schedule</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="queue-list-container">
              <div
                className="queue-card-item"
                onClick={() =>
                  navigate(
                    "/patients/ac844b2b-cc1b-45a4-9404-e059fdd6df0b"
                  )
                }
              >
                <div className="queue-patient-avatar">AM</div>
                <div className="queue-item-body">
                  <div className="queue-patient-top">
                    <strong>Alice Mutoni</strong>
                    <span className="queue-status in-consult">
                      In Consultation
                    </span>
                  </div>
                  <div className="queue-sub">
                    <span>MC-2026-0811</span>
                    <span>•</span>
                    <span>General OPD (Dr. Solange)</span>
                    <span>•</span>
                    <span>09:15 AM</span>
                  </div>
                </div>
              </div>

              <div
                className="queue-card-item"
                onClick={() => navigate("/patients/patient-002")}
              >
                <div className="queue-patient-avatar">JR</div>
                <div className="queue-item-body">
                  <div className="queue-patient-top">
                    <strong>Jean Rukundo</strong>
                    <span className="queue-status waiting">
                      Waiting (12m)
                    </span>
                  </div>
                  <div className="queue-sub">
                    <span>MC-2026-0492</span>
                    <span>•</span>
                    <span>Cardiology (Dr. Kagame)</span>
                    <span>•</span>
                    <span>10:30 AM</span>
                  </div>
                </div>
              </div>

              <div
                className="queue-card-item"
                onClick={() => navigate("/patients/patient-003")}
              >
                <div className="queue-patient-avatar">KU</div>
                <div className="queue-item-body">
                  <div className="queue-patient-top">
                    <strong>Keza Uwase</strong>
                    <span className="queue-status waiting">
                      Waiting (5m)
                    </span>
                  </div>
                  <div className="queue-sub">
                    <span>MC-2026-1108</span>
                    <span>•</span>
                    <span>Laboratory / Diagnostic</span>
                    <span>•</span>
                    <span>11:00 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Recent MedCard Taps Activity Feed */}
          <div className="dashboard-panel-card">
            <div className="panel-card-header">
              <div className="panel-header-title">
                <span className="eyebrow">NFC REAL-TIME STREAM</span>
                <h3>Recent Card Activity</h3>
              </div>
              <button
                type="button"
                className="action-pill-btn secondary small"
                onClick={() => navigate("/nfc")}
              >
                <Wifi size={14} />
                <span>Open Scanner</span>
              </button>
            </div>

            <div className="nfc-taps-feed-container">
              <div className="tap-feed-item success">
                <div className="tap-feed-icon">
                  <Wifi size={16} />
                </div>
                <div className="tap-feed-body">
                  <div className="tap-feed-top">
                    <strong>Alice Mutoni (04:A2:8B:1F:90:3C)</strong>
                    <small>2 mins ago</small>
                  </div>
                  <p>Contactless Tap identified at Reception Station 1</p>
                </div>
              </div>

              <div className="tap-feed-item success">
                <div className="tap-feed-icon">
                  <Wifi size={16} />
                </div>
                <div className="tap-feed-body">
                  <div className="tap-feed-top">
                    <strong>Jean Rukundo (04:C5:1E:44:88:9A)</strong>
                    <small>18 mins ago</small>
                  </div>
                  <p>Co-pay payment verified via MedCard Wallet</p>
                </div>
              </div>

              <div className="tap-feed-item info">
                <div className="tap-feed-icon">
                  <ShieldCheck size={16} />
                </div>
                <div className="tap-feed-body">
                  <div className="tap-feed-top">
                    <strong>MoH RSSB Gateway Sync</strong>
                    <small>35 mins ago</small>
                  </div>
                  <p>Automatic eligibility batch sync confirmed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}