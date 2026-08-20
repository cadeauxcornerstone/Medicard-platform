import { useEffect, useState } from "react";
import {
  Wallet,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Wifi,
  ShieldCheck,
  RefreshCw,
  Clock3,
} from "lucide-react";
import { io } from "socket.io-client";
import AppLayout from "../components/layout/AppLayout";
import {
  getWallet,
  topUpWallet,
  type Wallet as WalletType,
} from "../services/api";

interface Patient {
  id: string;
  patientNumber?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  nationalId?: string;
}

interface Card {
  id: string;
  cardUid: string;
  status: string;
}

interface IdentificationEvent {
  success?: boolean;
  message?: string;
  data?: {
    card?: Card;
    patient?: Patient;
    encounter?: {
      id: string;
      status: string;
      type?: string;
    };
    session?: {
      id: string;
      status: string;
    };
  };
}

interface TopUpHistoryRecord {
  id: string;
  amount: number;
  patientName: string;
  patientNumber: string;
  timestamp: string;
  reference: string;
  status: string;
}

const SOCKET_URL = "http://localhost:5000";

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000];

const DEMO_PATIENTS = [
  {
    id: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
    patientNumber: "MED-2026-000001",
    firstName: "Wilson",
    lastName: "Test",
    cardUid: "0118264579",
  },
  {
    id: "patient-002",
    patientNumber: "MC-2026-0811",
    firstName: "Alice",
    lastName: "Mutoni",
    cardUid: "04:A2:8B:1F:90:3C",
  },
  {
    id: "patient-003",
    patientNumber: "MC-2026-0492",
    firstName: "Jean",
    lastName: "Rukundo",
    cardUid: "04:C5:1E:44:88:9A",
  },
];

const INITIAL_HISTORY: TopUpHistoryRecord[] = [
  {
    id: "topup-1",
    amount: 25000,
    patientName: "Wilson Test",
    patientNumber: "MED-2026-000001",
    timestamp: "Today, 10:45 AM",
    reference: "TX-TOP-9914",
    status: "COMPLETED",
  },
  {
    id: "topup-2",
    amount: 10000,
    patientName: "Alice Mutoni",
    patientNumber: "MC-2026-0811",
    timestamp: "Today, 09:12 AM",
    reference: "TX-TOP-9908",
    status: "COMPLETED",
  },
];

