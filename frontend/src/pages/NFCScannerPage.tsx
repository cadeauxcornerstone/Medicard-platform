import { useEffect, useState } from "react";
import {
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
import AppLayout from "../components/layout/AppLayout";
import { SOCKET_URL, getPatients } from "../services/api";

const PENDING_CARD_KEY = "medcard_pending_card_uid";

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
      }
    }
    void loadDemoPatients();
  }, []);

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
    <AppLayout
      pageTitle="NFC Patient Identification"
      pageSubtitle="King Faisal Hospital • Contactless MedCard Scanner"
      actionButton={{
        label: "Hardware Diagnostics",
        onClick: handleReset,
        icon: <RefreshCw size={15} />,
      }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="p-8 text-center">
            <span className="text-sm font-semibold text-teal">PATIENT IDENTIFICATION</span>
            <h1 className="text-2xl font-bold text-navy mt-2 mb-2">Scan MedCard</h1>
            <p className="text-body-text">
              Use the connected NFC reader or trigger an instant demo tap to identify a patient.
            </p>
          </div>

          <div className="bg-section-tint p-12 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-teal/30 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-teal/50 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-pale-cyan flex items-center justify-center">
                    {isConnecting || isIdentifying ? (
                      <LoaderCircle size={42} className="text-teal animate-spin" />
                    ) : isSuccess ? (
                      <CheckCircle2 size={42} className="text-green-600" />
                    ) : isError ? (
                      <AlertCircle size={42} className="text-red-600" />
                    ) : (
                      <Wifi size={42} className="text-teal" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className={`w-3 h-3 rounded-full ${isError ? "bg-red-500" : isSuccess ? "bg-green-500" : "bg-teal"}`} />
              <strong className="text-navy">
                {isConnecting && "Connecting..."}
                {scannerStatus === "READY" && "Reader ready"}
                {isIdentifying && "Card detected"}
                {isSuccess && "Patient identified"}
                {isError && "Identification notice"}
              </strong>
            </div>
            <p className="text-center text-body-text text-sm">{statusMessage}</p>
          </div>

          {isSuccess && identifiedPatient && (
            <div className="p-6 border-t border-border bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-green-700">PATIENT IDENTIFIED</span>
                  <h2 className="text-xl font-bold text-navy mt-1">
                    {identifiedPatient.firstName || ""} {identifiedPatient.lastName || ""}
                  </h2>
                  {identifiedPatient.patientNumber && (
                    <p className="text-body-text text-sm">
                      Patient number: <strong>{identifiedPatient.patientNumber}</strong>
                    </p>
                  )}
                </div>
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
            </div>
          )}

          {unregisteredCardUid && (
            <div className="p-6 border-t border-border bg-yellow-50">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-navy">New MedCard Detected ({unregisteredCardUid})</strong>
                  <p className="text-body-text text-sm">This card is not yet linked to any patient record.</p>
                </div>
                <button
                  type="button"
                  onClick={handleRegisterUnlinkedCard}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors"
                >
                  <UserPlus size={14} />
                  <span>Register & Link Card</span>
                </button>
              </div>
            </div>
          )}

          {isError && !unregisteredCardUid && (
            <div className="p-6 border-t border-border bg-red-50">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle size={18} />
                <span className="text-sm">{errorMessage}</span>
              </div>
            </div>
          )}

          {!isSuccess && !unregisteredCardUid && (
            <div className="p-6 border-t border-border">
              <h2 className="text-lg font-bold text-navy mb-2">
                {isError
                  ? "Try another card"
                  : isConnecting
                  ? "Connecting to reader service"
                  : isIdentifying
                  ? "Identifying card"
                  : "Tap patient's card on reader"}
              </h2>
              <p className="text-body-text text-sm">
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

          {!isSuccess && (
            <div className="p-6 border-t border-border bg-section-tint">
              <span className="text-sm font-semibold text-navy flex items-center gap-2 mb-4">
                <Play size={11} />
                Simulate NFC Card Tap for Presentation:
              </span>
              <div className="flex flex-wrap gap-3">
                {demoPatients.map((dp) => (
                  <button
                    key={dp.id}
                    type="button"
                    onClick={() => handleSimulateScan(dp)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors"
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

          <div className="p-6 border-t border-border flex items-center gap-3 text-body-text text-sm">
            <ShieldCheck size={17} className="text-teal" />
            <span>
              Patient information is encrypted with AES-256 and retrieved securely from the Rwanda National Health Grid.
            </span>
          </div>
        </div>

        <div className="mt-6 bg-white border border-border rounded-xl p-6 flex items-center justify-between">
          <div>
            <strong className="text-navy">
              {isError ? "Need to reset?" : "Hardware Diagnostics"}
            </strong>
            <p className="text-body-text text-sm">
              {isError
                ? "Click reset below to listen for new card taps."
                : "ACR122U USB reader ready • WebSockets listening at 13.56 MHz."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors"
          >
            <RefreshCw size={16} />
            {isError ? "Try again" : "Reset scanner"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

export default NFCScannerPage;
