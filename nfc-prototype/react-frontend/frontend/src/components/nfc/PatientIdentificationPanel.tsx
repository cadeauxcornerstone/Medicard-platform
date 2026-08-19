import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
  Stethoscope,
  Wifi,
  XCircle,
  Play,
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

  /* Real-time NFC Identification via Socket.IO */
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

  /* Demo Fast Simulation Trigger for presentations */
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

  /* STATE: WAITING FOR TAP */
  if (state === "waiting") {
    return (
      <section className="nfc-station-card">
        <div className="nfc-station-grid">
          {/* Left Column: Visual Radar & Reader Graphic */}
          <div className="nfc-station-visual">
            <div className="nfc-radar-rings">
              <div className="nfc-ring outer" />
              <div className="nfc-ring middle" />
              <div className="nfc-ring inner">
                <Wifi size={38} className="nfc-pulse-radar-icon" />
              </div>
            </div>
            <div className="nfc-status-pill-live">
              <span className="nfc-live-pulse" />
              <span>NFC Reader Active (13.56 MHz)</span>
            </div>
          </div>

          {/* Right Column: Copy & Interactive Demo Simulator */}
          <div className="nfc-station-content">
            <div className="station-header-row">
              <div>
                <span className="eyebrow">PATIENT IDENTIFICATION</span>
                <h2>Tap Contactless MedCard</h2>
                <p>
                  Place the patient's smart card on the reader to securely verify
                  identity & load their clinical record.
                </p>
              </div>
              <div className="reader-badge-tag">
                <CreditCard size={15} />
                <span>ACR122U Ready</span>
              </div>
            </div>

            {/* Quick One-Click Demo Simulation Pills */}
            <div className="station-demo-triggers">
              <span className="demo-trigger-label">
                <Play size={11} /> Simulate NFC Card Tap:
              </span>
              <div className="demo-pill-buttons-row">
                <button
                  type="button"
                  className="demo-patient-pill"
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
                >
                  <Wifi size={13} />
                  <span>Tap: Alice Mutoni</span>
                </button>

                <button
                  type="button"
                  className="demo-patient-pill"
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
                >
                  <Wifi size={13} />
                  <span>Tap: Jean Rukundo</span>
                </button>

                <button
                  type="button"
                  className="demo-patient-pill"
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
                >
                  <Wifi size={13} />
                  <span>Tap: Keza Uwase</span>
                </button>
              </div>
            </div>

            {/* Workflow Breadcrumb Indicator */}
            <div className="nfc-workflow-steps">
              <div className="flow-step active">
                <span className="step-num">1</span>
                <span>NFC Tap</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <span className="step-num">2</span>
                <span>Patient Auth</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <span className="step-num">3</span>
                <span>Clinical Encounter</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* STATE: IDENTIFYING (LOADING) */
  if (state === "identifying") {
    return (
      <section className="nfc-station-card identifying-state">
        <div className="nfc-identifying-box">
          <LoaderCircle size={44} className="spin nfc-spinner" />
          <h3>Authenticating MedCard...</h3>
          <p>Decrypting contactless token & fetching Rwanda Health Grid records.</p>
        </div>
      </section>
    );
  }

  /* STATE: PATIENT IDENTIFIED */
  if (state === "identified" && patient && card) {
    return (
      <section className="nfc-station-card identified-state">
        <div className="identified-card-header">
          <div className="identified-banner-left">
            <div className="identified-avatar-circle">
              {getInitials(patient.firstName, patient.lastName)}
            </div>
            <div>
              <span className="verified-chip-tag">
                <CheckCircle2 size={13} />
                <span>IDENTITY VERIFIED</span>
              </span>
              <h2>
                {patient.firstName} {patient.lastName}
              </h2>
              <div className="identified-sub-tags">
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

          <div className="identified-card-badge">
            <div className="card-uid-pill">
              <Wifi size={14} />
              <span>{card.cardUid}</span>
            </div>
            <span className="card-active-status">ACTIVE MEDCARD</span>
          </div>
        </div>

        {/* Clinical Context Snapshot */}
        <div className="identified-context-strip">
          <div className="context-item-box">
            <span className="context-label">CURRENT ENCOUNTER</span>
            <strong>{encounter?.type || "General Outpatient Visit"}</strong>
            <small>Status: {encounter?.status || "IN_PROGRESS"}</small>
          </div>

          <div className="context-item-box">
            <span className="context-label">AUTHENTICATED AT</span>
            <strong>{formatDateTime(card.lastUsedAt)}</strong>
            <small>Session: {session?.status || "ACTIVE"}</small>
          </div>

          <div className="context-item-box security">
            <ShieldCheck size={18} />
            <div>
              <span className="context-label">INSURANCE GATEWAY</span>
              <strong>RSSB / RAMA Verified</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="identified-actions-bar">
          <button
            type="button"
            className="action-pill-btn secondary"
            onClick={resetIdentification}
          >
            <RefreshCw size={15} />
            <span>Scan Another Card</span>
          </button>

          <button
            type="button"
            className="action-pill-btn primary"
            onClick={openPatientWorkspace}
          >
            <Stethoscope size={16} />
            <span>Open Clinical Workspace</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    );
  }

  /* STATE: ERROR OR NOT REGISTERED */
  return (
    <section className="nfc-station-card error-state">
      <div className="nfc-error-box">
        <XCircle size={42} className="error-icon" />
        <h3>
          {state === "not-registered"
            ? "MedCard Not Registered"
            : state === "not-allowed"
            ? "Card Access Restricted"
            : "Card Identification Error"}
        </h3>
        <p>{errorMessage || "Unable to read this card. Please try again."}</p>
        <button
          type="button"
          className="action-pill-btn primary"
          onClick={resetIdentification}
        >
          <RefreshCw size={15} />
          <span>Try Another Card</span>
        </button>
      </div>
    </section>
  );
}