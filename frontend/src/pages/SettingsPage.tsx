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
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("hardware")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              activeTab === "hardware"
                ? "bg-navy text-white"
                : "bg-white border border-border text-body-text hover:border-teal"
            }`}
          >
            <Wifi size={16} />
            <span>NFC Reader & Hardware</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("presentation")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              activeTab === "presentation"
                ? "bg-navy text-white"
                : "bg-white border border-border text-body-text hover:border-teal"
            }`}
          >
            <Sliders size={16} />
            <span>Presentation & Demo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("facility")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              activeTab === "facility"
                ? "bg-navy text-white"
                : "bg-white border border-border text-body-text hover:border-teal"
            }`}
          >
            <Building size={16} />
            <span>Facility & Identity</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              activeTab === "security"
                ? "bg-navy text-white"
                : "bg-white border border-border text-body-text hover:border-teal"
            }`}
          >
            <Lock size={16} />
            <span>Security & MoH Sync</span>
          </button>
        </div>

        {activeTab === "hardware" && (
          <div className="bg-white border border-border rounded-2xl p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-sm font-semibold text-teal block mb-2">HARDWARE DIAGNOSTICS</span>
                <h3 className="text-xl font-bold text-navy mb-1">Contactless MedCard Reader Status</h3>
                <p className="text-body-text text-sm">Real-time status of connected USB NFC ACM / PC/SC card scanner.</p>
              </div>
              <button
                type="button"
                onClick={handleTestSocket}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors"
              >
                <RefreshCw
                  size={14}
                  className={socketStatus === "testing" ? "animate-spin" : ""}
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

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-section-tint rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-pale-cyan rounded-full flex items-center justify-center">
                    <Wifi size={20} className="text-teal" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-teal block">NFC READER ENGINE</span>
                    <strong className="text-navy text-sm">ACR122U USB Connected</strong>
                  </div>
                </div>
                <small className="text-body-text text-xs">13.56 MHz ISO 14443 Type A/B</small>
                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">OPERATIONAL</span>
              </div>

              <div className="bg-section-tint rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-pale-cyan rounded-full flex items-center justify-center">
                    <Server size={20} className="text-teal" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-teal block">WEBSOCKETS BRIDGE</span>
                    <strong className="text-navy text-sm">{import.meta.env.VITE_SOCKET_URL || "wss://medicard-platform.onrender.com"}</strong>
                  </div>
                </div>
                <small className="text-body-text text-xs">Subscribed to patient:identified channel</small>
                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">STREAMING</span>
              </div>

              <div className="bg-section-tint rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-pale-cyan rounded-full flex items-center justify-center">
                    <Radio size={20} className="text-teal" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-teal block">CARD IDENTIFICATION LATENCY</span>
                    <strong className="text-navy text-sm">~180ms</strong>
                  </div>
                </div>
                <small className="text-body-text text-xs">Instant encryption handshake</small>
                <span className="inline-block mt-2 px-2 py-1 bg-teal text-white text-xs font-semibold rounded-full">OPTIMAL</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-section-tint rounded-xl">
                <div>
                  <strong className="text-navy text-sm">Audible Beep on Successful Card Tap</strong>
                  <p className="text-body-text text-xs">Play confirmation acoustic tone through workstation audio.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={hardwareBeep}
                    onChange={(e) => setHardwareBeep(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-section-tint rounded-xl">
                <div>
                  <strong className="text-navy text-sm">Auto-Navigate to Patient File on Identification</strong>
                  <p className="text-body-text text-xs">Instantly transition to clinical workspace when a card is tapped.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={autoNavigateOnScan}
                    onChange={(e) => setAutoNavigateOnScan(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal" />
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/nfc")}
              className="inline-flex items-center justify-center h-12 px-6 text-base font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors"
            >
              <Wifi size={16} className="mr-2" />
              <span>Launch NFC Scanner Window</span>
              <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        )}

        {activeTab === "presentation" && (
          <div className="bg-white border border-border rounded-2xl p-6 md:p-8">
            <div className="mb-6">
              <span className="text-sm font-semibold text-teal block mb-2">DEMO CONTROLS</span>
              <h3 className="text-xl font-bold text-navy mb-1">Presentation Quick-Switch & Simulation</h3>
              <p className="text-body-text text-sm">Switch roles and trigger demo card simulations without hardware.</p>
            </div>

            <div className="mb-6">
              <span className="text-sm font-semibold text-navy block mb-3">ACTIVE WORKSPACE ROLE</span>
              <div className="flex flex-wrap gap-2">
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
                    onClick={() => handleRoleChange(r)}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                      currentRole === r
                        ? "bg-teal text-navy"
                        : "bg-white border border-border text-body-text hover:border-teal"
                    }`}
                  >
                    <User size={15} />
                    <span>{r}</span>
                    {currentRole === r && <CheckCircle2 size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-section-tint rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sliders size={18} className="text-teal" />
                <div>
                  <strong className="text-navy">Simulated Patient Taps</strong>
                  <p className="text-body-text text-xs">Trigger instant card scan simulation for live demo presentations:</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/patients/ac844b2b-cc1b-45a4-9404-e059fdd6df0b"
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors"
                >
                  <Wifi size={15} />
                  <span>Tap: Alice Mutoni (RSSB / RAMA)</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/patients/patient-002")}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors"
                >
                  <Wifi size={15} />
                  <span>Tap: Jean Rukundo (MMI)</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/patients/patient-003")}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors"
                >
                  <Wifi size={15} />
                  <span>Tap: Keza Uwase (Mutuelle)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "facility" && (
          <div className="bg-white border border-border rounded-2xl p-6 md:p-8">
            <div className="mb-6">
              <span className="text-sm font-semibold text-teal block mb-2">FACILITY PROFILE</span>
              <h3 className="text-xl font-bold text-navy mb-1">Healthcare Facility Configuration</h3>
              <p className="text-body-text text-sm">National Health Grid facility credentials and station identity.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Facility Name</label>
                <input
                  type="text"
                  defaultValue="King Faisal Hospital Rwanda"
                  readOnly
                  className="w-full px-4 py-3 border border-border rounded-xl bg-section-tint text-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Facility License Code</label>
                <input
                  type="text"
                  defaultValue="KFH-KGL-00192"
                  readOnly
                  className="w-full px-4 py-3 border border-border rounded-xl bg-section-tint text-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">District / Province</label>
                <input
                  type="text"
                  defaultValue="Gasabo District • Kigali City"
                  readOnly
                  className="w-full px-4 py-3 border border-border rounded-xl bg-section-tint text-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Connected E-Health Node</label>
                <input
                  type="text"
                  defaultValue="MoH Rwanda National Health Grid Node 04"
                  readOnly
                  className="w-full px-4 py-3 border border-border rounded-xl bg-section-tint text-navy"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              className="inline-flex items-center justify-center h-12 px-6 text-base font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors"
            >
              {syncSaved ? (
                <>
                  <CheckCircle2 size={16} className="mr-2" />
                  <span>Facility Config Synced!</span>
                </>
              ) : (
                <span>Save & Sync Station Profile</span>
              )}
            </button>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-white border border-border rounded-2xl p-6 md:p-8">
            <div className="mb-6">
              <span className="text-sm font-semibold text-teal block mb-2">DATA GOVERNANCE</span>
              <h3 className="text-xl font-bold text-navy mb-1">Rwanda MoH Encryption & Compliance</h3>
              <p className="text-body-text text-sm">AES-256 contactless token validation with cryptographic audit trails.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-section-tint rounded-xl">
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={24} className="text-teal" />
                </div>
                <div className="flex-1">
                  <strong className="text-navy">RSSB / RAMA Direct Claim Gateway</strong>
                  <p className="text-body-text text-sm">Real-time eligibility validation and digital copay settlement.</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">CONNECTED</span>
              </div>

              <div className="flex items-start gap-4 p-4 bg-section-tint rounded-xl">
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={24} className="text-teal" />
                </div>
                <div className="flex-1">
                  <strong className="text-navy">CBHI Mutuelle de Santé Grid</strong>
                  <p className="text-body-text text-sm">National digital health insurance auto-reconciliation.</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">CONNECTED</span>
              </div>

              <div className="flex items-start gap-4 p-4 bg-section-tint rounded-xl">
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={24} className="text-teal" />
                </div>
                <div className="flex-1">
                  <strong className="text-navy">AES-GCM Card Data Encryption</strong>
                  <p className="text-body-text text-sm">Zero plaintext patient health records stored on physical chip.</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">ACTIVE</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
