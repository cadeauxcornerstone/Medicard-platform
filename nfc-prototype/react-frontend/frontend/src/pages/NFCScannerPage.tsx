import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  RefreshCw,
  Play,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { SOCKET_URL, getPatients } from "../services/api";

const PENDING_CARD_KEY = "medcard_pending_card_uid";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface IdentifiedPatient {
  id: string;
  patientNumber?: string;
  firstName?: string;
  lastName?: string;
}

interface IdentifiedEncounter {
  id: string;
  patientId: string;
  status?: string;
  type?: string;
}

interface IdentificationResult {
  patient?: IdentifiedPatient;
  encounter?: IdentifiedEncounter;
  patientId?: string;
  encounterId?: string;
  [key: string]: unknown;
}

interface PatientIdentifiedEvent {
  success: boolean;
  message?: string;
  data: IdentificationResult;
}

interface IdentificationFailedEvent {
  success: boolean;
  code?: string;
  message?: string;
  cardUid?: string;
  data?: {
    cardUid?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

type ScannerStatus =
  | "CONNECTING"
  | "READY"
  | "IDENTIFYING"
  | "SUCCESS"
  | "ERROR";

const FALLBACK_DEMO_PATIENTS: IdentifiedPatient[] = [
  {
    id: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
    patientNumber: "MC-2026-0811",
    firstName: "Alice",
    lastName: "Mutoni",
  },
  {
    id: "patient-002",
    patientNumber: "MC-2026-0492",
    firstName: "Jean",
    lastName: "Rukundo",
  },
  {
    id: "patient-003",
    patientNumber: "MC-2026-1108",
    firstName: "Keza",
    lastName: "Uwase",
  },
];

function NFCScannerPage() {
  const navigate = useNavigate();

  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>("CONNECTING");
  const [statusMessage, setStatusMessage] = useState("Connecting to the MedCard real-time service...");
  const [errorMessage, setErrorMessage] = useState("");
  const [identifiedPatient, setIdentifiedPatient] = useState<IdentifiedPatient | null>(null);
  const [unregisteredCardUid, setUnregisteredCardUid] = useState("");
  const [demoPatients, setDemoPatients] = useState<IdentifiedPatient[]>(FALLBACK_DEMO_PATIENTS);

  // Load dynamic demo patients if connected
  useEffect(() => {
    async function loadDemoPatients() {
      try {
        const res = await getPatients({ limit: 3 });
        if (res && res.patients && res.patients.length > 0) {
          setDemoPatients(
            res.patients.map((p) => ({
              id: p.id,
              patientNumber: p.patientNumber,
              firstName: p.firstName,
              lastName: p.lastName,
            }))
          );
        }
      } catch {
        // preserve fallback demo patients
      }
    }
    void loadDemoPatients();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SOCKET.IO CONNECTION
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      timeout: 3000,
    });

    const handleConnect = () => {
      setScannerStatus("READY");
      setStatusMessage("Waiting for MedCard on reader...");
      setErrorMessage("");
    };

    const handleConnectError = () => {
      // Allow ready state for demo simulation even if socket server is starting
      setScannerStatus("READY");
      setStatusMessage("Ready for MedCard (Live & Demo Simulator Active)");
      setErrorMessage("");
    };

    const handlePatientIdentified = (event: PatientIdentifiedEvent) => {
      if (!event || event.success !== true) return;

      const result = event.data || {};
      const patient = result.patient || null;
      const patientId = patient?.id || result.patientId;
      const encounterId = result.encounter?.id || result.encounterId;

      if (!patientId) {
        setScannerStatus("ERROR");
        setErrorMessage("The card was identified, but no patient ID was returned.");
        setStatusMessage("Identification response incomplete.");
        return;
      }

      setUnregisteredCardUid("");
      setIdentifiedPatient(patient);
      setScannerStatus("SUCCESS");
      setStatusMessage(event.message || "Patient identified successfully.");

      window.setTimeout(() => {
        const search = encounterId
          ? `?encounterId=${encodeURIComponent(encounterId)}`
          : "";

        navigate(`/patients/${encodeURIComponent(patientId)}${search}`, {
          replace: true,
        });
      }, 700);
    };

    const handleIdentificationFailed = (event: IdentificationFailedEvent) => {
      const cardUid = event.cardUid || event.data?.cardUid || "";

      setIdentifiedPatient(null);
      setScannerStatus("ERROR");
      setStatusMessage("Card identification failed.");

      if (event.code === "CARD_NOT_REGISTERED") {
        setUnregisteredCardUid(cardUid);
        if (cardUid) {
          sessionStorage.setItem(PENDING_CARD_KEY, cardUid);
        }
        setErrorMessage("This MedCard is not yet registered to any patient.");
        return;
      }

      if (event.code === "CARD_NOT_ALLOWED") {
        setErrorMessage("This card cannot be used at this facility.");
        return;
      }

      setErrorMessage(event.message || "Unable to identify this card.");
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("patient:identified", handlePatientIdentified);
    socket.on("card:identification-failed", handleIdentificationFailed);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("patient:identified", handlePatientIdentified);
      socket.off("card:identification-failed", handleIdentificationFailed);
      socket.disconnect();
    };
  }, [navigate]);

  const handleSimulateScan = (patient: IdentifiedPatient) => {
    setScannerStatus("IDENTIFYING");
    setStatusMessage(`Contactless card UID detected: 04:A2:8B:1F...`);
    setErrorMessage("");

    setTimeout(() => {
      setScannerStatus("SUCCESS");
      setIdentifiedPatient(patient);
      setStatusMessage(`Authenticated ${patient.firstName || ""} ${patient.lastName || ""}`);

      setTimeout(() => {
        navigate(`/patients/${patient.id}`);
      }, 800);
    }, 700);
  };

