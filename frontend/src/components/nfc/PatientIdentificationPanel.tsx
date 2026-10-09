import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  Stethoscope,
  Wifi,
  XCircle,
  RefreshCw,
} from "lucide-react";

import { socket } from "../../services/socket";

type IdentificationState =
  | "waiting"
  | "identifying"
  | "identified"
  | "not-registered"
  | "not-allowed"
  | "error";

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface CardContext {
  id: string;
  cardUid: string;
  status: string;
  lastUsedAt?: string | null;
}

interface EncounterContext {
  id: string;
  status: string;
  type: string;
  startedAt: string;
}

interface SessionContext {
  id: string;
  status: string;
  startedAt: string;
  lastActivityAt: string;
}

interface IdentificationData {
  card: CardContext;
  patient: Patient;
  encounter: EncounterContext;
  session: SessionContext;
}

interface IdentificationResponse {
  success: boolean;
  message?: string;
  data: IdentificationData;
}

interface IdentificationFailure {
  success: boolean;
  code?: string;
  message?: string;
}

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "Just now";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
};

export default function PatientIdentificationPanel() {
  const navigate = useNavigate();

  const [state, setState] = useState<IdentificationState>("waiting");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [card, setCard] = useState<CardContext | null>(null);
  const [encounter, setEncounter] = useState<EncounterContext | null>(null);
  const [session, setSession] = useState<SessionContext | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handlePatientIdentified = (response: IdentificationResponse) => {
      if (!response?.success || !response.data) {
        return;
      }
      const { patient, card, encounter, session } = response.data;
      setPatient(patient);
      setCard(card);
      setEncounter(encounter);
      setSession(session);
      setErrorMessage("");
      setState("identified");
    };

    const handleIdentificationFailed = (response: IdentificationFailure) => {
      setPatient(null);
      setCard(null);
      setEncounter(null);
      setSession(null);

      if (response.code === "CARD_NOT_REGISTERED") {
        setState("not-registered");
        setErrorMessage(response.message || "This MedCard is not registered.");
        return;
      }

      if (response.code === "CARD_NOT_ALLOWED") {
        setState("not-allowed");
        setErrorMessage(response.message || "This MedCard cannot be used at this facility.");
        return;
      }

      setState("error");
      setErrorMessage(response.message || "Unable to identify the MedCard.");
    };

    socket.on("patient:identified", handlePatientIdentified);
    socket.on("card:identification-failed", handleIdentificationFailed);

    return () => {
      socket.off("patient:identified", handlePatientIdentified);
      socket.off("card:identification-failed", handleIdentificationFailed);
    };
  }, []);

  const handleSimulateTap = (mock: {
    patient: Patient;
    card: CardContext;
    encounter: EncounterContext;
  }) => {
    setState("identifying");
    setErrorMessage("");

    setTimeout(() => {
      setPatient(mock.patient);
      setCard(mock.card);
      setEncounter(mock.encounter);
      setSession({
        id: `sess-${Date.now()}`,
        status: "ACTIVE",
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      });
      setState("identified");
    }, 700);
  };

  const openPatientWorkspace = () => {
    if (!patient?.id) return;
    const search = encounter?.id
      ? `?encounterId=${encodeURIComponent(encounter.id)}`
      : "";
    navigate(`/patients/${patient.id}${search}`);
  };

  const resetIdentification = () => {
    setState("waiting");
    setPatient(null);
    setCard(null);
    setEncounter(null);
    setSession(null);
    setErrorMessage("");
  };

  if (state === "waiting") {
    return (
      <div className="p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-teal/30 flex items-center justify-center bg-pale-cyan">
              <Wifi size={20} className="text-teal" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">Tap MedCard</h2>
              <p className="text-xs text-body-text">Place card on reader</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2 py-1 bg-pale-cyan rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
            <span className="text-xs font-semibold text-teal">Ready</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              handleSimulateTap({
                patient: {
                  id: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
                  patientNumber: "MC-2026-0811",
                  firstName: "Alice",
                  lastName: "Mutoni",
                  gender: "Female",
                  phone: "+250 788 123 456",
                },
                card: {
                  id: "card-101",
                  cardUid: "04:A2:8B:1F:90:3C",
                  status: "ACTIVE",
                  lastUsedAt: new Date().toISOString(),
                },
                encounter: {
                  id: "enc-today-01",
                  status: "IN_PROGRESS",
                  type: "OUTPATIENT_VISIT",
                  startedAt: new Date().toISOString(),
                },
              })
            }
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-navy border border-navy rounded hover:bg-navy hover:text-white transition-colors"
          >
            <Wifi size={10} />
            Alice
          </button>

          <button
            type="button"
            onClick={() =>
              handleSimulateTap({
                patient: {
                  id: "patient-002",
                  patientNumber: "MC-2026-0492",
                  firstName: "Jean",
                  lastName: "Rukundo",
                  gender: "Male",
                  phone: "+250 788 456 789",
                },
                card: {
                  id: "card-102",
                  cardUid: "04:C5:1E:44:88:9A",
                  status: "ACTIVE",
                  lastUsedAt: new Date().toISOString(),
                },
                encounter: {
                  id: "enc-today-02",
                  status: "WAITING",
                  type: "CARDIOLOGY_FOLLOWUP",
                  startedAt: new Date().toISOString(),
                },
              })
            }
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-navy border border-navy rounded hover:bg-navy hover:text-white transition-colors"
          >
            <Wifi size={10} />
            Jean
          </button>

          <button
            type="button"
            onClick={() =>
              handleSimulateTap({
                patient: {
                  id: "patient-003",
                  patientNumber: "MC-2026-1108",
                  firstName: "Keza",
                  lastName: "Uwase",
                  gender: "Female",
                  phone: "+250 783 777 888",
                },
                card: {
                  id: "card-103",
                  cardUid: "04:F8:33:AA:11:55",
                  status: "ACTIVE",
                  lastUsedAt: new Date().toISOString(),
                },
                encounter: {
                  id: "enc-today-03",
                  status: "LAB_ORDER",
                  type: "DIAGNOSTIC_PANEL",
                  startedAt: new Date().toISOString(),
                },
              })
            }
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-navy border border-navy rounded hover:bg-navy hover:text-white transition-colors"
          >
            <Wifi size={10} />
            Keza
          </button>
        </div>
      </div>
    );
  }

  if (state === "identifying") {
    return (
      <div className="p-12 text-center">
        <LoaderCircle size={48} className="text-teal animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-bold text-navy mb-2">Authenticating MedCard...</h3>
        <p className="text-body-text text-sm">Decrypting contactless token & fetching Rwanda Health Grid records.</p>
      </div>
    );
  }

  if (state === "identified" && patient && card) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-pale-cyan rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-navy font-bold text-xl">{getInitials(patient.firstName, patient.lastName)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  <CheckCircle2 size={12} />
                  <span>IDENTITY VERIFIED</span>
                </span>
              </div>
              <h2 className="text-xl font-bold text-navy">
                {patient.firstName} {patient.lastName}
              </h2>
              <div className="flex items-center gap-2 text-sm text-body-text mt-1">
                <span>{patient.patientNumber}</span>
                <span>•</span>
                <span>{patient.gender || "Citizen"}</span>
                {patient.phone && (
                  <>
                    <span>•</span>
                    <span>{patient.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-pale-cyan rounded-full">
              <Wifi size={14} className="text-teal" />
              <span className="text-sm font-semibold text-teal">{card.cardUid}</span>
            </div>
            <span className="text-xs font-semibold text-teal">ACTIVE MEDCARD</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-section-tint rounded-xl p-4">
            <span className="text-xs font-semibold text-teal block mb-1">CURRENT ENCOUNTER</span>
            <strong className="text-navy text-sm">{encounter?.type || "General Outpatient Visit"}</strong>
            <small className="text-body-text text-xs block">Status: {encounter?.status || "IN_PROGRESS"}</small>
          </div>

          <div className="bg-section-tint rounded-xl p-4">
            <span className="text-xs font-semibold text-teal block mb-1">AUTHENTICATED AT</span>
            <strong className="text-navy text-sm">{formatDateTime(card.lastUsedAt)}</strong>
            <small className="text-body-text text-xs block">Session: {session?.status || "ACTIVE"}</small>
          </div>

          <div className="bg-section-tint rounded-xl p-4 flex items-center gap-3">
            <ShieldCheck size={20} className="text-teal" />
            <div>
              <span className="text-xs font-semibold text-teal block">INSURANCE GATEWAY</span>
              <strong className="text-navy text-sm">RSSB / RAMA Verified</strong>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={resetIdentification}
            className="inline-flex items-center justify-center h-12 px-6 text-base font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors"
          >
            <RefreshCw size={16} className="mr-2" />
            <span>Scan Another Card</span>
          </button>

          <button
            type="button"
            onClick={openPatientWorkspace}
            className="inline-flex items-center justify-center h-12 px-6 text-base font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors"
          >
            <Stethoscope size={16} className="mr-2" />
            <span>Open Clinical Workspace</span>
            <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 text-center">
      <XCircle size={48} className="text-red-600 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-navy mb-2">
        {state === "not-registered"
          ? "MedCard Not Registered"
          : state === "not-allowed"
          ? "Card Access Restricted"
          : "Card Identification Error"}
      </h3>
      <p className="text-body-text text-sm mb-6">{errorMessage || "Unable to read this card. Please try again."}</p>
      <button
        type="button"
        onClick={resetIdentification}
        className="inline-flex items-center justify-center h-12 px-6 text-base font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors"
      >
        <RefreshCw size={16} className="mr-2" />
        <span>Try Another Card</span>
      </button>
    </div>
  );
}
