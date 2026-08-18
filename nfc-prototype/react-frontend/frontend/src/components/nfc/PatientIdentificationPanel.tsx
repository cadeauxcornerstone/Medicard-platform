import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
    Stethoscope,
  UserRound,
  Wifi,
  XCircle,
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

const formatDateTime = (
  value?: string | null
) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getInitials = (
  firstName: string,
  lastName: string
) => {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`
    .toUpperCase();
};

function PatientIdentificationPanel() {
  const navigate = useNavigate();

  const [state, setState] =
    useState<IdentificationState>("waiting");

  const [patient, setPatient] =
    useState<Patient | null>(null);

  const [card, setCard] =
    useState<CardContext | null>(null);

  const [encounter, setEncounter] =
    useState<EncounterContext | null>(null);

  const [session, setSession] =
    useState<SessionContext | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | REAL-TIME NFC IDENTIFICATION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handlePatientIdentified = (
      response: IdentificationResponse
    ) => {
      if (
        !response?.success ||
        !response.data
      ) {
        return;
      }

      const {
        patient,
        card,
        encounter,
        session,
      } = response.data;

      setPatient(patient);
      setCard(card);
      setEncounter(encounter);
      setSession(session);

      setErrorMessage("");

      setState("identified");
    };

    const handleIdentificationFailed = (
      response: IdentificationFailure
    ) => {
      setPatient(null);
      setCard(null);
      setEncounter(null);
      setSession(null);

      if (
        response.code ===
        "CARD_NOT_REGISTERED"
      ) {
        setState("not-registered");

        setErrorMessage(
          response.message ||
            "This MedCard is not registered."
        );

        return;
      }

      if (
        response.code ===
        "CARD_NOT_ALLOWED"
      ) {
        setState("not-allowed");

        setErrorMessage(
          response.message ||
            "This MedCard cannot be used."
        );

        return;
      }

      setState("error");

      setErrorMessage(
        response.message ||
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
  }, []);

  /*
  |--------------------------------------------------------------------------
  | OPEN PATIENT WORKSPACE
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | The encounter ID comes directly from the backend
  | identification response.
  |
  | This allows the workspace to operate on the exact
  | encounter created/reused during the NFC tap.
  |
  */

  const openPatientWorkspace = () => {
    if (!patient?.id) {
      return;
    }

    if (!encounter?.id) {
      setErrorMessage(
        "No active clinical encounter was returned by the MedCard system."
      );

      setState("error");

      return;
    }

    navigate(
      `/patients/${patient.id}?encounterId=${encodeURIComponent(
        encounter.id
      )}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | RESET
  |--------------------------------------------------------------------------
  */

  const resetIdentification = () => {
    setState("waiting");

    setPatient(null);
    setCard(null);
    setEncounter(null);
    setSession(null);

    setErrorMessage("");
  };

  /*
  |--------------------------------------------------------------------------
  | WAITING
  |--------------------------------------------------------------------------
  */

  if (state === "waiting") {
    return (
      <section className="patient-identification-panel">

        <div className="identification-header">

          <div>
            <span className="eyebrow">
              MEDCARD IDENTIFICATION
            </span>

            <h2>
              Tap a MedCard
            </h2>

            <p>
              Place the patient's MedCard on the
              connected NFC reader to securely
              identify the patient.
            </p>
          </div>

          <div className="identification-status waiting">
            <span />
            Reader ready
          </div>

        </div>

        <div className="identification-waiting">

          <div className="nfc-reader-visual">

            <div className="nfc-wave wave-one" />
            <div className="nfc-wave wave-two" />
            <div className="nfc-wave wave-three" />

            <div className="nfc-card-icon">
              <CreditCard size={34} />
            </div>

          </div>

          <div className="identification-waiting-content">

            <span className="eyebrow">
              NFC READER
            </span>

            <h3>
              Ready to identify patient
            </h3>

            <p>
              Waiting for a registered MedCard.
              The patient record will appear
              automatically after identification.
            </p>

            <div className="identification-flow">

              <span>
                NFC
              </span>

              <ArrowRight size={15} />

              <span>
                Patient
              </span>

              <ArrowRight size={15} />

              <span>
                Clinical session
              </span>

            </div>

          </div>

        </div>

      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | IDENTIFYING
  |--------------------------------------------------------------------------
  */

  if (state === "identifying") {
    return (
      <section className="patient-identification-panel">

        <div className="identification-processing">

          <div className="processing-icon">
            <LoaderCircle
              size={30}
              className="spin"
            />
          </div>

          <span className="eyebrow">
            NFC IDENTIFICATION
          </span>

          <h2>
            Identifying MedCard
          </h2>

          <p>
            Connecting the card identity with
            the MedCard clinical record.
          </p>

        </div>

      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | IDENTIFIED
  |--------------------------------------------------------------------------
  */

  if (
    state === "identified" &&
    patient &&
    card &&
    encounter
  ) {
    return (
      <section className="patient-identification-panel identified">

        <div className="identification-header">

          <div>

            <span className="eyebrow">
              PATIENT IDENTIFIED
            </span>

            <h2>
              Clinical record ready
            </h2>

            <p>
              The MedCard identity has been
              verified and linked to an active
              clinical encounter.
            </p>

          </div>

          <div className="identification-status success">

            <CheckCircle2 size={16} />

            Verified

          </div>

        </div>

        {/* PATIENT SUMMARY */}

        <div className="identified-patient-card">

          <div className="identified-patient-avatar">
            {getInitials(
              patient.firstName,
              patient.lastName
            )}
          </div>

          <div className="identified-patient-main">

            <span className="eyebrow">
              PATIENT
            </span>

            <h3>
              {patient.firstName}{" "}
              {patient.lastName}
            </h3>

            <div className="identified-patient-meta">

              <span>
                {patient.patientNumber}
              </span>

              {patient.gender && (
                <span>
                  {patient.gender}
                </span>
              )}

              {patient.phone && (
                <span>
                  {patient.phone}
                </span>
              )}

            </div>

          </div>

          <div className="identified-patient-security">

            <ShieldCheck size={20} />

            <div>

              <strong>
                Identity verified
              </strong>

              <span>
                MedCard {card.cardUid}
              </span>

            </div>

          </div>

        </div>

        {/* CLINICAL CONTEXT */}

        <div className="identification-context-grid">

          <div className="identification-context-card">

            <div className="context-card-icon">
              <CreditCard size={18} />
            </div>

            <div>

              <span>
                Card
              </span>

              <strong>
                {card.status}
              </strong>

              <small>
                UID {card.cardUid}
              </small>

            </div>

          </div>

          <div className="identification-context-card">

            <div className="context-card-icon">
              <Activity size={18} />
            </div>

            <div>

              <span>
                Encounter
              </span>

              <strong>
                {encounter.status}
              </strong>

              <small>
                {encounter.type}
              </small>

            </div>

          </div>

          <div className="identification-context-card">

            <div className="context-card-icon">
              <UserRound size={18} />
            </div>

            <div>

              <span>
                Session
              </span>

              <strong>
                {session?.status ||
                  "ACTIVE"}
              </strong>

              <small>
                Clinical session
              </small>

            </div>

          </div>

        </div>

        {/* TIMELINE */}

        <div className="identification-session-info">

          <div>

            <span>
              Card last used
            </span>

            <strong>
              {formatDateTime(
                card.lastUsedAt
              )}
            </strong>

          </div>

          <div>

            <span>
              Encounter started
            </span>

            <strong>
              {formatDateTime(
                encounter.startedAt
              )}
            </strong>

          </div>

          <div>

            <span>
              Session updated
            </span>

            <strong>
              {formatDateTime(
                session?.lastActivityAt
              )}
            </strong>

          </div>

        </div>

        {/* ACTIONS */}

        <div className="identification-actions">

          <button
            type="button"
            className="identification-secondary-button"
            onClick={resetIdentification}
          >
            <Wifi size={17} />

            Scan another card
          </button>

          <button
            type="button"
            className="identification-primary-button"
            onClick={openPatientWorkspace}
          >
            <Stethoscope size={17} />

            Open Patient Workspace

            <ArrowRight size={17} />

          </button>

        </div>

      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FAILURE
  |--------------------------------------------------------------------------
  */

  return (
    <section className="patient-identification-panel">

      <div className="identification-error">

        <div className="identification-error-icon">

          <XCircle size={28} />

        </div>

        <span className="eyebrow">
          NFC IDENTIFICATION
        </span>

        <h2>
          {state === "not-registered"
            ? "Card not registered"
            : state === "not-allowed"
              ? "Card not allowed"
              : "Identification failed"}
        </h2>

        <p>
          {errorMessage ||
            "The MedCard could not be identified."}
        </p>

        <button
          type="button"
          onClick={resetIdentification}
        >
          <Wifi size={17} />

          Try another card
        </button>

      </div>

    </section>
  );
}

export default PatientIdentificationPanel;