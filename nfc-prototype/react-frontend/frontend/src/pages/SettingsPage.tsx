import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Wifi,
  Server,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Building,
  User,
  Lock,
  Radio,
  ArrowRight,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { type Role, CURRENT_ROLE_KEY } from "../components/layout/AppSidebar";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"hardware" | "facility" | "presentation" | "security">("hardware");

  const [currentRole, setCurrentRole] = useState<Role>(() => {
    return (localStorage.getItem(CURRENT_ROLE_KEY) as Role) || "Reception";
  });

  const [hardwareBeep, setHardwareBeep] = useState(true);
  const [autoNavigateOnScan, setAutoNavigateOnScan] = useState(true);
  const [socketStatus, setSocketStatus] = useState<"connected" | "testing" | "ok">("connected");
  const [syncSaved, setSyncSaved] = useState(false);

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    localStorage.setItem(CURRENT_ROLE_KEY, role);
  };

  const handleTestSocket = () => {
    setSocketStatus("testing");
    setTimeout(() => {
      setSocketStatus("ok");
      setTimeout(() => setSocketStatus("connected"), 3000);
    }, 800);
  };

  const handleSaveSettings = () => {
    setSyncSaved(true);
    setTimeout(() => setSyncSaved(false), 2500);
  };

  return (
    <AppLayout
      pageTitle="Settings & Diagnostics"
      pageSubtitle="Facility workstation configuration, NFC reader diagnostics & demo controls"
    >
      <div className="settings-page-container">
        {/* Settings Navigation Tabs */}
        <div className="settings-nav-tabs">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "hardware" ? "active" : ""}`}
            onClick={() => setActiveTab("hardware")}
          >
            <Wifi size={16} />
            <span>NFC Reader & Hardware</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "presentation" ? "active" : ""}`}
            onClick={() => setActiveTab("presentation")}
          >
            <Sliders size={16} />
            <span>Presentation & Demo</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "facility" ? "active" : ""}`}
            onClick={() => setActiveTab("facility")}
          >
            <Building size={16} />
            <span>Facility & Identity</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <Lock size={16} />
            <span>Security & MoH Sync</span>
          </button>
        </div>

        {/* Tab 1: Hardware & NFC Diagnostics */}
        {activeTab === "hardware" && (
          <div className="settings-content-pane">
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <span className="eyebrow">HARDWARE DIAGNOSTICS</span>
                  <h3>Contactless MedCard Reader Status</h3>
                  <p>Real-time status of connected USB NFC ACM / PC/SC card scanner.</p>
                </div>
                <button
                  type="button"
                  className="action-pill-btn secondary small"
                  onClick={handleTestSocket}
                >
                  <RefreshCw
                    size={14}
                    className={socketStatus === "testing" ? "spin" : ""}
                  />
                  <span>
                    {socketStatus === "testing"
                      ? "Pinging Bridge..."
                      : socketStatus === "ok"
                      ? "Bridge Online (12ms)"
                      : "Test Reader Bridge"}
                  </span>
                </button>
              </div>

              <div className="hardware-status-grid">
                <div className="hardware-indicator-card ok">
                  <div className="indicator-icon">
                    <Wifi size={20} />
                  </div>
                  <div>
                    <span className="indicator-label">NFC READER ENGINE</span>
                    <strong>ACR122U USB Connected</strong>
                    <small>13.56 MHz ISO 14443 Type A/B</small>
                  </div>
                  <span className="status-badge-chip success">OPERATIONAL</span>
                </div>

                <div className="hardware-indicator-card ok">
                  <div className="indicator-icon">
                    <Server size={20} />
                  </div>
                  <div>
                    <span className="indicator-label">WEBSOCKETS BRIDGE</span>
                    <strong>ws://localhost:5000</strong>
                    <small>Subscribed to patient:identified channel</small>
                  </div>
                  <span className="status-badge-chip success">STREAMING</span>
                </div>

                <div className="hardware-indicator-card ok">
                  <div className="indicator-icon">
                    <Radio size={20} />
                  </div>
                  <div>
                    <span className="indicator-label">CARD IDENTIFICATION LATENCY</span>
                    <strong>~180ms</strong>
                    <small>Instant encryption handshake</small>
                  </div>
                  <span className="status-badge-chip highlight">OPTIMAL</span>
                </div>
              </div>

              <div className="settings-options-list">
                <div className="toggle-setting-row">
                  <div>
                    <strong>Audible Beep on Successful Card Tap</strong>
                    <p>Play confirmation acoustic tone through workstation audio.</p>
                  </div>
                  <label className="switch-toggle">
                    <input
                      type="checkbox"
                      checked={hardwareBeep}
                      onChange={(e) => setHardwareBeep(e.target.checked)}
                    />
                    <span className="slider-round" />
                  </label>
                </div>

                <div className="toggle-setting-row">
                  <div>
                    <strong>Auto-Navigate to Patient File on Identification</strong>
                    <p>Instantly transition to clinical workspace when a card is tapped.</p>
                  </div>
                  <label className="switch-toggle">
                    <input
                      type="checkbox"
                      checked={autoNavigateOnScan}
                      onChange={(e) => setAutoNavigateOnScan(e.target.checked)}
                    />
                    <span className="slider-round" />
                  </label>
                </div>
              </div>

              <div className="settings-footer-actions">
                <button
                  type="button"
                  className="action-pill-btn primary"
                  onClick={() => navigate("/nfc")}
                >
                  <Wifi size={16} />
                  <span>Launch NFC Scanner Window</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Presentation & Demo Controls */}
        {activeTab === "presentation" && (
          <div className="settings-content-pane">
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <span className="eyebrow">DEMO CONTROLS</span>
                  <h3>Presentation Quick-Switch & Simulation</h3>
                  <p>Switch roles and trigger demo card simulations without hardware.</p>
                </div>
              </div>

              <div className="role-switch-showcase">
                <span className="section-label">ACTIVE WORKSPACE ROLE</span>
                <div className="roles-pill-grid">
                  {(
                    [
                      "Reception",
                      "Doctor",
                      "Nurse",
                      "Laboratory",
                      "Pharmacy",
                      "Cashier",
                    ] as Role[]
                  ).map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`role-select-pill ${currentRole === r ? "active" : ""}`}
                      onClick={() => handleRoleChange(r)}
                    >
                      <User size={15} />
                      <span>{r}</span>
                      {currentRole === r && <CheckCircle2 size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="demo-simulation-box">
                <div className="simulation-header">
                  <Sliders size={18} />
                  <div>
                    <strong>Simulated Patient Taps</strong>
                    <p>Trigger instant card scan simulation for live demo presentations:</p>
                  </div>
                </div>

                <div className="demo-patients-buttons-row">
                  <button
                    type="button"
                    className="action-pill-btn secondary"
                    onClick={() =>
                      navigate(
                        "/patients/ac844b2b-cc1b-45a4-9404-e059fdd6df0b"
                      )
                    }
                  >
                    <Wifi size={15} />
                    <span>Tap: Alice Mutoni (RSSB / RAMA)</span>
                  </button>

                  <button
                    type="button"
                    className="action-pill-btn secondary"
                    onClick={() => navigate("/patients/patient-002")}
                  >
                    <Wifi size={15} />
                    <span>Tap: Jean Rukundo (MMI)</span>
                  </button>

                  <button
                    type="button"
                    className="action-pill-btn secondary"
                    onClick={() => navigate("/patients/patient-003")}
                  >
                    <Wifi size={15} />
                    <span>Tap: Keza Uwase (Mutuelle)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Facility Configuration */}
        {activeTab === "facility" && (
          <div className="settings-content-pane">
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <span className="eyebrow">FACILITY PROFILE</span>
                  <h3>Healthcare Facility Configuration</h3>
                  <p>National Health Grid facility credentials and station identity.</p>
                </div>
              </div>

              <div className="facility-form-grid">
                <div className="form-field">
                  <label>Facility Name</label>
                  <input
                    type="text"
                    defaultValue="King Faisal Hospital Rwanda"
                    readOnly
                  />
                </div>
                <div className="form-field">
                  <label>Facility License Code</label>
                  <input type="text" defaultValue="KFH-KGL-00192" readOnly />
                </div>
                <div className="form-field">
                  <label>District / Province</label>
                  <input
                    type="text"
                    defaultValue="Gasabo District • Kigali City"
                    readOnly
                  />
                </div>
                <div className="form-field">
                  <label>Connected E-Health Node</label>
                  <input
                    type="text"
                    defaultValue="MoH Rwanda National Health Grid Node 04"
                    readOnly
                  />
                </div>
              </div>

              <div className="settings-footer-actions">
                <button
                  type="button"
                  className="action-pill-btn primary"
                  onClick={handleSaveSettings}
                >
                  {syncSaved ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Facility Config Synced!</span>
                    </>
                  ) : (
                    <span>Save & Sync Station Profile</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security & MoH Sync */}
        {activeTab === "security" && (
          <div className="settings-content-pane">
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <span className="eyebrow">DATA GOVERNANCE</span>
                  <h3>Rwanda MoH Encryption & Compliance</h3>
                  <p>AES-256 contactless token validation with cryptographic audit trails.</p>
                </div>
              </div>

              <div className="security-badges-list">
                <div className="security-item">
                  <ShieldCheck size={24} className="sec-icon ok" />
                  <div>
                    <strong>RSSB / RAMA Direct Claim Gateway</strong>
                    <p>Real-time eligibility validation and digital copay settlement.</p>
                  </div>
                  <span className="status-badge-chip success">CONNECTED</span>
                </div>

                <div className="security-item">
                  <ShieldCheck size={24} className="sec-icon ok" />
                  <div>
                    <strong>CBHI Mutuelle de Santé Grid</strong>
                    <p>National digital health insurance auto-reconciliation.</p>
                  </div>
                  <span className="status-badge-chip success">CONNECTED</span>
                </div>

                <div className="security-item">
                  <ShieldCheck size={24} className="sec-icon ok" />
                  <div>
                    <strong>AES-GCM Card Data Encryption</strong>
                    <p>Zero plaintext patient health records stored on physical chip.</p>
                  </div>
                  <span className="status-badge-chip success">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
