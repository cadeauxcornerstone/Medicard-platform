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
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";


/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const SOCKET_URL = "http://localhost:5000";

const PENDING_CARD_KEY =
  "medcard_pending_card_uid";


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


/*
|--------------------------------------------------------------------------
| NFC SCANNER PAGE
|--------------------------------------------------------------------------
*/

function NFCScannerPage() {

  const navigate = useNavigate();


  const [scannerStatus, setScannerStatus] =
    useState<ScannerStatus>(
      "CONNECTING"
    );


  const [statusMessage, setStatusMessage] =
    useState(
      "Connecting to the MedCard real-time service..."
    );


  const [errorMessage, setErrorMessage] =
    useState("");


  const [identifiedPatient, setIdentifiedPatient] =
    useState<IdentifiedPatient | null>(
      null
    );


  const [unregisteredCardUid, setUnregisteredCardUid] =
    useState("");


  /*
  |--------------------------------------------------------------------------
  | SOCKET.IO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const socket = io(
      SOCKET_URL,
      {
        transports: ["websocket"],
      }
    );


    /*
    |--------------------------------------------------------------------------
    | CONNECT
    |--------------------------------------------------------------------------
    */

    const handleConnect = () => {

      console.log(
        "🔌 MedCard Socket.IO connected:",
        socket.id
      );


      setScannerStatus(
        "READY"
      );


      setStatusMessage(
        "Waiting for MedCard..."
      );


      setErrorMessage("");

    };


    /*
    |--------------------------------------------------------------------------
    | CONNECTION ERROR
    |--------------------------------------------------------------------------
    */

    const handleConnectError = (
      error: Error
    ) => {

      console.error(
        "❌ Socket.IO connection error:",
        error
      );


      setScannerStatus(
        "ERROR"
      );


      setStatusMessage(
        "Real-time connection unavailable."
      );


      setErrorMessage(
        "Unable to connect to the MedCard real-time service."
      );

    };


    /*
    |--------------------------------------------------------------------------
    | REGISTERED CARD
    |--------------------------------------------------------------------------
    |
    | Existing working flow.
    |
    */

    const handlePatientIdentified = (
      event: PatientIdentifiedEvent
    ) => {

      console.log(
        "✅ Patient identified:",
        event
      );


      if (
        !event ||
        event.success !== true
      ) {
        return;
      }


      const result =
        event.data || {};


      const patient =
        result.patient || null;


      const patientId =
        patient?.id ||
        result.patientId;


      const encounterId =
        result.encounter?.id ||
        result.encounterId;


      if (!patientId) {

        console.error(
          "❌ No patient ID returned:",
          event
        );


        setScannerStatus(
          "ERROR"
        );


        setStatusMessage(
          "Identification response incomplete."
        );


        setErrorMessage(
          "The card was identified, but no patient ID was returned."
        );


        return;
      }


      /*
      |--------------------------------------------------------------------------
      | Registered card identified successfully
      |--------------------------------------------------------------------------
      */

      sessionStorage.removeItem(
        PENDING_CARD_KEY
      );


      setIdentifiedPatient(
        patient
      );


      setUnregisteredCardUid(
        ""
      );


      setErrorMessage(
        ""
      );


      setScannerStatus(
        "SUCCESS"
      );


      setStatusMessage(
        event.message ||
        "Patient identified successfully."
      );


      /*
      |--------------------------------------------------------------------------
      | PATIENT WORKSPACE
      |--------------------------------------------------------------------------
      */

      window.setTimeout(() => {

        const search =
          encounterId
            ? `?encounterId=${encodeURIComponent(
                encounterId
              )}`
            : "";


        navigate(
          `/patients/${encodeURIComponent(
            patientId
          )}${search}`,
          {
            replace: true,
          }
        );

      }, 700);

    };


    /*
    |--------------------------------------------------------------------------
    | CARD IDENTIFICATION FAILED
    |--------------------------------------------------------------------------
    */

    const handleIdentificationFailed = (
      event: IdentificationFailedEvent
    ) => {

      console.warn(
        "⚠️ Card identification failed:",
        event
      );


      /*
      |--------------------------------------------------------------------------
      | UNREGISTERED CARD
      |--------------------------------------------------------------------------
      */

      if (
        event.code ===
        "CARD_NOT_REGISTERED"
      ) {

        /*
        |--------------------------------------------------------------------------
        | GET UID
        |--------------------------------------------------------------------------
        */

        const cardUid =
          event.cardUid ||
          event.data?.cardUid ||
          "";


        console.log(
          "💳 CARD_NOT_REGISTERED EVENT:",
          event
        );


        console.log(
          "💳 RESOLVED CARD UID:",
          cardUid
        );


        /*
        |--------------------------------------------------------------------------
        | UID NOT RECEIVED
        |--------------------------------------------------------------------------
        */

        if (!cardUid) {

          console.error(
            "❌ No card UID received from backend."
          );


          setScannerStatus(
            "ERROR"
          );


          setStatusMessage(
            "Card identification failed."
          );


          setErrorMessage(
            "The card was detected, but its card ID was not received."
          );


          return;
        }


        /*
        |--------------------------------------------------------------------------
        | SAVE UID
        |--------------------------------------------------------------------------
        |
        | This is the important part.
        |
        | The exact card UID from the FIRST scan is saved.
        |
        */

        sessionStorage.setItem(
          PENDING_CARD_KEY,
          cardUid
        );


        /*
        |--------------------------------------------------------------------------
        | VERIFY STORAGE
        |--------------------------------------------------------------------------
        */

        const savedUid =
          sessionStorage.getItem(
            PENDING_CARD_KEY
          );


        console.log(
          "💾 SAVED CARD UID:",
          savedUid
        );


        setUnregisteredCardUid(
          cardUid
        );


        setScannerStatus(
          "ERROR"
        );


        setStatusMessage(
          "Card detected. Opening registration..."
        );


        setErrorMessage(
          "This MedCard is not registered yet."
        );


        /*
        |--------------------------------------------------------------------------
        | MANUAL BROWSER NAVIGATION
        |--------------------------------------------------------------------------
        |
        | We intentionally DO NOT use navigate() here.
        |
        | This completely bypasses React Router navigation
        | for the unregistered-card flow.
        |
        */

        console.log(
          "🚀 MANUAL NAVIGATION STARTING..."
        );


        console.log(
          "🚀 Current URL:",
          window.location.href
        );


        console.log(
          "🚀 Destination:",
          "/register-patient"
        );


        window.location.href =
          "/register-patient";


        return;
      }


      /*
      |--------------------------------------------------------------------------
      | CARD NOT ALLOWED
      |--------------------------------------------------------------------------
      */

      if (
        event.code ===
        "CARD_NOT_ALLOWED"
      ) {

        setScannerStatus(
          "ERROR"
        );


        setStatusMessage(
          "Card identification failed."
        );


        setErrorMessage(
          event.message ||
          "This card cannot be used at this facility."
        );


        return;
      }


      /*
      |--------------------------------------------------------------------------
      | OTHER ERRORS
      |--------------------------------------------------------------------------
      */

      setScannerStatus(
        "ERROR"
      );


      setStatusMessage(
        "Card identification failed."
      );


      setErrorMessage(
        event.message ||
        "Unable to identify this card."
      );

    };


    /*
    |--------------------------------------------------------------------------
    | REGISTER SOCKET EVENTS
    |--------------------------------------------------------------------------
    */

    socket.on(
      "connect",
      handleConnect
    );


    socket.on(
      "connect_error",
      handleConnectError
    );


    socket.on(
      "patient:identified",
      handlePatientIdentified
    );


    socket.on(
      "card:identification-failed",
      handleIdentificationFailed
    );


    /*
    |--------------------------------------------------------------------------
    | CLEANUP
    |--------------------------------------------------------------------------
    */

    return () => {

      socket.off(
        "connect",
        handleConnect
      );


      socket.off(
        "connect_error",
        handleConnectError
      );


      socket.off(
        "patient:identified",
        handlePatientIdentified
      );


      socket.off(
        "card:identification-failed",
        handleIdentificationFailed
      );


      socket.disconnect();

    };

  }, [navigate]);


  /*
  |--------------------------------------------------------------------------
  | RESET
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {

    sessionStorage.removeItem(
      PENDING_CARD_KEY
    );


    setIdentifiedPatient(
      null
    );


    setUnregisteredCardUid(
      ""
    );


    setErrorMessage(
      ""
    );


    setScannerStatus(
      "READY"
    );


    setStatusMessage(
      "Waiting for MedCard..."
    );

  };


  /*
  |--------------------------------------------------------------------------
  | STATUS HELPERS
  |--------------------------------------------------------------------------
  */

  const isConnecting =
    scannerStatus ===
    "CONNECTING";


  const isIdentifying =
    scannerStatus ===
    "IDENTIFYING";


  const isSuccess =
    scannerStatus ===
    "SUCCESS";


  const isError =
    scannerStatus ===
    "ERROR";


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="nfc-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="nfc-page-header">

        <button
          className="back-button"
          onClick={() =>
            navigate(
              "/dashboard"
            )
          }
        >

          <ArrowLeft
            size={18}
          />

          Back to dashboard

        </button>


        <div className="nfc-page-brand">

          <div className="brand-mark small">

            <CreditCard
              size={20}
            />

          </div>


          <div>

            <strong>
              Med<span>Card</span>
            </strong>


            <small>
              NFC Patient Identification
            </small>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="nfc-scanner-content">

        <div className="nfc-scanner-header">

          <span className="eyebrow">
            PATIENT IDENTIFICATION
          </span>


          <h1>
            Scan MedCard
          </h1>


          <p>
            Use the connected NFC reader to
            identify a patient securely.
          </p>

        </div>


        {/* =====================================================
            SCANNER
        ====================================================== */}

        <section className="scanner-card">

          <div className="scanner-visual">

            <div className="scanner-ring outer">

              <div className="scanner-ring middle">

                <div className="scanner-icon">

                  {isConnecting ||
                  isIdentifying ? (

                    <LoaderCircle
                      size={42}
                      className="spin"
                    />

                  ) : isSuccess ? (

                    <CheckCircle2
                      size={42}
                    />

                  ) : isError ? (

                    <AlertCircle
                      size={42}
                    />

                  ) : (

                    <Wifi
                      size={42}
                    />

                  )}

                </div>

              </div>

            </div>

          </div>


          {/* =====================================================
              STATUS
          ====================================================== */}

          <div className="scanner-status">

            <span
              className={`status-indicator ${
                isError
                  ? "error"
                  : isSuccess
                  ? "success"
                  : ""
              }`}
            />


            <strong>

              {isConnecting &&
                "Connecting..."}


              {scannerStatus ===
                "READY" &&
                "Reader ready"}


              {isIdentifying &&
                "Card detected"}


              {isSuccess &&
                "Patient identified"}


              {isError &&
                (
                  unregisteredCardUid
                    ? "Card not registered"
                    : "Identification error"
                )}

            </strong>


            <span>
              {statusMessage}
            </span>

          </div>


          {/* =====================================================
              PATIENT
          ====================================================== */}

          {isSuccess &&
            identifiedPatient && (

              <div
                className="scanner-identified-patient"
              >

                <div>

                  <span className="eyebrow">
                    PATIENT
                  </span>


                  <h2>

                    {
                      identifiedPatient
                        .firstName ||
                      ""
                    }{" "}

                    {
                      identifiedPatient
                        .lastName ||
                      ""
                    }

                  </h2>


                  {identifiedPatient.patientNumber && (

                    <p>

                      Patient number:{" "}

                      <strong>

                        {
                          identifiedPatient
                            .patientNumber
                        }

                      </strong>

                    </p>

                  )}

                </div>


                <CheckCircle2
                  size={28}
                />

              </div>

            )}


          {/* =====================================================
              ERROR
          ====================================================== */}

          {isError && (

            <div
              className="scanner-error-message"
            >

              <AlertCircle
                size={18}
              />


              <span>
                {errorMessage}
              </span>

            </div>

          )}


          {/* =====================================================
              INSTRUCTION
          ====================================================== */}

          {!isSuccess && (

            <div
              className="scanner-instruction"
            >

              <h2>

                {isError
                  ? unregisteredCardUid
                    ? "Opening patient registration..."
                    : "Try another card"

                  : isConnecting
                  ? "Connecting to reader service"

                  : isIdentifying
                  ? "Identifying card"

                  : "Tap patient's card"}

              </h2>


              <p>

                {isError
                  ? unregisteredCardUid
                    ? "The card was detected successfully. Opening the patient registration page."

                    : "Make sure the card is registered and try tapping it again."

                  : isConnecting
                  ? "Please wait while the MedCard real-time connection is established."

                  : isIdentifying
                  ? "The card has been detected. Please wait while the patient record is retrieved."

                  : "Place the NFC-enabled MedCard directly on the connected reader and keep it there until the card is detected."}

              </p>

            </div>

          )}


          {/* =====================================================
              SECURITY
          ====================================================== */}

          <div
            className="security-message"
          >

            <ShieldCheck
              size={17}
            />


            <span>

              Patient information is retrieved
              securely from the MedCard system
              after identification.

            </span>

          </div>

        </section>


        {/* =====================================================
            HELP
        ====================================================== */}

        <div
          className="scanner-help"
        >

          <div>

            <strong>

              {isError
                ? "Identification failed?"
                : "Having trouble?"}

            </strong>


            <p>

              {isError
                ? unregisteredCardUid
                  ? "The card has been detected and is being prepared for registration."
                  : "Check the card registration and reader connection before trying again."

                : "Make sure the NFC reader is connected to this workstation and ready to scan."}

            </p>

          </div>


          <button
            type="button"
            onClick={
              handleReset
            }
          >

            <RefreshCw
              size={16}
            />


            {isError
              ? "Try again"
              : "Reset scanner"}

          </button>

        </div>

      </main>

    </div>
  );
}


export default NFCScannerPage;