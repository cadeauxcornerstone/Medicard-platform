import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  Pill,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  TestTubes,
  Wallet,
  Wifi,
  X,
  XCircle,
} from "lucide-react";
import { io } from "socket.io-client";
import AppLayout from "../components/layout/AppLayout";
import {
  getPatient,
  getEncounter,
  getWallet,
  type Patient,
  type Encounter,
  type Wallet as WalletType,
} from "../services/api";

const SOCKET_URL = "http://localhost:5000";

interface PaymentIntent {
  id: string;
  chargeId: string;
  patientId: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  expiresAt: string;
  createdAt: string;
}

interface ServiceItem {
  id: string;
  name: string;
  category: "CONSULTATION" | "LABORATORY" | "PHARMACY";
  grossAmount: number;
  insuranceAmount: number;
  patientAmount: number;
}

const SAMPLE_SERVICE_ITEMS: ServiceItem[] = [
  {
    id: "srv-1",
    name: "Specialist Consultation (Orthopedics)",
    category: "CONSULTATION",
    grossAmount: 15000,
    insuranceAmount: 12750,
    patientAmount: 2250,
  },
  {
    id: "srv-2",
    name: "Laboratory Panel: CBC & CRP Quant",
    category: "LABORATORY",
    grossAmount: 38000,
    insuranceAmount: 32300,
    patientAmount: 5700,
  },
  {
    id: "srv-3",
    name: "Pharmacy: Amoxicillin 500mg & Paracetamol",
    category: "PHARMACY",
    grossAmount: 36000,
    insuranceAmount: 30600,
    patientAmount: 5400,
  },
];

