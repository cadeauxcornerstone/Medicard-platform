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
}

/*
|--------------------------------------------------------------------------
| SCANNER STATUS
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
| PAGE
|--------------------------------------------------------------------------
*/

function NFCScannerPage() {
  const navigate = useNavigate();

  const [scannerStatus, setScannerStatus] =
    useState<ScannerStatus>("CONNECTING");

  const [statusMessage, setStatusMessage] =
    useState(
      "Connecting to the MedCard real-time service..."
    );

  const [errorMessage, setErrorMessage] =
    useState("");

  const [identifiedPatient, setIdentifiedPatient] =
    useState<IdentifiedPatient | null>(null);

  /*
  |--------------------------------------------------------------------------
  | SOCKET.IO CONNECTION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    /*
    |--------------------------------------------------------------------------
    | SOCKET CONNECTED
    |--------------------------------------------------------------------------
    */

    const handleConnect = () => {
      console.log(
        "🔌 Connected to MedCard real-time server:",
        socket.id
      );

      setScannerStatus("READY");

      setStatusMessage(
        "Waiting for MedCard..."
      );

      setErrorMessage("");
    };

    /*
    |--------------------------------------------------------------------------
    | SOCKET CONNECT ERROR
    |--------------------------------------------------------------------------
    */

    const handleConnectError = (
      error: Error
    ) => {
      console.error(
        "❌ MedCard Socket.IO connection error:",
        error
      );

      setScannerStatus("ERROR");

      setErrorMessage(
        "Unable to connect to the MedCard real-time service."
      );

      setStatusMessage(
        "Real-time connection unavailable."
      );
    };

    /*
    |--------------------------------------------------------------------------
    | PATIENT IDENTIFIED
    |--------------------------------------------------------------------------
    */

    const handlePatientIdentified = (
      event: PatientIdentifiedEvent
    ) => {
      console.log(
        "✅ Patient identified through Socket.IO:",
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

      /*
      |--------------------------------------------------------------------------
      | Resolve patient
      |--------------------------------------------------------------------------
      */

      const patient =
        result.patient ||
        null;

      /*
      |--------------------------------------------------------------------------
      | Resolve patient ID
      |--------------------------------------------------------------------------
      */

      const patientId =
        patient?.id ||
        result.patientId;

      /*
      |--------------------------------------------------------------------------
      | Resolve encounter ID
      |--------------------------------------------------------------------------
      */

      const encounterId =
        result.encounter?.id ||
        result.encounterId;

      if (!patientId) {
        console.error(
          "❌ Patient identification event did not contain patientId:",
          event
        );

        setScannerStatus("ERROR");

        setErrorMessage(
          "The card was identified, but no patient ID was returned."
        );

        setStatusMessage(
          "Identification response incomplete."
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Store identified patient
      |--------------------------------------------------------------------------
      */

      setIdentifiedPatient(
        patient
      );

      setScannerStatus("SUCCESS");

      setStatusMessage(
        event.message ||
          "Patient identified successfully."
      );

      /*
      |--------------------------------------------------------------------------
      | Navigate to patient workspace
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

      setIdentifiedPatient(null);

      setScannerStatus("ERROR");

      setStatusMessage(
        "Card identification failed."
      );

      if (
        event.code ===
        "CARD_NOT_REGISTERED"
      ) {
        setErrorMessage(
          "This MedCard is not registered in the system."
        );

        return;
      }

      if (
        event.code ===
        "CARD_NOT_ALLOWED"
      ) {
        setErrorMessage(
          "This card cannot be used at this facility."
        );

        return;
      }

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

      console.log(
        "🔌 Disconnected from MedCard real-time server"
      );
    };
  }, [navigate]);

  /*
  |--------------------------------------------------------------------------
  | RESET SCANNER
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {
    setIdentifiedPatient(null);

    setErrorMessage("");

    setScannerStatus(
      "READY"
    );

    setStatusMessage(
      "Waiting for MedCard..."
    );
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS UI
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

  return (
    <div className="nfc-page">

      {/* =================================================
          HEADER
      ================================================== */}

      <header className="nfc-page-header">

        <button
          className="back-button"
          onClick={() =>
            navigate(
              "/dashboard"
            )
          }
        >
          <ArrowLeft size={18} />

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

      {/* =================================================
          MAIN
      ================================================== */}

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

        {/* =================================================
            SCANNER CARD
        ================================================== */}

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
                    <Wifi size={42} />
                  )}

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              STATUS
          ================================================== */}

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
                "Identification error"}

            </strong>

            <span>
              {statusMessage}
            </span>

          </div>

          {/* =================================================
              IDENTIFIED PATIENT
          ================================================== */}

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

          {/* =================================================
              ERROR
          ================================================== */}

          {isError && (
            <div className="scanner-error-message">

              <AlertCircle
                size={18}
              />

              <span>
                {errorMessage}
              </span>

            </div>
          )}

          {/* =================================================
              INSTRUCTION
          ================================================== */}

          {!isSuccess && (
            <div className="scanner-instruction">

              <h2>
                {isError
                  ? "Try another card"
                  : isConnecting
                  ? "Connecting to reader service"
                  : isIdentifying
                  ? "Identifying card"
                  : "Tap patient's card"}
              </h2>

              <p>

                {isError
                  ? "Make sure the card is registered and try tapping it again."
                  : isConnecting
                  ? "Please wait while the MedCard real-time connection is established."
                  : isIdentifying
                  ? "The card has been detected. Please wait while the patient record is retrieved."
                  : "Place the NFC-enabled MedCard directly on the connected reader and keep it there until the card is detected."}

              </p>

            </div>
          )}

          {/* =================================================
              SECURITY MESSAGE
          ================================================== */}

          <div className="security-message">

            <ShieldCheck
              size={17}
            />

            <span>
              Patient information is
              retrieved securely from the
              MedCard system after
              identification.
            </span>

          </div>

        </section>

        {/* =================================================
            HELP / RESET
        ================================================== */}

        <div className="scanner-help">

          <div>

            <strong>
              {isError
                ? "Identification failed?"
                : "Having trouble?"}
            </strong>

            <p>
              {isError
                ? "Check the card registration and reader connection before trying again."
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