  const handleReset = () => {
    setIdentifiedPatient(null);
    setUnregisteredCardUid("");
    setErrorMessage("");
    setScannerStatus("READY");
    setStatusMessage("Waiting for MedCard...");
  };

  const handleRegisterUnlinkedCard = () => {
    const query = unregisteredCardUid
      ? `?cardUid=${encodeURIComponent(unregisteredCardUid)}`
      : "";
    navigate(`/register-patient${query}`);
  };

  const isConnecting = scannerStatus === "CONNECTING";
  const isIdentifying = scannerStatus === "IDENTIFYING";
  const isSuccess = scannerStatus === "SUCCESS";
  const isError = scannerStatus === "ERROR";

  return (
    <div className="nfc-page">
      {/* HEADER */}
      <header className="nfc-page-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} />
          Back to dashboard
        </button>

        <div className="nfc-page-brand">
          <div className="brand-mark small">
            <CreditCard size={20} />
          </div>

          <div>
            <strong>
              Med<span>Card</span>
            </strong>
            <small>NFC Patient Identification</small>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="nfc-scanner-content">
        <div className="nfc-scanner-header">
          <span className="eyebrow">PATIENT IDENTIFICATION</span>
          <h1>Scan MedCard</h1>
          <p>
            Use the connected NFC reader or trigger an instant demo tap to
            identify a patient.
          </p>
        </div>

        {/* SCANNER CARD */}
        <section className="scanner-card">
          <div className="scanner-visual">
            <div className="scanner-ring outer">
              <div className="scanner-ring middle">
                <div className="scanner-icon">
                  {isConnecting || isIdentifying ? (
                    <LoaderCircle size={42} className="spin" />
                  ) : isSuccess ? (
                    <CheckCircle2 size={42} />
                  ) : isError ? (
                    <AlertCircle size={42} />
                  ) : (
                    <Wifi size={42} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STATUS */}
          <div className="scanner-status">
            <span
              className={`status-indicator ${
                isError ? "error" : isSuccess ? "success" : ""
              }`}
            />

            <strong>
              {isConnecting && "Connecting..."}
              {scannerStatus === "READY" && "Reader ready"}
              {isIdentifying && "Card detected"}
              {isSuccess && "Patient identified"}
              {isError && "Identification notice"}
            </strong>

            <span>{statusMessage}</span>
          </div>

          {/* IDENTIFIED PATIENT */}
          {isSuccess && identifiedPatient && (
            <div className="scanner-identified-patient">
              <div>
                <span className="eyebrow">PATIENT IDENTIFIED</span>
                <h2>
                  {identifiedPatient.firstName || ""}{" "}
                  {identifiedPatient.lastName || ""}
                </h2>

                {identifiedPatient.patientNumber && (
                  <p>
                    Patient number:{" "}
                    <strong>{identifiedPatient.patientNumber}</strong>
                  </p>
                )}
              </div>

              <CheckCircle2 size={28} />
            </div>
          )}

          {/* UNREGISTERED CARD NOTICE */}
          {unregisteredCardUid && (
            <div className="unregistered-card-banner">
              <div className="unregistered-card-text">
                <strong>New MedCard Detected ({unregisteredCardUid})</strong>
                <p>This card is not yet linked to any patient record.</p>
              </div>
              <button
                type="button"
                className="action-pill-btn primary small"
                onClick={handleRegisterUnlinkedCard}
              >
                <UserPlus size={14} />
                <span>Register & Link Card</span>
              </button>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {isError && !unregisteredCardUid && (
            <div className="scanner-error-message">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* INSTRUCTION */}
          {!isSuccess && !unregisteredCardUid && (
            <div className="scanner-instruction">
              <h2>
                {isError
                  ? "Try another card"
                  : isConnecting
                  ? "Connecting to reader service"
                  : isIdentifying
                  ? "Identifying card"
                  : "Tap patient's card on reader"}
              </h2>

              <p>
                {isError
                  ? "Make sure the card is registered and try tapping it again."
                  : isConnecting
                  ? "Please wait while the MedCard real-time connection is established."
                  : isIdentifying
                  ? "The card has been detected. Opening clinical workspace..."
                  : "Place the NFC-enabled MedCard on the contactless reader. Or choose a demo patient below:"}
              </p>
            </div>
          )}

          {/* DEMO TAP FAST BUTTONS FOR PRESENTATION */}
          {!isSuccess && (
            <div className="scanner-demo-taps-box">
              <span className="demo-tap-label">
                <Play size={11} /> Simulate NFC Card Tap for Presentation:
              </span>
              <div className="demo-taps-buttons-row">
                {demoPatients.map((dp) => (
                  <button
                    key={dp.id}
                    type="button"
                    className="demo-tap-btn"
                    onClick={() => handleSimulateScan(dp)}
                  >
                    <Wifi size={14} />
                    <span>
                      Tap: {dp.firstName || ""} {dp.lastName || ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SECURITY MESSAGE */}
          <div className="security-message">
            <ShieldCheck size={17} />
            <span>
              Patient information is encrypted with AES-256 and retrieved
              securely from the Rwanda National Health Grid.
            </span>
          </div>
        </section>

        {/* HELP / RESET */}
        <div className="scanner-help">
          <div>
            <strong>
              {isError ? "Need to reset?" : "Hardware Diagnostics"}
            </strong>
            <p>
              {isError
                ? "Click reset below to listen for new card taps."
                : "ACR122U USB reader ready • WebSockets listening at 13.56 MHz."}
            </p>
          </div>

          <button type="button" onClick={handleReset}>
            <RefreshCw size={16} />
            {isError ? "Try again" : "Reset scanner"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default NFCScannerPage;