export default function TopUpPage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("Wallet top-up by Reception");
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<TopUpHistoryRecord[]>(INITIAL_HISTORY);

  /*
  |--------------------------------------------------------------------------
  | NFC SOCKET IDENTIFICATION
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    const handlePatientIdentified = async (event: IdentificationEvent) => {
      const identifiedPatient = event?.data?.patient;
      const identifiedCard = event?.data?.card;

      if (!identifiedPatient?.id) {
        setError("Card detected, but patient profile was not returned.");
        return;
      }

      setPatient(identifiedPatient);
      setCard(identifiedCard || null);
      setScanning(false);
      setProcessing(false);
      setSuccess("");
      setError("");

      try {
        const walletData = await getWallet(identifiedPatient.id);
        setWallet(walletData);
      } catch {
        // Fallback wallet object for local demo
        setWallet({
          id: `w-${identifiedPatient.id}`,
          patientId: identifiedPatient.id,
          balance: 37200,
          currency: "RWF",
          status: "ACTIVE",
        });
      }
    };

    const handleIdentificationFailed = (event: { message?: string }) => {
      setError(event?.message || "Failed to identify card.");
      setScanning(true);
    };

    socket.on("patient:identified", handlePatientIdentified);
    socket.on("patient:identification_failed", handleIdentificationFailed);

    return () => {
      socket.off("patient:identified", handlePatientIdentified);
      socket.off("patient:identification_failed", handleIdentificationFailed);
      socket.disconnect();
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SIMULATE DEMO CARD TAP
  |--------------------------------------------------------------------------
  */
  const handleSimulateTap = async (demo: (typeof DEMO_PATIENTS)[0]) => {
    setError("");
    setSuccess("");
    setScanning(false);
    setPatient({
      id: demo.id,
      patientNumber: demo.patientNumber,
      firstName: demo.firstName,
      lastName: demo.lastName,
    });
    setCard({
      id: `card-${demo.id}`,
      cardUid: demo.cardUid,
      status: "ACTIVE",
    });

    try {
      const walletData = await getWallet(demo.id);
      setWallet(walletData);
    } catch {
      // Local fallback balance
      setWallet({
        id: `w-${demo.id}`,
        patientId: demo.id,
        balance: 37200,
        currency: "RWF",
        status: "ACTIVE",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TOP UP WALLET
  |--------------------------------------------------------------------------
  */
  const handleTopUp = async () => {
    if (!patient?.id) {
      setError("Please tap or select a patient MedCard first.");
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const result = await topUpWallet(patient.id, {
        amount: numericAmount,
        description,
      });

      if (result?.wallet) {
        setWallet(result.wallet);
      } else {
        // Fallback state update
        setWallet((prev) =>
          prev
            ? { ...prev, balance: Number(prev.balance) + numericAmount }
            : {
                id: `w-${patient.id}`,
                patientId: patient.id,
                balance: numericAmount,
                currency: "RWF",
                status: "ACTIVE",
              }
        );
      }

      // Add to audit trail
      const newRecord: TopUpHistoryRecord = {
        id: `topup-${Date.now()}`,
        amount: numericAmount,
        patientName: `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
        patientNumber: patient.patientNumber || "N/A",
        timestamp: "Just now",
        reference: `TX-TOP-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "COMPLETED",
      };
      setHistory([newRecord, ...history]);

      setSuccess(
        `${numericAmount.toLocaleString()} RWF successfully credited to ${patient.firstName} ${patient.lastName}'s MedCard wallet.`
      );
      setAmount("");
    } catch (topUpError: any) {
      const message =
        topUpError?.response?.data?.message ||
        topUpError?.message ||
        "Unable to complete wallet top up.";
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RESET / SCAN ANOTHER
  |--------------------------------------------------------------------------
  */
  const handleScanAnother = () => {
    setPatient(null);
    setCard(null);
    setWallet(null);
    setAmount("");
    setSuccess("");
    setError("");
    setScanning(true);
  };

  const formatRwf = (value: number | string) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "0 RWF";
    return `${numeric.toLocaleString("en-RW")} RWF`;
  };

  const getInitials = (first?: string, last?: string) => {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "PT";
  };

  return (
    <AppLayout
      pageTitle="Patient Wallet Top-Up"
      pageSubtitle="King Faisal Hospital • Reception & Cashier Desk"
      actionButton={{
        label: "Scan Another Card",
        onClick: handleScanAnother,
        icon: <RefreshCw size={15} />,
      }}
    >
      <div className="topup-container">
        {/* =========================================================
            HOW IT WORKS (CLEAN 4-CARD PROCESS)
        ========================================================== */}
        <section className="topup-process-section">
          <span className="topup-process-eyebrow">HOW IT WORKS</span>

          <div className="topup-process-grid">
            <div className="topup-step-card">
              <span className="topup-step-number">01</span>
              <h3>Tap Patient MedCard</h3>
              <p>
                Place the smart card on the desk NFC reader to instantly load the patient's verified record.
              </p>
            </div>

            <div className="topup-step-card">
              <span className="topup-step-number">02</span>
              <h3>Select Credit Amount</h3>
              <p>
                Choose from quick denomination presets or type any custom amount in Rwandan Francs (RWF).
              </p>
            </div>

            <div className="topup-step-card">
              <span className="topup-step-number">03</span>
              <h3>Confirm Transaction</h3>
              <p>
                Credit the balance with cryptographic audit trail and receive instant digital confirmation.
              </p>
            </div>

            <div className="topup-step-card">
              <span className="topup-step-number">04</span>
              <h3>Instant Co-Pay Ready</h3>
              <p>
                Funds become immediately available for pharmacy dispensing, lab tests, and clinical consultations.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            SUCCESS / ERROR BANNERS
        ========================================================== */}
        {success && (
          <div className="clinical-success">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="clinical-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================
            2-COLUMN WORKSPACE
        ========================================================== */}
        <div className="topup-workspace-grid">
          {/* LEFT: PATIENT NFC IDENTIFICATION */}
          <section className="topup-panel-card">
            <div className="topup-panel-header">
              <div className="workspace-card-icon">
                <CreditCard size={18} />
              </div>
              <div>
                <h2>Identify Patient</h2>
                <p>Tap the patient's MedCard on the NFC desktop reader</p>
              </div>
            </div>

            {!patient ? (
              <div className="topup-scanner-box">
                <div className="topup-scanner-radar">
                  {scanning ? (
                    <Wifi size={32} />
                  ) : (
                    <LoaderCircle size={32} className="spin" />
                  )}
                </div>

                <h3>
                  {scanning ? "Waiting for MedCard Tap" : "Reading card data..."}
                </h3>
                <p>
                  Hold the MedCard near the contactless reader to retrieve the profile.
                </p>

                <div className="topup-reader-pill">
                  <span />
                  NFC Reader Ready
                </div>

                {/* DEMO TAP SHORTCUTS */}
                <div className="topup-demo-triggers">
                  <span className="topup-demo-title">Quick Demo Simulation Taps</span>
                  <div className="topup-demo-button-row">
                    {DEMO_PATIENTS.map((demo) => (
                      <button
                        key={demo.id}
                        type="button"
                        className="topup-demo-btn"
                        onClick={() => handleSimulateTap(demo)}
                      >
                        {demo.firstName} {demo.lastName} ({demo.patientNumber})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="topup-identified-hero">
                <div className="topup-identified-profile">
                  <div className="topup-identified-avatar">
                    {getInitials(patient.firstName, patient.lastName)}
                  </div>
                  <div className="topup-identified-details">
                    <strong>
                      {patient.firstName} {patient.lastName}
                    </strong>
                    <div className="topup-identified-meta">
                      <span>No: {patient.patientNumber || "MED-2026-000001"}</span>
                      {card?.cardUid && <span>UID: {card.cardUid}</span>}
                      <span className="clinical-status-badge active">
                        <ShieldCheck size={11} />
                        VERIFIED CARD
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="action-pill-btn secondary small"
                  onClick={handleScanAnother}
                  disabled={processing}
                >
                  <RefreshCw size={13} />
                  <span>Scan Another</span>
                </button>
              </div>
            )}
          </section>

          {/* RIGHT: MEDCARD WALLET & TOP-UP FORM */}
          <section className="topup-panel-card">
            <div className="topup-panel-header">
              <div className="workspace-card-icon">
                <Wallet size={18} />
              </div>
              <div>
                <h2>MedCard Wallet</h2>
                <p>Manage and top up patient healthcare balance</p>
              </div>
            </div>

            {!patient ? (
              <div className="workspace-empty-state">
                <Wallet size={36} />
                <strong>No Patient Selected</strong>
                <span>
                  Tap a MedCard or select a simulation patient on the left to activate wallet management.
                </span>
              </div>
            ) : (
              <>
                {/* BALANCE DISPLAY */}
                <div className="topup-balance-display">
                  <div>
                    <span>Current Wallet Balance</span>
                    <strong>{formatRwf(wallet?.balance ?? 37200)}</strong>
                  </div>
                  <div className="topup-balance-badge">
                    {wallet?.status || "ACTIVE"} WALLET
                  </div>
                </div>

                {/* FORM FIELDS */}
                <div className="clinical-assessment-form">
                  <div className="clinical-field">
                    <label htmlFor="topup-amount">Amount to Add (RWF)</label>
                    <div className="topup-amount-wrapper">
                      <input
                        id="topup-amount"
                        type="number"
                        min="100"
                        step="500"
                        placeholder="Enter amount (e.g. 10000)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={processing}
                      />
                      <span className="topup-currency-tag">RWF</span>
                    </div>
                  </div>

                  {/* QUICK PRESET CHIPS */}
                  <div className="clinical-field">
                    <label>Quick Preset Amounts</label>
                    <div className="topup-preset-grid">
                      {PRESET_AMOUNTS.map((preset) => {
                        const isSelected = amount === String(preset);
                        return (
                          <button
                            key={preset}
                            type="button"
                            className={`topup-preset-chip ${
                              isSelected ? "selected" : ""
                            }`}
                            onClick={() => setAmount(String(preset))}
                            disabled={processing}
                          >
                            {preset.toLocaleString()} RWF
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="clinical-field">
                    <label htmlFor="topup-description">Transaction Reference Note</label>
                    <input
                      id="topup-description"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Wallet top-up by Reception"
                      disabled={processing}
                    />
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="clinical-form-actions">
                    <div className="clinical-form-status">
                      <ShieldCheck size={16} />
                      <span>Encrypted cashier credit</span>
                    </div>

                    <button
                      type="button"
                      className="action-pill-btn primary"
                      onClick={handleTopUp}
                      disabled={
                        processing ||
                        !patient ||
                        !amount ||
                        Number(amount) <= 0
                      }
                    >
                      {processing ? (
                        <>
                          <LoaderCircle size={16} className="spin" />
                          <span>Crediting Wallet...</span>
                        </>
                      ) : (
                        <>
                          <Wallet size={16} />
                          <span>Top Up Wallet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        {/* =========================================================
            RECENT TOP-UP AUDIT TRAIL
        ========================================================== */}
        <section className="topup-panel-card">
          <div className="topup-panel-header">
            <div className="workspace-card-icon">
              <Clock3 size={18} />
            </div>
            <div>
              <h2>Recent Top-Up Transactions</h2>
              <p>Real-time audit log of reception wallet funding</p>
            </div>
          </div>

          <div className="workspace-history-list">
            {history.map((record) => (
              <div key={record.id} className="workspace-history-card">
                <div className="workspace-history-icon">
                  <Wallet size={18} />
                </div>
                <div className="workspace-history-content">
                  <div className="workspace-history-title">
                    <strong>+{record.amount.toLocaleString()} RWF</strong>
                    <span className="clinical-status-badge completed">
                      {record.status}
                    </span>
                  </div>
                  <div className="workspace-history-meta">
                    <span>Patient: {record.patientName} ({record.patientNumber})</span>
                    <span>Ref: {record.reference}</span>
                    <span>Time: {record.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}