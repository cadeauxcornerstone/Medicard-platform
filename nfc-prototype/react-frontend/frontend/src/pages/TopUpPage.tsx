import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ArrowLeft,
} from "lucide-react";
import { io } from "socket.io-client";

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

const SOCKET_URL = "http://localhost:5000";

export default function TopUpPage() {
  const navigate = useNavigate();

  const [patient, setPatient] =
    useState<Patient | null>(null);

  const [card, setCard] =
    useState<Card | null>(null);

  const [wallet, setWallet] =
    useState<WalletType | null>(null);

  const [amount, setAmount] =
    useState("");

  const [description, setDescription] =
    useState("Wallet top-up by Reception");

  const [scanning, setScanning] =
    useState(true);

  const [processing, setProcessing] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | NFC IDENTIFICATION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    console.log(
      "TopUpPage: connecting to MedCard Socket.IO..."
    );

    const handlePatientIdentified = async (
      event: IdentificationEvent
    ) => {
      console.log(
        "TopUpPage: patient:identified received:",
        event
      );

      /*
      --------------------------------------------------------------
      IMPORTANT:
      Backend emits:
      
      {
        success: true,
        data: {
          card: {...},
          patient: {...}
        }
      }
      --------------------------------------------------------------
      */

      const identifiedPatient =
        event?.data?.patient;

      const identifiedCard =
        event?.data?.card;

      if (!identifiedPatient?.id) {
        console.error(
          "TopUpPage: patient missing from NFC event",
          event
        );

        setError(
          "Card detected, but patient information was not returned."
        );

        return;
      }

      /*
      --------------------------------------------------------------
      STORE THE EXACT PATIENT + CARD THAT WAS TAPPED
      --------------------------------------------------------------
      */

      setPatient(identifiedPatient);
      setCard(identifiedCard || null);

      setScanning(false);
      setProcessing(false);

      setSuccess("");
      setError("");

      /*
      --------------------------------------------------------------
      LOAD WALLET BELONGING TO THIS PATIENT
      --------------------------------------------------------------
      */

      try {
        console.log(
          "TopUpPage: loading wallet for patient:",
          identifiedPatient.id
        );

        const walletData =
          await getWallet(
            identifiedPatient.id
          );

        console.log(
          "TopUpPage: wallet loaded:",
          walletData
        );

        setWallet(walletData);
      } catch (walletError) {
        console.error(
          "TopUpPage: wallet loading failed:",
          walletError
        );

        setWallet(null);

        setError(
          "Patient identified, but their wallet could not be loaded."
        );
      }
    };

    const handleIdentificationFailed = (
      event: {
        success?: boolean;
        message?: string;
      }
    ) => {
      console.log(
        "TopUpPage: identification failed:",
        event
      );

      setPatient(null);
      setCard(null);
      setWallet(null);

      setScanning(true);

      setError(
        event?.message ||
          "Card identification failed."
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

    socket.on("connect", () => {
      console.log(
        "TopUpPage: Socket.IO connected:",
        socket.id
      );
    });

    socket.on("connect_error", (err) => {
      console.error(
        "TopUpPage: Socket.IO connection error:",
        err
      );
    });

    return () => {
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
  }, []);

  /*
  |--------------------------------------------------------------------------
  | TOP UP
  |--------------------------------------------------------------------------
  */

  const handleTopUp = async () => {
    if (!patient?.id) {
      setError(
        "Tap a patient's MedCard first."
      );
      return;
    }

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError(
        "Enter a valid amount greater than zero."
      );
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      console.log(
        "TopUpPage: topping up patient:",
        patient.id,
        "amount:",
        numericAmount
      );

      const result =
        await topUpWallet(
          patient.id,
          {
            amount: numericAmount,
            description,
          }
        );

      /*
      --------------------------------------------------------------
      UPDATE DISPLAYED WALLET BALANCE
      --------------------------------------------------------------
      */

      setWallet(result.wallet);

      setSuccess(
        `${formatRwf(
          numericAmount
        )} successfully added to ${
          patient.firstName
        } ${patient.lastName}'s wallet.`
      );

      setAmount("");
    } catch (topUpError: any) {
      console.error(
        "TopUpPage: top-up failed:",
        topUpError
      );

      const message =
        topUpError?.response?.data?.message ||
        topUpError?.message ||
        "Unable to top up wallet.";

      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SCAN ANOTHER CARD
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

  /*
  |--------------------------------------------------------------------------
  | FORMAT MONEY
  |--------------------------------------------------------------------------
  */

  const formatRwf = (
    value: number | string
  ) => {
    const numeric =
      Number(value);

    if (
      !Number.isFinite(numeric)
    ) {
      return "0 RWF";
    }

    return `${numeric.toLocaleString(
      "en-RW"
    )} RWF`;
  };

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="topup-page">

      {/* =========================================================
          HEADER
      ========================================================== */}

      <div className="topup-page-header">

        <button
          type="button"
          className="topup-back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div>

          <div className="topup-eyebrow">
            <Wallet size={15} />
            Reception Wallet Service
          </div>

          <h1>
            Patient Wallet Top Up
          </h1>

          <p>
            Tap a MedCard to identify the
            patient and add funds to their
            wallet.
          </p>

        </div>

      </div>

      {/* =========================================================
          CONTENT
      ========================================================== */}

      <div className="topup-grid">

        {/* =======================================================
            PATIENT IDENTIFICATION
        ======================================================== */}

        <section className="topup-card">

          <div className="topup-card-header">

            <div className="topup-card-icon">
              <CreditCard size={22} />
            </div>

            <div>
              <h2>
                Identify Patient
              </h2>

              <p>
                Tap the patient's MedCard
                on the NFC reader.
              </p>
            </div>

          </div>

          {!patient ? (

            <div className="topup-scanner">

              <div className="topup-scanner-animation">

                {scanning ? (
                  <CreditCard size={42} />
                ) : (
                  <LoaderCircle
                    size={42}
                    className="topup-spin"
                  />
                )}

              </div>

              <h3>
                {scanning
                  ? "Waiting for MedCard"
                  : "Identifying patient..."}
              </h3>

              <p>
                Place the patient's MedCard
                on the connected NFC reader.
              </p>

              <div className="topup-reader-status">
                <span />
                NFC Reader Ready
              </div>

            </div>

          ) : (

            <div className="topup-patient-confirmed">

              <div className="topup-success-icon">
                <CheckCircle2 size={25} />
              </div>

              <div className="topup-patient-info">

                <span>
                  Patient identified from MedCard
                </span>

                <strong>
                  {patient.firstName}{" "}
                  {patient.lastName}
                </strong>

                <small>
                  Patient No:{" "}
                  {patient.patientNumber ||
                    "N/A"}
                </small>

                {card?.cardUid && (
                  <small>
                    Card UID:{" "}
                    {card.cardUid}
                  </small>
                )}

              </div>

              <button
                type="button"
                className="topup-scan-again-btn"
                onClick={
                  handleScanAnother
                }
                disabled={processing}
              >
                Scan Another
              </button>

            </div>

          )}

        </section>

        {/* =======================================================
            WALLET
        ======================================================== */}

        <section className="topup-card">

          <div className="topup-card-header">

            <div className="topup-card-icon">
              <Wallet size={22} />
            </div>

            <div>

              <h2>
                MedCard Wallet
              </h2>

              <p>
                Wallet belonging to the
                tapped patient.
              </p>

            </div>

          </div>

          {!patient ? (

            <div className="topup-empty-wallet">

              <Wallet size={42} />

              <h3>
                No patient selected
              </h3>

              <p>
                Tap a MedCard to load
                the patient's wallet.
              </p>

            </div>

          ) : (

            <>
              {/* =================================================
                  BALANCE
              ================================================== */}

              <div className="topup-balance-box">

                <span>
                  Current Balance
                </span>

                <strong>
                  {formatRwf(
                    wallet?.balance ?? 0
                  )}
                </strong>

                <small>
                  {wallet?.currency ||
                    "RWF"}
                  {" • "}
                  {wallet?.status ||
                    "ACTIVE"}
                </small>

              </div>

              {/* =================================================
                  FORM
              ================================================== */}

              <div className="topup-form">

                <label htmlFor="topup-amount">
                  Amount to Add
                </label>

                <div className="topup-amount-input">

                  <input
                    id="topup-amount"
                    type="number"
                    min="1"
                    step="100"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) =>
                      setAmount(
                        e.target.value
                      )
                    }
                    disabled={processing}
                  />

                  <span>
                    RWF
                  </span>

                </div>

                {/* QUICK AMOUNTS */}

                <div className="topup-quick-amounts">

                  {[5000, 10000, 20000, 50000].map(
                    (quickAmount) => (

                      <button
                        key={quickAmount}
                        type="button"
                        onClick={() =>
                          setAmount(
                            String(
                              quickAmount
                            )
                          )
                        }
                        disabled={
                          processing
                        }
                      >
                        {quickAmount.toLocaleString()}
                      </button>

                    )
                  )}

                </div>

                <label htmlFor="topup-description">
                  Description
                </label>

                <input
                  id="topup-description"
                  type="text"
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  disabled={processing}
                />

                {/* =================================================
                    SUBMIT
                ================================================== */}

                <button
                  type="button"
                  className="topup-submit-btn"
                  onClick={
                    handleTopUp
                  }
                  disabled={
                    processing ||
                    !patient ||
                    !amount ||
                    Number(amount) <= 0
                  }
                >

                  {processing ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="topup-spin"
                      />

                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet size={18} />

                      Top Up Wallet
                    </>
                  )}

                </button>

              </div>
            </>
          )}

        </section>

      </div>

      {/* =========================================================
          SUCCESS MESSAGE
      ========================================================== */}

      {success && (

        <div className="topup-message topup-message-success">

          <CheckCircle2 size={19} />

          <span>
            {success}
          </span>

        </div>

      )}

      {/* =========================================================
          ERROR MESSAGE
      ========================================================== */}

      {error && (

        <div className="topup-message topup-message-error">

          <AlertCircle size={19} />

          <span>
            {error}
          </span>

        </div>

      )}

    </div>
  );
}