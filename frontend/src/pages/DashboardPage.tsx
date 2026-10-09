import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wifi,
  ArrowRight,
  ShieldCheck,
  UserRoundPlus,
  Wallet,
  X,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";
import PatientIdentificationPanel from "../components/nfc/PatientIdentificationPanel";
import { socket } from "../services/socket";
import {
  getWallet,
  topUpWallet,
  type Wallet as WalletType,
} from "../services/api";
import {
  type Role,
  CURRENT_ROLE_KEY,
} from "../components/layout/AppSidebar";

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

  const [showWalletTopUp, setShowWalletTopUp] = useState(false);
  const [walletPatient, setWalletPatient] = useState<any>(null);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletProcessing, setWalletProcessing] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [walletSuccess, setWalletSuccess] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(CURRENT_ROLE_KEY);

    if (stored) {
      setCurrentRole(stored as Role);
    }
  }, []);

  const loadPatientWallet = async (patientId: string) => {
    try {
      setWalletLoading(true);
      setWalletError("");

      const result = await getWallet(patientId);

      setWallet(result);
    } catch (error: any) {
      setWallet(null);

      setWalletError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load patient wallet."
      );
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    const handlePatientIdentified = (data: any) => {
      if (!showWalletTopUp) {
        return;
      }

      const identifiedPatient = data?.patient || data?.data?.patient;

      if (!identifiedPatient?.id) {
        return;
      }

      setWalletPatient(identifiedPatient);

      setWalletError("");
      setWalletSuccess("");

      loadPatientWallet(identifiedPatient.id);
    };

    const handleIdentificationFailed = (data: any) => {
      if (!showWalletTopUp) {
        return;
      }

      setWalletPatient(null);
      setWallet(null);

      setWalletError(
        data?.message ||
          "Unable to identify the MedCard."
      );
    };

    socket.on(
      "patient:identified",
      handlePatientIdentified
    );

    socket.on(
      "card:identification-failed",
      handleIdentificationFailed
    );

    return () => {
      socket.off(
        "patient:identified",
        handlePatientIdentified
      );

      socket.off(
        "card:identification-failed",
        handleIdentificationFailed
      );
    };
  }, [showWalletTopUp]);

  const handleWalletTopUp = async () => {
    if (!walletPatient) {
      setWalletError(
        "Tap the patient's MedCard first."
      );
      return;
    }

    const numericAmount = Number(walletAmount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setWalletError(
        "Enter a valid top-up amount."
      );
      return;
    }

    try {
      setWalletProcessing(true);
      setWalletError("");
      setWalletSuccess("");

      const result = await topUpWallet(
        walletPatient.id,
        {
          amount: numericAmount,
          description:
            "Reception wallet top-up",
        }
      );

      setWallet(result.wallet);

      setWalletAmount("");

      setWalletSuccess(
        `${numericAmount.toLocaleString()} RWF added successfully.`
      );
    } catch (error: any) {
      setWalletError(
        error?.response?.data?.message ||
          error?.message ||
          "Wallet top-up failed."
      );
    } finally {
      setWalletProcessing(false);
    }
  };

  const openWalletTopUp = () => {
    setShowWalletTopUp(true);
    setWalletPatient(null);
    setWallet(null);
    setWalletAmount("");
    setWalletError("");
    setWalletSuccess("");
  };

  const closeWalletTopUp = () => {
    if (walletProcessing) {
      return;
    }

    setShowWalletTopUp(false);
    setWalletPatient(null);
    setWallet(null);
    setWalletAmount("");
    setWalletError("");
    setWalletSuccess("");
  };

  return (
    <AppLayout
      pageTitle={currentRole}
      actionButton={
        currentRole === "Reception"
          ? {
              label: "Register New Patient",
              onClick: () =>
                navigate("/register-patient"),
              icon: (
                <UserRoundPlus size={16} />
              ),
            }
          : undefined
      }

      secondaryActionButton={
        currentRole === "Reception"
          ? {
              label: "Top Up Wallet",
              onClick: openWalletTopUp,
              icon: (
                <Wallet size={16} />
              ),
            }
          : undefined
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            className="bg-white border border-border rounded-lg p-3 cursor-pointer hover:border-teal transition-all"
            onClick={() =>
              navigate("/patients")
            }
          >
            <span className="text-xs font-medium text-body-text">Patients</span>
            <strong className="block text-xl font-bold text-navy">4,892</strong>
            <small className="text-xs text-teal">+14 today</small>
          </div>

          <div
            className="bg-white border border-border rounded-lg p-3 cursor-pointer hover:border-teal transition-all"
            onClick={() =>
              navigate("/nfc")
            }
          >
            <span className="text-xs font-medium text-body-text">NFC Scans</span>
            <strong className="block text-xl font-bold text-navy">128</strong>
            <small className="text-xs text-teal">Live</small>
          </div>

          <div
            className="bg-white border border-border rounded-lg p-3 cursor-pointer hover:border-teal transition-all"
            onClick={() =>
              navigate("/appointments")
            }
          >
            <span className="text-xs font-medium text-body-text">Appointments</span>
            <strong className="block text-xl font-bold text-navy">46</strong>
            <small className="text-xs text-teal">8 waiting</small>
          </div>

          <div
            className="bg-white border border-border rounded-lg p-3 cursor-pointer hover:border-teal transition-all"
            onClick={() =>
              navigate("/payment")
            }
          >
            <span className="text-xs font-medium text-body-text">Claims</span>
            <strong className="block text-xl font-bold text-navy">4.2M</strong>
            <small className="text-xs text-teal">RWF</small>
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <PatientIdentificationPanel />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-teal">CLINIC DISPATCH</span>
                <h3 className="text-lg font-bold text-navy">Live Lobby Queue</h3>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors"
                onClick={() =>
                  navigate("/appointments")
                }
              >
                <span>View Full Schedule</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="divide-y divide-border">
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-section-tint transition-colors"
                onClick={() =>
                  navigate(
                    "/patients/ac844b2b-cc1b-45a4-9404-e059fdd6df0b"
                  )
                }
              >
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-navy font-bold text-sm">AM</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-navy">Alice Mutoni</strong>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">In Consultation</span>
                  </div>
                  <div className="text-sm text-body-text flex items-center gap-2">
                    <span>MC-2026-0811</span>
                    <span>•</span>
                    <span>General OPD (Dr. Solange)</span>
                    <span>•</span>
                    <span>09:15 AM</span>
                  </div>
                </div>
              </div>

              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-section-tint transition-colors"
                onClick={() =>
                  navigate(
                    "/patients/patient-002"
                  )
                }
              >
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-navy font-bold text-sm">JR</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-navy">Jean Rukundo</strong>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Waiting (12m)</span>
                  </div>
                  <div className="text-sm text-body-text flex items-center gap-2">
                    <span>MC-2026-0492</span>
                    <span>•</span>
                    <span>Cardiology (Dr. Kagame)</span>
                    <span>•</span>
                    <span>10:30 AM</span>
                  </div>
                </div>
              </div>

              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-section-tint transition-colors"
                onClick={() =>
                  navigate(
                    "/patients/patient-003"
                  )
                }
              >
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-navy font-bold text-sm">KU</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-navy">Keza Uwase</strong>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Waiting (5m)</span>
                  </div>
                  <div className="text-sm text-body-text flex items-center gap-2">
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

          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-teal">NFC REAL-TIME STREAM</span>
                <h3 className="text-lg font-bold text-navy">Recent Card Activity</h3>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors"
                onClick={() =>
                  navigate("/nfc")
                }
              >
                <Wifi size={14} />
                <span>Open Scanner</span>
              </button>
            </div>

            <div className="divide-y divide-border">
              <div className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Wifi size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-navy text-sm">Alice Mutoni (04:A2:8B:1F:90:3C)</strong>
                    <small className="text-body-text text-xs">2 mins ago</small>
                  </div>
                  <p className="text-body-text text-sm">Contactless Tap identified at Reception Station 1</p>
                </div>
              </div>

              <div className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Wifi size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-navy text-sm">Jean Rukundo (04:C5:1E:44:88:9A)</strong>
                    <small className="text-body-text text-xs">18 mins ago</small>
                  </div>
                  <p className="text-body-text text-sm">Co-pay payment verified via MedCard Wallet</p>
                </div>
              </div>

              <div className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck size={16} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-navy text-sm">MoH RSSB Gateway Sync</strong>
                    <small className="text-body-text text-xs">35 mins ago</small>
                  </div>
                  <p className="text-body-text text-sm">Automatic eligibility batch sync confirmed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showWalletTopUp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-navy">Top Up Patient Wallet</h2>
              <button
                type="button"
                onClick={closeWalletTopUp}
                className="p-2 hover:bg-section-tint rounded-full transition-colors"
                disabled={walletProcessing}
              >
                <X size={20} className="text-body-text" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-body-text mb-4">Tap the patient's MedCard to identify the patient.</p>
              <PatientIdentificationPanel />
            </div>

            {walletPatient && (
              <div className="space-y-4">
                <div className="bg-section-tint rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-pale-cyan rounded-full flex items-center justify-center">
                      <span className="text-navy font-bold text-sm">
                        {walletPatient.firstName?.[0]}{walletPatient.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <strong className="text-navy">{walletPatient.firstName} {walletPatient.lastName}</strong>
                      <p className="text-sm text-body-text">{walletPatient.medCardId}</p>
                    </div>
                  </div>

                  {walletLoading ? (
                    <div className="flex items-center gap-2 text-body-text text-sm">
                      <LoaderCircle size={16} className="animate-spin" />
                      <span>Loading wallet...</span>
                    </div>
                  ) : wallet ? (
                    <div className="text-navy font-bold">
                      Current Balance: {wallet.balance.toLocaleString()} RWF
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">Top-up Amount (RWF)</label>
                  <input
                    type="number"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
                    disabled={walletProcessing}
                  />
                </div>

                {walletError && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <ShieldCheck size={16} />
                    <span>{walletError}</span>
                  </div>
                )}

                {walletSuccess && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                    <CheckCircle2 size={16} />
                    <span>{walletSuccess}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleWalletTopUp}
                  disabled={walletProcessing || walletLoading}
                  className="w-full inline-flex items-center justify-center h-12 px-6 text-base font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {walletProcessing ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Add Funds"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
