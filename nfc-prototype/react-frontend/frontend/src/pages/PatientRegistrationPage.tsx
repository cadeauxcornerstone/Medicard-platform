import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  UserRoundPlus,
  LoaderCircle,
  AlertCircle,
  Wifi,
  RefreshCw,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import { io } from "socket.io-client";


/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_URL =
  "http://localhost:5000/api/v1";

const SOCKET_URL =
  "http://localhost:5000";

const PENDING_CARD_KEY =
  "medcard_pending_card_uid";


/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type Gender =
  | "MALE"
  | "FEMALE"
  | "OTHER"
  | "UNKNOWN";


type CardStatus =
  | "WAITING"
  | "CHECKING"
  | "AVAILABLE"
  | "DUPLICATE"
  | "ERROR";


interface PatientForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email: string;
}


interface CreatedPatient {
  id: string;
  patientNumber?: string;
  firstName: string;
  lastName: string;
}


interface PatientIdentifiedEvent {
  success: boolean;
  message?: string;

  data?: {
    card?: {
      id?: string;
      cardUid?: string;
      status?: string;
    };

    patient?: {
      id?: string;
      patientNumber?: string;
      firstName?: string;
      lastName?: string;
    };

    [key: string]: unknown;
  };
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
| PAGE
|--------------------------------------------------------------------------
*/

function PatientRegistrationPage() {

  const navigate = useNavigate();


  /*
  |--------------------------------------------------------------------------
  | CARD STATE
  |--------------------------------------------------------------------------
  */

  const [cardUid, setCardUid] =
    useState("");


  const [cardStatus, setCardStatus] =
    useState<CardStatus>(
      "WAITING"
    );


  const [cardMessage, setCardMessage] =
    useState(
      "Place the patient's MedCard on the NFC reader."
    );


  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  const [form, setForm] =
    useState<PatientForm>({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "UNKNOWN",
      phone: "",
      email: "",
    });


  /*
  |--------------------------------------------------------------------------
  | SUBMISSION STATE
  |--------------------------------------------------------------------------
  */

  const [submitting, setSubmitting] =
    useState(false);


  const [success, setSuccess] =
    useState(false);


  const [errorMessage, setErrorMessage] =
    useState("");


  const [createdPatient, setCreatedPatient] =
    useState<CreatedPatient | null>(
      null
    );


  /*
  |--------------------------------------------------------------------------
  | CHECK CARD DUPLICATE
  |--------------------------------------------------------------------------
  */

  const checkCardAvailability = async (
    uid: string
  ) => {

    const normalizedUid =
      uid.trim();


    if (!normalizedUid) {

      setCardStatus(
        "ERROR"
      );

      setCardMessage(
        "The NFC reader returned an empty card ID."
      );

      return false;
    }


    setCardStatus(
      "CHECKING"
    );


    setCardMessage(
      "Checking whether this MedCard is already registered..."
    );


    setErrorMessage("");


    try {

      /*
      |--------------------------------------------------------------------------
      | Existing card lookup
      |--------------------------------------------------------------------------
      */

      const response =
        await axios.get(
          `${API_URL}/cards/${encodeURIComponent(
            normalizedUid
          )}`
        );


      /*
      |--------------------------------------------------------------------------
      | CARD EXISTS
      |--------------------------------------------------------------------------
      */

      if (
        response.status >= 200 &&
        response.status < 300
      ) {

        const existingPatient =
          response.data?.data?.patient;


        setCardStatus(
          "DUPLICATE"
        );


        setCardMessage(
          existingPatient
            ? `This card is already linked to ${existingPatient.firstName || ""} ${existingPatient.lastName || ""}.`
            : "This MedCard is already registered."
        );


        setErrorMessage(
          "This physical MedCard cannot be assigned to another patient."
        );


        return false;
      }


      return false;

    } catch (error: any) {

      /*
      |--------------------------------------------------------------------------
      | 404 = CARD AVAILABLE
      |--------------------------------------------------------------------------
      */

      if (
        error?.response?.status ===
        404
      ) {

        setCardStatus(
          "AVAILABLE"
        );


        setCardMessage(
          "New MedCard detected. It is available to be linked."
        );


        setErrorMessage("");


        return true;
      }


      /*
      |--------------------------------------------------------------------------
      | Other API error
      |--------------------------------------------------------------------------
      */

      console.error(
        "❌ Card availability check failed:",
        error
      );


      setCardStatus(
        "ERROR"
      );


      setCardMessage(
        "Unable to verify this MedCard."
      );


      setErrorMessage(
        error?.response?.data?.message ||
        "Unable to verify the card. Please try again."
      );


      return false;
    }

  };


  /*
  |--------------------------------------------------------------------------
  | NFC SOCKET
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    console.log(
      "📡 Starting registration NFC listener..."
    );


    const socket =
      io(
        SOCKET_URL,
        {
          transports: ["websocket"],
        }
      );


    /*
    |--------------------------------------------------------------------------
    | SOCKET CONNECT
    |--------------------------------------------------------------------------
    */

    const handleConnect = () => {

      console.log(
        "🔌 Registration NFC socket connected:",
        socket.id
      );


      /*
      |--------------------------------------------------------------------------
      | If a UID was already saved by the previous scanner flow,
      | check it automatically.
      |--------------------------------------------------------------------------
      */

      const pendingUid =
        sessionStorage.getItem(
          PENDING_CARD_KEY
        );


      if (pendingUid) {

        console.log(
          "💳 Found pending card UID:",
          pendingUid
        );


        setCardUid(
          pendingUid
        );


        void checkCardAvailability(
          pendingUid
        );

      }

    };


    /*
    |--------------------------------------------------------------------------
    | SOCKET CONNECTION ERROR
    |--------------------------------------------------------------------------
    */

    const handleConnectError = (
      error: Error
    ) => {

      console.error(
        "❌ Registration NFC socket error:",
        error
      );


      setCardStatus(
        "ERROR"
      );


      setCardMessage(
        "Unable to connect to the MedCard reader service."
      );

    };


    /*
    |--------------------------------------------------------------------------
    | REGISTERED CARD
    |--------------------------------------------------------------------------
    |
    | If an already registered card is scanned while on this page,
    | patient:identified will be emitted.
    |
    | We treat that as a duplicate.
    |
    */

    const handlePatientIdentified = (
      event: PatientIdentifiedEvent
    ) => {

      console.log(
        "⚠️ Registered card detected on registration page:",
        event
      );


      const uid =
        event.data?.card?.cardUid ||
        "";


      if (!uid) {

        /*
        |--------------------------------------------------------------------------
        | If the event does not contain the UID,
        | don't destroy the current registration state.
        |--------------------------------------------------------------------------
        */

        return;
      }


      setCardUid(
        uid
      );


      setCardStatus(
        "DUPLICATE"
      );


      const existingPatient =
        event.data?.patient;


      if (existingPatient) {

        setCardMessage(
          `This card is already linked to ${existingPatient.firstName || ""} ${existingPatient.lastName || ""}.`
        );

      } else {

        setCardMessage(
          "This MedCard is already registered."
        );

      }


      setErrorMessage(
        "This physical MedCard cannot be assigned to another patient."
      );


      /*
      |--------------------------------------------------------------------------
      | Make sure this UID isn't accidentally retained
      | as a new registration card.
      |--------------------------------------------------------------------------
      */

      sessionStorage.removeItem(
        PENDING_CARD_KEY
      );

    };


    /*
    |--------------------------------------------------------------------------
    | UNREGISTERED CARD
    |--------------------------------------------------------------------------
    */

    const handleIdentificationFailed = (
      event: IdentificationFailedEvent
    ) => {

      console.log(
        "📡 Registration page identification event:",
        event
      );


      if (
        event.code !==
        "CARD_NOT_REGISTERED"
      ) {

        return;
      }


      /*
      |--------------------------------------------------------------------------
      | Resolve UID
      |--------------------------------------------------------------------------
      */

      const uid =
        event.cardUid ||
        event.data?.cardUid ||
        "";


      console.log(
        "💳 Registration page received UID:",
        uid
      );


      if (!uid) {

        setCardStatus(
          "ERROR"
        );


        setCardMessage(
          "Card detected, but the NFC reader did not provide a card ID."
        );


        setErrorMessage(
          "Unable to read the MedCard ID."
        );


        return;
      }


      /*
      |--------------------------------------------------------------------------
      | Save UID
      |--------------------------------------------------------------------------
      */

      sessionStorage.setItem(
        PENDING_CARD_KEY,
        uid
      );


      setCardUid(
        uid
      );


      /*
      |--------------------------------------------------------------------------
      | Check duplicate
      |--------------------------------------------------------------------------
      */

      void checkCardAvailability(
        uid
      );

    };


    /*
    |--------------------------------------------------------------------------
    | REGISTER LISTENERS
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

      console.log(
        "🧹 Closing registration NFC listener..."
      );


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

  }, []);


  /*
  |--------------------------------------------------------------------------
  | FORM UPDATE
  |--------------------------------------------------------------------------
  */

  const updateField = (
    field: keyof PatientForm,
    value: string
  ) => {

    setForm(
      previous => ({
        ...previous,
        [field]: value,
      })
    );


    if (errorMessage) {

      setErrorMessage("");

    }

  };


  /*
  |--------------------------------------------------------------------------
  | RESET CARD
  |--------------------------------------------------------------------------
  */

  const handleResetCard = () => {

    sessionStorage.removeItem(
      PENDING_CARD_KEY
    );


    setCardUid(
      ""
    );


    setCardStatus(
      "WAITING"
    );


    setCardMessage(
      "Place the patient's MedCard on the NFC reader."
    );


    setErrorMessage("");

  };


  /*
  |--------------------------------------------------------------------------
  | SUBMIT REGISTRATION
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();


    setErrorMessage("");


    /*
    |--------------------------------------------------------------------------
    | CARD REQUIRED
    |--------------------------------------------------------------------------
    */

    if (
      !cardUid
    ) {

      setErrorMessage(
        "Please scan a MedCard before registering the patient."
      );


      return;
    }


    /*
    |--------------------------------------------------------------------------
    | CARD MUST BE AVAILABLE
    |--------------------------------------------------------------------------
    */

    if (
      cardStatus !==
      "AVAILABLE"
    ) {

      if (
        cardStatus ===
        "DUPLICATE"
      ) {

        setErrorMessage(
          "This MedCard is already registered. Please use a new card."
        );

      } else {

        setErrorMessage(
          "Please wait until a valid, available MedCard has been detected."
        );

      }


      return;
    }


    /*
    |--------------------------------------------------------------------------
    | FORM VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !form.firstName.trim()
    ) {

      setErrorMessage(
        "First name is required."
      );


      return;
    }


    if (
      !form.lastName.trim()
    ) {

      setErrorMessage(
        "Last name is required."
      );


      return;
    }


    setSubmitting(
      true
    );


    try {

      /*
      |--------------------------------------------------------------------------
      | STEP 1
      | CREATE PATIENT
      |--------------------------------------------------------------------------
      */

      console.log(
        "👤 Creating patient..."
      );


      const patientResponse =
        await axios.post(
          `${API_URL}/patients`,
          {
            firstName:
              form.firstName.trim(),

            lastName:
              form.lastName.trim(),

            dateOfBirth:
              form.dateOfBirth ||
              null,

            gender:
              form.gender,

            phone:
              form.phone.trim() ||
              null,

            email:
              form.email.trim() ||
              null,
          }
        );


      const patient =
        patientResponse.data?.data;


      if (
        !patient?.id
      ) {

        throw new Error(
          "Patient was created but no patient ID was returned."
        );

      }


      console.log(
        "✅ Patient created:",
        patient
      );


      setCreatedPatient(
        patient
      );


      /*
      |--------------------------------------------------------------------------
      | STEP 2
      | LINK CARD
      |--------------------------------------------------------------------------
      */

      console.log(
        "💳 Linking card:",
        cardUid
      );


      try {

        await axios.post(
          `${API_URL}/cards`,
          {
            cardUid,
            patientId:
              patient.id,
          }
        );

      } catch (cardError: any) {

        /*
        |--------------------------------------------------------------------------
        | DUPLICATE CARD RACE CONDITION
        |--------------------------------------------------------------------------
        |
        | Even though we checked before submission,
        | another workstation could have registered the card
        | between our GET and POST.
        |
        | Backend 409 remains the final protection.
        |--------------------------------------------------------------------------
        */

        if (
          cardError?.response?.status ===
          409
        ) {

          throw new Error(
            "This MedCard was registered by another workstation before it could be linked. The patient record was created, but this card cannot be assigned."
          );

        }


        throw cardError;

      }


      console.log(
        "✅ Card linked successfully."
      );


      /*
      |--------------------------------------------------------------------------
      | CLEAR TEMPORARY UID
      |--------------------------------------------------------------------------
      */

      sessionStorage.removeItem(
        PENDING_CARD_KEY
      );


      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      setSuccess(
        true
      );


      /*
      |--------------------------------------------------------------------------
      | PATIENT WORKSPACE
      |--------------------------------------------------------------------------
      */

      window.setTimeout(() => {

        navigate(
          `/patients/${encodeURIComponent(
            patient.id
          )}`,
          {
            replace: true,
          }
        );

      }, 900);

    } catch (error: any) {

      console.error(
        "❌ Registration failed:",
        error
      );


      setErrorMessage(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to register the patient and link the MedCard."
      );

    } finally {

      setSubmitting(
        false
      );

    }

  };


  /*
  |--------------------------------------------------------------------------
  | SUCCESS SCREEN
  |--------------------------------------------------------------------------
  */

  if (
    success
  ) {

    return (
      <div
        className="patient-registration-page"
      >

        <main
          className="patient-registration-container"
        >

          <section
            className="patient-registration-card"
          >

            <div
              className="registration-success-icon"
            >

              <CheckCircle2
                size={48}
              />

            </div>


            <span className="eyebrow">
              REGISTRATION COMPLETE
            </span>


            <h1>
              Patient successfully registered
            </h1>


            <p>

              The patient record has been created
              and MedCard{" "}

              <strong>
                {cardUid}
              </strong>{" "}

              has been linked successfully.

            </p>


            {createdPatient && (

              <div
                className="registration-created-patient"
              >

                <UserRound
                  size={20}
                />


                <div>

                  <strong>

                    {
                      createdPatient.firstName
                    }{" "}

                    {
                      createdPatient.lastName
                    }

                  </strong>


                  {createdPatient.patientNumber && (

                    <span>

                      {
                        createdPatient.patientNumber
                      }

                    </span>

                  )}

                </div>

              </div>

            )}


            <div
              className="registration-loading"
            >

              <LoaderCircle
                size={18}
                className="spin"
              />


              Opening patient workspace...

            </div>

          </section>

        </main>

      </div>
    );

  }


  /*
  |--------------------------------------------------------------------------
  | CARD STATUS UI
  |--------------------------------------------------------------------------
  */

  const cardIsWaiting =
    cardStatus ===
    "WAITING";


  const cardIsChecking =
    cardStatus ===
    "CHECKING";


  const cardIsAvailable =
    cardStatus ===
    "AVAILABLE";


  const cardIsDuplicate =
    cardStatus ===
    "DUPLICATE";


  /*
  |--------------------------------------------------------------------------
  | MAIN PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="patient-registration-page"
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header
        className="patient-registration-header"
      >

        <button
          type="button"
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


        <div
          className="registration-brand"
        >

          <div
            className="brand-mark small"
          >

            <Activity
              size={20}
            />

          </div>


          <div>

            <strong>
              Med<span>Card</span>
            </strong>


            <small>
              Patient Registration
            </small>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main
        className="patient-registration-container"
      >

        <div
          className="patient-registration-heading"
        >

          <span className="eyebrow">
            NEW PATIENT
          </span>


          <h1>
            Register patient
          </h1>


          <p>
            Register a new patient and securely
            assign a MedCard to their record.
          </p>

        </div>


        {/* =====================================================
            NFC SCANNER
        ====================================================== */}

        <section
          className={`registration-nfc-card ${
            cardIsDuplicate
              ? "duplicate"
              : cardIsAvailable
              ? "available"
              : ""
          }`}
        >

          <div
            className="registration-nfc-visual"
          >

            {cardIsChecking ? (

              <LoaderCircle
                size={32}
                className="spin"
              />

            ) : cardIsDuplicate ? (

              <AlertCircle
                size={32}
              />

            ) : cardIsAvailable ? (

              <CheckCircle2
                size={32}
              />

            ) : (

              <Wifi
                size={32}
              />

            )}

          </div>


          <div
            className="registration-nfc-content"
          >

            <span
              className="registration-nfc-label"
            >

              {cardIsDuplicate
                ? "CARD ALREADY REGISTERED"
                : cardIsAvailable
                ? "MEDCARD READY"
                : cardIsChecking
                ? "VERIFYING CARD"
                : "MEDCARD SCANNER"}

            </span>


            <h2>

              {cardIsWaiting
                ? "Place MedCard on reader"

                : cardIsChecking
                ? "Checking MedCard..."

                : cardIsAvailable
                ? "MedCard available"

                : cardIsDuplicate
                ? "This card is already registered"

                : "Card verification failed"}

            </h2>


            <p>
              {cardMessage}
            </p>


            {cardUid && (

              <div
                className="registration-card-uid"
              >

                <CreditCard
                  size={16}
                />


                <span>
                  Card ID
                </span>


                <strong>
                  {cardUid}
                </strong>

              </div>

            )}

          </div>


          <div
            className="registration-nfc-actions"
          >

            {cardIsDuplicate && (

              <button
                type="button"
                onClick={
                  handleResetCard
                }
              >

                <RefreshCw
                  size={16}
                />

                Scan another card

              </button>

            )}


            {cardIsAvailable && (

              <div
                className="registration-card-ready"
              >

                <CheckCircle2
                  size={17}
                />

                Ready to register

              </div>

            )}

          </div>

        </section>


        {/* =====================================================
            ERROR
        ====================================================== */}

        {errorMessage && (

          <div
            className="registration-error"
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
            PATIENT FORM
        ====================================================== */}

        <form
          className="patient-registration-form"
          onSubmit={
            handleSubmit
          }
        >

          <section
            className="registration-form-section"
          >

            <div
              className="registration-section-heading"
            >

              <UserRound
                size={19}
              />


              <div>

                <h2>
                  Patient information
                </h2>


                <p>
                  Enter the patient's basic
                  demographic information.
                </p>

              </div>

            </div>


            <div
              className="registration-form-grid"
            >

              {/* =================================================
                  FIRST NAME
              ================================================== */}

              <div
                className="registration-field"
              >

                <label>
                  First name
                </label>


                <div
                  className="registration-input"
                >

                  <UserRound
                    size={17}
                  />


                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={
                      form.firstName
                    }
                    onChange={
                      event =>
                        updateField(
                          "firstName",
                          event.target.value
                        )
                    }
                    disabled={
                      submitting
                    }
                  />

                </div>

              </div>


              {/* =================================================
                  LAST NAME
              ================================================== */}

              <div
                className="registration-field"
              >

                <label>
                  Last name
                </label>


                <div
                  className="registration-input"
                >

                  <UserRound
                    size={17}
                  />


                  <input
                    type="text"
                    placeholder="Enter last name"
                    value={
                      form.lastName
                    }
                    onChange={
                      event =>
                        updateField(
                          "lastName",
                          event.target.value
                        )
                    }
                    disabled={
                      submitting
                    }
                  />

                </div>

              </div>


              {/* =================================================
                  DATE OF BIRTH
              ================================================== */}

              <div
                className="registration-field"
              >

                <label>
                  Date of birth
                </label>


                <div
                  className="registration-input"
                >

                  <CalendarDays
                    size={17}
                  />


                  <input
                    type="date"
                    value={
                      form.dateOfBirth
                    }
                    onChange={
                      event =>
                        updateField(
                          "dateOfBirth",
                          event.target.value
                        )
                    }
                    disabled={
                      submitting
                    }
                  />

                </div>

              </div>


              {/* =================================================
                  GENDER
              ================================================== */}

              <div
                className="registration-field"
              >

                <label>
                  Gender
                </label>


                <div
                  className="registration-input"
                >

                  <UserRound
                    size={17}
                  />


                  <select
                    value={
                      form.gender
                    }
                    onChange={
                      event =>
                        updateField(
                          "gender",
                          event.target.value
                        )
                    }
                    disabled={
                      submitting
                    }
                  >

                    <option value="UNKNOWN">
                      Prefer not to say
                    </option>

                    <option value="MALE">
                      Male
                    </option>

                    <option value="FEMALE">
                      Female
                    </option>

                    <option value="OTHER">
                      Other
                    </option>

                  </select>

                </div>

              </div>


              {/* =================================================
                  PHONE
              ================================================== */}

              <div
                className="registration-field"
              >

                <label>
                  Phone number
                </label>


                <div
                  className="registration-input"
                >

                  <Phone
                    size={17}
                  />


                  <input
                    type="tel"
                    placeholder="+250 7XX XXX XXX"
                    value={
                      form.phone
                    }
                    onChange={
                      event =>
                        updateField(
                          "phone",
                          event.target.value
                        )
                    }
                    disabled={
                      submitting
                    }
                  />

                </div>

              </div>


              {/* =================================================
                  EMAIL
              ================================================== */}

              <div
                className="registration-field"
              >

                <label>
                  Email address
                </label>


                <div
                  className="registration-input"
                >

                  <Mail
                    size={17}
                  />


                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={
                      form.email
                    }
                    onChange={
                      event =>
                        updateField(
                          "email",
                          event.target.value
                        )
                    }
                    disabled={
                      submitting
                    }
                  />

                </div>

              </div>

            </div>

          </section>


          {/* =====================================================
              CARD LINKING
          ====================================================== */}

          <section
            className="registration-link-section"
          >

            <div
              className="registration-section-heading"
            >

              <CreditCard
                size={19}
              />


              <div>

                <h2>
                  MedCard assignment
                </h2>


                <p>
                  The detected card will be
                  permanently linked to this patient.
                </p>

              </div>

            </div>


            <div
              className="registration-card-id"
            >

              <span>
                Detected Card
              </span>


              <strong>
                {cardUid ||
                  "Waiting for NFC card..."}
              </strong>

            </div>


            <div
              className="registration-no-second-tap"
            >

              <ShieldCheck
                size={17}
              />


              <span>
                The card is captured automatically
                by the NFC reader. No manual UID
                entry is required.
              </span>

            </div>

          </section>


          {/* =====================================================
              ACTIONS
          ====================================================== */}

          <div
            className="registration-actions"
          >

            <button
              type="button"
              className="registration-cancel"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
              disabled={
                submitting
              }
            >

              Cancel

            </button>


            <button
              type="submit"
              className="registration-submit"
              disabled={
                submitting ||
                !cardIsAvailable
              }
            >

              {submitting ? (

                <>

                  <LoaderCircle
                    size={18}
                    className="spin"
                  />

                  Registering...

                </>

              ) : (

                <>

                  <UserRoundPlus
                    size={18}
                  />

                  Register patient & link card

                </>

              )}

            </button>

          </div>


          {/* =====================================================
              SECURITY
          ====================================================== */}

          <div
            className="registration-security"
          >

            <ShieldCheck
              size={17}
            />


            <span>
              Patient information and card
              assignments are handled securely
              within the MedCard clinical system.
            </span>

          </div>

        </form>

      </main>

    </div>
  );
}


export default PatientRegistrationPage;