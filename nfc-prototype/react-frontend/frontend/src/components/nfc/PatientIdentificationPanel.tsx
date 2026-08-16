import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  UserRound,
  XCircle,
  AlertTriangle,
  RefreshCw,
  UserPlus,
} from "lucide-react";

import { socket } from "../../services/socket";


/* =========================================================
   TYPES
========================================================= */

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string;
  phone: string | null;
  email: string | null;
}

interface Card {
  id: string;
  cardUid: string;
  status: string;
  lastUsedAt: string;
}

interface IdentificationResponse {
  success: boolean;
  message: string;
  data?: {
    card: Card;
    patient: Patient;
  };
}

interface IdentificationFailedResponse {
  success: boolean;
  code:
    | "CARD_NOT_REGISTERED"
    | "CARD_NOT_ALLOWED"
    | "IDENTIFICATION_ERROR";
  message: string;
}

type ScanState =
  | "waiting"
  | "identified"
  | "not-registered"
  | "not-allowed"
  | "error";


/* =========================================================
   COMPONENT
========================================================= */

function PatientIdentificationPanel() {
  const navigate = useNavigate();

  const [scanState, setScanState] =
    useState<ScanState>("waiting");

  const [patient, setPatient] =
    useState<Patient | null>(null);

  const [card, setCard] =
    useState<Card | null>(null);

  const [message, setMessage] =
    useState("");


  /* =======================================================
     SOCKET.IO — REAL-TIME NFC EVENTS
  ======================================================== */

  useEffect(() => {

    /* -----------------------------------------------
       SUCCESSFUL CARD IDENTIFICATION
    ------------------------------------------------ */

    const handlePatientIdentified = (
      response: IdentificationResponse
    ) => {
      if (!response.success || !response.data) {
        setScanState("error");

        setMessage(
          response.message ||
            "Unable to identify this MedCard."
        );

        return;
      }

      setPatient(response.data.patient);
      setCard(response.data.card);

      setScanState("identified");

      setMessage("");
    };


    /* -----------------------------------------------
       FAILED CARD IDENTIFICATION
    ------------------------------------------------ */

    const handleIdentificationFailed = (
      response: IdentificationFailedResponse
    ) => {

      /*
       * Card does not exist in the MedCard database.
       */
      if (
        response.code === "CARD_NOT_REGISTERED"
      ) {
        setPatient(null);
        setCard(null);

        setScanState("not-registered");

        setMessage(
          "This MedCard is not registered in the MedCard system."
        );

        return;
      }


      /*
       * Card exists but cannot currently be used.
       * This covers blocked / expired / restricted cards.
       */
      if (
        response.code === "CARD_NOT_ALLOWED"
      ) {
        setPatient(null);
        setCard(null);

        setScanState("not-allowed");

        setMessage(
          response.message ||
            "This MedCard cannot currently be used."
        );

        return;
      }


      /*
       * Any unexpected identification problem.
       */
      setPatient(null);
      setCard(null);

      setScanState("error");

      setMessage(
        response.message ||
          "Unable to identify this MedCard."
      );
    };


    /* -----------------------------------------------
       REGISTER SOCKET EVENTS
    ------------------------------------------------ */

    socket.on(
      "patient:identified",
      handlePatientIdentified
    );

    socket.on(
      "card:identification-failed",
      handleIdentificationFailed
    );


    /* -----------------------------------------------
       CLEANUP
    ------------------------------------------------ */

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


  /* =======================================================
     RESET SCANNER
  ======================================================== */

  const resetScanner = () => {
    setScanState("waiting");

    setPatient(null);

    setCard(null);

    setMessage("");
  };


  /* =======================================================
     WAITING FOR CARD
  ======================================================== */

  if (scanState === "waiting") {
    return (
      <section className="patient-identification-panel waiting">

        <div className="identification-icon">
          <CreditCard size={30} />
        </div>


        <div className="identification-main">

          <span className="eyebrow">
            MEDCARD IDENTIFICATION
          </span>

          <h3>
            Ready for MedCard
          </h3>

          <p>
            Tap the patient's MedCard on the
            connected reader. Their authorized
            information will appear automatically.
          </p>

        </div>


        <div className="reader-status">

          <span className="reader-status-dot" />

          <div>
            <strong>
              Reader ready
            </strong>

            <small>
              Waiting for card
            </small>
          </div>

        </div>

      </section>
    );
  }


  /* =======================================================
     PATIENT IDENTIFIED
  ======================================================== */

  if (
    scanState === "identified" &&
    patient &&
    card
  ) {
    return (
      <section className="patient-identification-panel identified">

        {/* HEADER */}

        <div className="identified-header">

          <div className="success-icon">
            <CheckCircle2 size={27} />
          </div>


          <div className="identified-patient">

            <span className="eyebrow">
              PATIENT IDENTIFIED
            </span>

            <h3>
              {patient.firstName}{" "}
              {patient.lastName}
            </h3>

            <p>
              {patient.patientNumber}
            </p>

          </div>


          <div className="card-status active">

            <ShieldCheck size={15} />

            <span>
              {card.status}
            </span>

          </div>

        </div>


        {/* PATIENT INFORMATION */}

        <div className="patient-basic-grid">

          <div className="patient-info-item">

            <span>
              Patient Number
            </span>

            <strong>
              {patient.patientNumber}
            </strong>

          </div>


          <div className="patient-info-item">

            <span>
              Gender
            </span>

            <strong>
              {patient.gender}
            </strong>

          </div>


          <div className="patient-info-item">

            <span>
              Phone
            </span>

            <strong>
              {patient.phone || "Not provided"}
            </strong>

          </div>


          <div className="patient-info-item">

            <span>
              MedCard Status
            </span>

            <strong>
              {card.status}
            </strong>

          </div>

        </div>


        {/* SECURITY NOTICE */}

        <div className="identification-notice">

          <ShieldCheck size={17} />

          <span>
            Patient identity verified through
            the MedCard system.
          </span>

        </div>


        {/* ACTIONS */}

        <div className="identified-actions">

          <button
            type="button"
            onClick={() => {
              navigate(
                `/patients/${patient.id}`
              );
            }}
          >
            <UserRound size={17} />

            Open Patient Profile
          </button>


          <button
            type="button"
            className="secondary"
            onClick={resetScanner}
          >
            <RefreshCw size={17} />

            Scan Another Card
          </button>

        </div>

      </section>
    );
  }


  /* =======================================================
     CARD NOT REGISTERED
  ======================================================== */

  if (
    scanState === "not-registered"
  ) {
    return (
      <section className="patient-identification-panel not-registered">

        {/* ICON */}

        <div className="not-registered-icon">
          <XCircle size={32} />
        </div>


        {/* CONTENT */}

        <div className="not-registered-content">

          <span className="eyebrow">
            CARD IDENTIFICATION
          </span>

          <h3>
            MedCard not recognized
          </h3>

          <p>
            This card is not registered in the
            MedCard system. The patient's profile
            cannot be opened until the card has
            been registered.
          </p>


          {/* STATUS */}

          <div className="card-status-box">

            <div className="card-status-information">

              <span>
                Card status
              </span>

              <strong>
                Not registered
              </strong>

            </div>


            <span className="status-badge warning">
              ACTION REQUIRED
            </span>

          </div>


          {/* ACTIONS */}

          <div className="not-registered-actions">

            <button
              type="button"
              onClick={() =>
                navigate("/patients/register")
              }
            >
              <UserPlus size={17} />

              Register Patient
            </button>


            <button
              type="button"
              className="secondary"
              onClick={resetScanner}
            >
              <RefreshCw size={17} />

              Scan Again
            </button>

          </div>

        </div>

      </section>
    );
  }


  /* =======================================================
     CARD NOT ALLOWED
     BLOCKED / EXPIRED / RESTRICTED
  ======================================================== */

  if (
    scanState === "not-allowed"
  ) {
    return (
      <section className="patient-identification-panel not-allowed">

        <div className="not-allowed-icon">
          <AlertTriangle size={32} />
        </div>


        <div className="not-allowed-content">

          <span className="eyebrow">
            CARD ACCESS RESTRICTED
          </span>

          <h3>
            This MedCard cannot be used
          </h3>

          <p>
            {message}
          </p>


          <div className="card-status-box">

            <div className="card-status-information">

              <span>
                Card status
              </span>

              <strong>
                Access restricted
              </strong>

            </div>


            <span className="status-badge restricted">
              RESTRICTED
            </span>

          </div>


          <div className="not-registered-actions">

            <button
              type="button"
              className="secondary"
              onClick={resetScanner}
            >
              <RefreshCw size={17} />

              Scan Another Card
            </button>

          </div>

        </div>

      </section>
    );
  }


  /* =======================================================
     GENERAL ERROR
  ======================================================== */

  return (
    <section className="patient-identification-panel error">

      <div className="error-icon">
        <XCircle size={32} />
      </div>


      <div className="error-content">

        <span className="eyebrow">
          IDENTIFICATION ERROR
        </span>

        <h3>
          We couldn't identify this card
        </h3>

        <p>
          {message ||
            "Something went wrong while identifying the MedCard. Please try again."}
        </p>


        <div className="error-actions">

          <button
            type="button"
            onClick={resetScanner}
          >
            <RefreshCw size={17} />

            Try Again
          </button>

        </div>

      </div>

    </section>
  );
}


export default PatientIdentificationPanel;