export default function PaymentWorkspacePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const patientId = searchParams.get("patientId") || "ac844b2b-cc1b-45a4-9404-e059fdd6df0b";
  const encounterId = searchParams.get("encounterId") || "enc-sample-001";

  const [patient, setPatient] = useState<Patient | null>(null);
  const [_encounter, setEncounter] = useState<Encounter | null>(null);
  const [wallet, setWallet] = useState<WalletType | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<"MEDCARD" | "MOMO" | "CASH">("MEDCARD");
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [waitingForSecondTap, setWaitingForSecondTap] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [completedTransactionRef, setCompletedTransactionRef] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Calculation totals
  const totalGross = SAMPLE_SERVICE_ITEMS.reduce((sum, item) => sum + item.grossAmount, 0); // 89,000
  const totalInsurance = SAMPLE_SERVICE_ITEMS.reduce((sum, item) => sum + item.insuranceAmount, 0); // 75,650
  const totalPatientCoPay = SAMPLE_SERVICE_ITEMS.reduce((sum, item) => sum + item.patientAmount, 0); // 13,350
  const walletBalance = wallet?.balance ?? 37200;

  /*
  |--------------------------------------------------------------------------
  | LOAD PATIENT & WALLET
  |--------------------------------------------------------------------------
  */
  const loadPaymentData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (patientId) {
        try {
          const patientData = await getPatient(patientId);
          setPatient(patientData);
        } catch {
          // Fallback patient
          setPatient({
            id: patientId,
            patientNumber: "MED-2026-000001",
            firstName: "Wilson",
            lastName: "Test",
            dateOfBirth: "1988-06-15",
            gender: "Male",
            phone: "+250 788 123 456",
            nationalId: "1198880012345678",
          });
        }

        try {
          const walletData = await getWallet(patientId);
          setWallet(walletData);
        } catch {
          setWallet({
            id: `w-${patientId}`,
            patientId,
            balance: 37200,
            currency: "RWF",
            status: "ACTIVE",
          });
        }
      }

      if (encounterId) {
        try {
          const encData = await getEncounter(encounterId);
          setEncounter(encData);
        } catch {
          setEncounter({
            id: encounterId,
            patientId,
            facilityId: "kfh-001",
            type: "OUTPATIENT",
            status: "OPEN",
            startedAt: new Date().toISOString(),
            endedAt: null,
          });
        }
      }
    } catch {
      // Local fallbacks already initialized
    } finally {
      setLoading(false);
    }
  }, [patientId, encounterId]);

  useEffect(() => {
    void loadPaymentData();
  }, [loadPaymentData]);

  /*
  |--------------------------------------------------------------------------
  | SOCKET LISTENER FOR SECOND NFC TAP
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!waitingForSecondTap) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    const handlePatientTapped = (event: any) => {
      console.log("PaymentWorkspace: NFC Card tapped during payment intent:", event);
      void executePaymentCompletion();
    };

    socket.on("patient:identified", handlePatientTapped);
    socket.on("card:tapped", handlePatientTapped);

    return () => {
      socket.off("patient:identified", handlePatientTapped);
      socket.off("card:tapped", handlePatientTapped);
      socket.disconnect();
    };
  }, [waitingForSecondTap]);

  /*
  |--------------------------------------------------------------------------
  | INITIATE PAYMENT
  |--------------------------------------------------------------------------
  */
  const handleInitiatePayment = async () => {
    setError("");
    setSuccessMessage("");

    if (selectedMethod === "MEDCARD") {
      setWaitingForSecondTap(true);
      setPaymentIntent({
        id: `intent-${Date.now()}`,
        chargeId: `chg-${Date.now()}`,
        patientId,
        amount: totalPatientCoPay,
        currency: "RWF",
        status: "PENDING_CONFIRMATION",
        reference: `TX-PAY-${Math.floor(1000 + Math.random() * 9000)}`,
        expiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
        createdAt: new Date().toISOString(),
      });
    } else {
      // Mobile money / cash immediate authorization
      await executePaymentCompletion();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | EXECUTE PAYMENT COMPLETION
  |--------------------------------------------------------------------------
  */
  const executePaymentCompletion = async () => {
    setProcessingPayment(true);
    setError("");

    try {
      // Simulate backend settlement delay
      await new Promise((res) => setTimeout(res, 900));

      const txRef = `TX-KFH-${Math.floor(100000 + Math.random() * 900000)}`;
      setCompletedTransactionRef(txRef);
      setPaymentComplete(true);
      setWaitingForSecondTap(false);

      if (wallet) {
        setWallet({
          ...wallet,
          balance: Math.max(0, wallet.balance - totalPatientCoPay),
        });
      }

      setSuccessMessage(
        `Payment of ${totalPatientCoPay.toLocaleString()} RWF authorized and settled successfully.`
      );
    } catch {
      setError("Payment processing failed. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL INTENT
  |--------------------------------------------------------------------------
  */
  const handleCancelIntent = () => {
    setWaitingForSecondTap(false);
    setPaymentIntent(null);
    setProcessingPayment(false);
  };

  const formatRwf = (value: number) => {
    return `${value.toLocaleString("en-RW")} RWF`;
  };

  const getInitials = (first?: string, last?: string) => {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "PT";
  };

  return (
    <AppLayout
      pageTitle="Payment Workspace & Checkout"
      pageSubtitle="King Faisal Hospital • MedCard Billing & Co-Pay Station"
      actionButton={{
        label: "Refresh Billing",
        onClick: () => void loadPaymentData(),
        icon: <RefreshCw size={15} className={loading ? "spin" : ""} />,
      }}
    >
      <div className="payment-workspace-container">
        {/* =========================================================
            PATIENT IDENTIFICATION HERO
        ========================================================== */}
        <section className="payment-patient-hero">
          <div className="payment-patient-left">
            <div className="payment-patient-avatar">
              {getInitials(patient?.firstName, patient?.lastName)}
            </div>

            <div className="payment-patient-info">
              <strong>
                {patient?.firstName} {patient?.lastName}
              </strong>
              <div className="payment-patient-tags">
                <span>Patient ID: {patient?.patientNumber || "MED-2026-000001"}</span>
                <span>Encounter: #{encounterId.slice(0, 8)}</span>
                <span className="clinical-status-badge active">
                  <ShieldCheck size={11} />
                  RSSB / RAMA (85% COVERED)
                </span>
                <span className="clinical-status-badge completed">
                  <CreditCard size={11} />
                  MEDCARD VERIFIED
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="action-pill-btn secondary small"
            onClick={() => navigate(`/patient-workspace/${patientId}?encounterId=${encounterId}`)}
          >
            <RotateCcw size={13} />
            <span>Return to Clinical Chart</span>
          </button>
        </section>

        {/* =========================================================
            FINANCIAL METRIC STRIP (4-CARD GRID)
        ========================================================== */}
        <div className="analytics-metrics-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Total Gross Services</span>
              <strong className="metric-value">{formatRwf(totalGross)}</strong>
              <small className="metric-trend neutral">Consultation, Lab & Meds</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Insurance Covered</span>
              <strong className="metric-value" style={{ color: "var(--green-primary)" }}>
                {formatRwf(totalInsurance)}
              </strong>
              <small className="metric-trend positive">85% Scheme Subsidy</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Patient Co-Pay Due</span>
              <strong className="metric-value" style={{ color: "#c2410c" }}>
                {formatRwf(totalPatientCoPay)}
              </strong>
              <small className="metric-trend highlight">Net Out-of-Pocket</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">MedCard Wallet Balance</span>
              <strong className="metric-value">{formatRwf(walletBalance)}</strong>
              <small className="metric-trend positive">Sufficient Funds</small>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="clinical-success">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="clinical-error">
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================
            INTERACTIVE PAYMENT CONFIRMATION / SETTLEMENT AREA
        ========================================================== */}
        {!paymentComplete ? (
          <>
            {/* STATE A: WAITING FOR SECOND NFC TAP */}
            {waitingForSecondTap && paymentIntent ? (
              <section className="payment-second-tap-banner">
                <div className="payment-tap-radar">
                  {processingPayment ? (
                    <LoaderCircle size={36} className="spin" />
                  ) : (
                    <Wifi size={36} />
                  )}
                </div>

                <h2>
                  {processingPayment
                    ? "Authorizing & Settling Payment..."
                    : "Ask Patient to Tap MedCard"}
                </h2>

                <p>
                  Payment authorization for{" "}
                  <strong style={{ color: "var(--green-primary)" }}>
                    {formatRwf(totalPatientCoPay)}
                  </strong>{" "}
                  is primed. Hold the patient's card on the NFC desk reader to confirm deduction.
                </p>

                <div className="payment-tap-meta-row">
                  <span>Ref: {paymentIntent.reference}</span>
                  <span>Amount: {formatRwf(paymentIntent.amount)}</span>
                  <span>Target: MedCard Healthcare Wallet</span>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <button
                    type="button"
                    className="action-pill-btn primary"
                    onClick={executePaymentCompletion}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <>
                        <LoaderCircle size={15} className="spin" />
                        <span>Processing Tap...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={15} />
                        <span>Simulate NFC Confirmation Tap</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="action-pill-btn secondary"
                    onClick={handleCancelIntent}
                    disabled={processingPayment}
                  >
                    <X size={15} />
                    <span>Cancel Intent</span>
                  </button>
                </div>
              </section>
            ) : (
              /* STATE B: METHOD SELECTOR & AUTHORIZE BUTTON */
              <section className="topup-panel-card">
                <div className="topup-panel-header">
                  <div className="workspace-card-icon">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <h2>Select Payment Channel</h2>
                    <p>Choose authorization method to settle patient co-pay</p>
                  </div>
                </div>

                <div className="payment-methods-grid">
                  <div
                    className={`payment-method-card ${selectedMethod === "MEDCARD" ? "selected" : ""}`}
                    onClick={() => setSelectedMethod("MEDCARD")}
                  >
                    <CreditCard size={22} style={{ color: "var(--green-primary)" }} />
                    <div>
                      <strong>MedCard NFC Wallet</strong>
                      <small>Instant second-tap deduction ({formatRwf(walletBalance)} available)</small>
                    </div>
                  </div>

                  <div
                    className={`payment-method-card ${selectedMethod === "MOMO" ? "selected" : ""}`}
                    onClick={() => setSelectedMethod("MOMO")}
                  >
                    <Smartphone size={22} />
                    <div>
                      <strong>Mobile Money (MoMo / Airtel)</strong>
                      <small>Prompt USSD push to patient's mobile number</small>
                    </div>
                  </div>

                  <div
                    className={`payment-method-card ${selectedMethod === "CASH" ? "selected" : ""}`}
                    onClick={() => setSelectedMethod("CASH")}
                  >
                    <Banknote size={22} />
                    <div>
                      <strong>Cash at Reception Desk</strong>
                      <small>Cashier manual receipt settlement</small>
                    </div>
                  </div>
                </div>

                <div className="clinical-form-actions" style={{ marginTop: "8px" }}>
                  <div className="clinical-form-status">
                    <ShieldCheck size={16} />
                    <span>Co-Pay Amount: {formatRwf(totalPatientCoPay)}</span>
                  </div>

                  <button
                    type="button"
                    className="action-pill-btn primary"
                    onClick={handleInitiatePayment}
                    disabled={loading}
                  >
                    <CreditCard size={16} />
                    <span>
                      {selectedMethod === "MEDCARD"
                        ? "Initiate NFC Authorization Tap"
                        : "Authorize & Settle Co-Pay"}
                    </span>
                  </button>
                </div>
              </section>
            )}
          </>
        ) : (
          /* STATE C: CONFIRMED PAYMENT RECEIPT */
          <section className="payment-receipt-card">
            <div className="payment-receipt-header">
              <div className="gov-seal-box">
                <strong>REPUBLIC OF RWANDA • MINISTRY OF HEALTH</strong>
                <small>King Faisal Hospital • MedCard Official Certified Electronic Receipt</small>
              </div>

              <span className="payment-receipt-badge">
                <CheckCircle2 size={15} />
                SETTLED & CONFIRMED
              </span>
            </div>

            <div className="print-patient-summary">
              <div>
                <small>PATIENT NAME</small>
                <strong>{patient?.firstName} {patient?.lastName}</strong>
              </div>
              <div>
                <small>TRANSACTION REF</small>
                <strong style={{ color: "var(--green-primary)", fontFamily: "monospace" }}>
                  {completedTransactionRef}
                </strong>
              </div>
              <div>
                <small>AMOUNT PAID</small>
                <strong>{formatRwf(totalPatientCoPay)}</strong>
              </div>
            </div>

            <div className="print-body-content">
              <strong>PAYMENT SUMMARY</strong>
              <p>
                Full patient responsibility of {formatRwf(totalPatientCoPay)} settled via MedCard Wallet.
                Updated wallet balance: <strong>{formatRwf(walletBalance)}</strong>. Encounter #{encounterId.slice(0, 8)} billing closed.
              </p>

              <div className="print-verified-footer">
                <ShieldCheck size={16} />
                <span>Digitally Signed: RSA-4096-SHA256 • Verified Rwanda Health Grid Payment Ledger</span>
              </div>
            </div>

            <div className="modal-actions-bar" style={{ marginTop: "10px", padding: 0 }}>
              <button
                type="button"
                className="action-pill-btn secondary"
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Print Official Receipt</span>
              </button>

              <button
                type="button"
                className="action-pill-btn primary"
                onClick={() => navigate(`/patient-workspace/${patientId}?encounterId=${encounterId}`)}
              >
                <CheckCircle2 size={15} />
                <span>Complete & Return to Patient Chart</span>
              </button>
            </div>
          </section>
        )}

        {/* =========================================================
            ITEMIZED CHARGES BREAKDOWN TABLE
        ========================================================== */}
        <section className="topup-panel-card">
          <div className="topup-panel-header">
            <div className="workspace-card-icon">
              <Banknote size={18} />
            </div>
            <div>
              <h2>Itemized Clinical Charges Breakdown</h2>
              <p>Detailed split between RSSB/RAMA insurance coverage and patient co-pay</p>
            </div>
          </div>

          <div className="workspace-history-list">
            {SAMPLE_SERVICE_ITEMS.map((item) => (
              <div key={item.id} className="workspace-history-card">
                <div className="workspace-history-icon">
                  {item.category === "CONSULTATION" ? (
                    <Stethoscope size={18} />
                  ) : item.category === "LABORATORY" ? (
                    <TestTubes size={18} />
                  ) : (
                    <Pill size={18} />
                  )}
                </div>

                <div className="workspace-history-content">
                  <div className="workspace-history-title">
                    <strong>{item.name}</strong>
                    <span className="dosage-badge">{formatRwf(item.grossAmount)}</span>
                  </div>

                  <div className="workspace-history-meta">
                    <span className="meta-tag">
                      Insurance (85%): {formatRwf(item.insuranceAmount)}
                    </span>
                    <span className="qty-tag" style={{ color: "#c2410c", fontWeight: 700 }}>
                      Patient Co-Pay: {formatRwf(item.patientAmount)}
                    </span>
                    <span>Status: Verified & Audited</span>
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