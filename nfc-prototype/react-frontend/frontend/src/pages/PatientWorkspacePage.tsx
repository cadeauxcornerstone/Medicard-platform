import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  Hash,
  HeartPulse,
  LoaderCircle,
  Phone,
  Pill,
  Plus,
  Save,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserRound,
} from "lucide-react";

import LaboratoryOrderPanel from "../components/clinical/LaboratoryOrderPanel";

const API_URL = "http://localhost:5000/api/v1";

const DEVELOPMENT_USER_ID =
  "ac844b2b-cc1b-45a4-9404-e059fdd6df0b";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface PatientCard {
  id: string;
  cardUid: string;
  status: string;
  patientId: string;
  issuedAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string;
  phone: string | null;
  email: string | null;
  nationalId: string | null;
  createdAt: string;
  updatedAt: string;
  cards: PatientCard[];
}

interface ClinicalNote {
  id: string;
  encounterId: string;
  authorId?: string | null;

  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;

  createdAt: string;
  updatedAt?: string;

  author?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface ClinicalNoteCreateResponse {
  encounter: {
    id: string;
    patientId: string;
    facilityId: string;
    status: string;
    startedAt: string;
    chiefComplaint: string | null;
  };

  clinicalNote: ClinicalNote;
}

interface Diagnosis {
  id: string;
  encounterId: string;
  patientId: string;
  recordedById: string;
  diagnosisType: string;
  code: string | null;
  description: string;
  notes: string | null;
  createdAt: string;

  recordedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface PrescriptionItem {
  id?: string;
  prescriptionId?: string;

  medicationName: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: string | null;
  instructions: string | null;

  createdAt?: string;
}

interface Prescription {
  id: string;
  patientId: string;
  encounterId: string;
  prescribedById: string;

  status: string;

  notes: string | null;

  createdAt: string;
  updatedAt?: string;

  items: PrescriptionItem[];

  prescribedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface PatientResponse {
  success: boolean;
  data: Patient;
  message?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface DiagnosisResponse {
  success: boolean;
  data: Diagnosis;
  message?: string;
}

interface Encounter {
  id: string;
  patientId: string;
  facilityId: string;
  providerId: string | null;
  type: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  chiefComplaint: string | null;
  createdAt: string;
  updatedAt: string;
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const formatDateTime = (
  value: string | null | undefined
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

const formatDate = (
  value: string | null | undefined
) => {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return date.toLocaleDateString([], {
    dateStyle: "medium",
  });
};

const getInitials = (
  firstName: string,
  lastName: string
) => {
  return `${firstName?.[0] || ""}${
    lastName?.[0] || ""
  }`.toUpperCase();
};

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

function PatientWorkspacePage() {
  const navigate = useNavigate();

  const { patientId } = useParams<{
    patientId: string;
  }>();

  const [searchParams] =
    useSearchParams();

  const encounterId =
    searchParams.get("encounterId");

  /*
  |--------------------------------------------------------------------------
  | PATIENT
  |--------------------------------------------------------------------------
  */

  const [patient, setPatient] =
    useState<Patient | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | ENCOUNTER
  |--------------------------------------------------------------------------
  */

  const [
    encounterChiefComplaint,
    setEncounterChiefComplaint,
  ] = useState("");

  const [encounter, setEncounter] =
    useState<Encounter | null>(null);

  const [loadingEncounter, setLoadingEncounter] =
    useState(false);

  const [completingEncounter, setCompletingEncounter] =
    useState(false);

  const [completionMessage, setCompletionMessage] =
    useState("");

  const [completionError, setCompletionError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | CLINICAL NOTES
  |--------------------------------------------------------------------------
  */

  const [clinicalNotes, setClinicalNotes] =
    useState<ClinicalNote[]>([]);

  const [loadingNotes, setLoadingNotes] =
    useState(false);

  const [savingNote, setSavingNote] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  const [saveError, setSaveError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | SOAP FORM
  |--------------------------------------------------------------------------
  */

  const [subjective, setSubjective] =
    useState("");

  const [objective, setObjective] =
    useState("");

  const [assessment, setAssessment] =
    useState("");

  const [plan, setPlan] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | DIAGNOSES
  |--------------------------------------------------------------------------
  */

  const [diagnoses, setDiagnoses] =
    useState<Diagnosis[]>([]);

  const [loadingDiagnoses, setLoadingDiagnoses] =
    useState(false);

  const [savingDiagnosis, setSavingDiagnosis] =
    useState(false);

  const [diagnosisType, setDiagnosisType] =
    useState("PRIMARY");

  const [diagnosisCode, setDiagnosisCode] =
    useState("");

  const [
    diagnosisDescription,
    setDiagnosisDescription,
  ] = useState("");

  const [diagnosisNotes, setDiagnosisNotes] =
    useState("");

  const [
    diagnosisMessage,
    setDiagnosisMessage,
  ] = useState("");

  const [
    diagnosisError,
    setDiagnosisError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | PRESCRIPTIONS
  |--------------------------------------------------------------------------
  */

  const [prescriptions, setPrescriptions] =
    useState<Prescription[]>([]);

  const [
    loadingPrescriptions,
    setLoadingPrescriptions,
  ] = useState(false);

  const [
    savingPrescription,
    setSavingPrescription,
  ] = useState(false);

  const [
    prescriptionMessage,
    setPrescriptionMessage,
  ] = useState("");

  const [
    prescriptionError,
    setPrescriptionError,
  ] = useState("");

  const [
    prescriptionNotes,
    setPrescriptionNotes,
  ] = useState("");

  const [
    prescriptionItems,
    setPrescriptionItems,
  ] = useState<PrescriptionItem[]>([
    {
      medicationName: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: "",
      instructions: "",
    },
  ]);

  /*
  |--------------------------------------------------------------------------
  | LOAD PATIENT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) {
        setError("Patient ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/patients/${patientId}`
        );

        const data =
          (await response.json()) as PatientResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load patient."
          );
        }

        setPatient(data.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load patient."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
  }, [patientId]);

  /*
  |--------------------------------------------------------------------------
  | LOAD ENCOUNTER
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadEncounter = async () => {
      if (!encounterId) {
        setEncounter(null);
        return;
      }

      try {
        setLoadingEncounter(true);
        setCompletionError("");

        const response = await fetch(
          `${API_URL}/encounters/${encounterId}`
        );

        const data =
          (await response.json()) as ApiResponse<Encounter>;

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load encounter."
          );
        }

        setEncounter(data.data);
      } catch (err) {
        console.error(
          "Encounter loading failed:",
          err
        );

        setCompletionError(
          err instanceof Error
            ? err.message
            : "Unable to load encounter."
        );
      } finally {
        setLoadingEncounter(false);
      }
    };

    loadEncounter();
  }, [encounterId]);

  /*
  |--------------------------------------------------------------------------
  | LOAD CLINICAL NOTES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadClinicalNotes = async () => {
      if (!encounterId) {
        return;
      }

      try {
        setLoadingNotes(true);

        const response = await fetch(
          `${API_URL}/encounters/${encounterId}/clinical-notes`
        );

        const data =
          (await response.json()) as ApiResponse<
            ClinicalNote[]
          >;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load clinical notes."
          );
        }

        setClinicalNotes(
          Array.isArray(data.data)
            ? data.data
            : []
        );
      } catch (err) {
        console.error(
          "Clinical notes loading failed:",
          err
        );
      } finally {
        setLoadingNotes(false);
      }
    };

    loadClinicalNotes();
  }, [encounterId]);

  /*
  |--------------------------------------------------------------------------
  | LOAD DIAGNOSES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadDiagnoses = async () => {
      if (!encounterId) {
        return;
      }

      try {
        setLoadingDiagnoses(true);

        const response = await fetch(
          `${API_URL}/encounters/${encounterId}/diagnoses`
        );

        const data =
          (await response.json()) as ApiResponse<
            Diagnosis[]
          >;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load diagnoses."
          );
        }

        setDiagnoses(
          Array.isArray(data.data)
            ? data.data
            : []
        );
      } catch (err) {
        console.error(
          "Diagnosis loading failed:",
          err
        );
      } finally {
        setLoadingDiagnoses(false);
      }
    };

    loadDiagnoses();
  }, [encounterId]);

  /*
  |--------------------------------------------------------------------------
  | LOAD PRESCRIPTIONS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadPrescriptions = async () => {
      if (!encounterId) {
        return;
      }

      try {
        setLoadingPrescriptions(true);

        const response = await fetch(
          `${API_URL}/encounters/${encounterId}/prescriptions`
        );

        const data =
          (await response.json()) as ApiResponse<
            Prescription[]
          >;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load prescriptions."
          );
        }

        setPrescriptions(
          Array.isArray(data.data)
            ? data.data
            : []
        );
      } catch (err) {
        console.error(
          "Prescription loading failed:",
          err
        );
      } finally {
        setLoadingPrescriptions(false);
      }
    };

    loadPrescriptions();
  }, [encounterId]);

  /*
  |--------------------------------------------------------------------------
  | SAVE CLINICAL NOTE
  |--------------------------------------------------------------------------
  */

  const handleSaveClinicalNote = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!encounterId) {
      setSaveError(
        "No clinical encounter is available."
      );
      setSaveMessage("");
      return;
    }

    if (!patientId) {
      setSaveError(
        "Patient ID is missing."
      );
      setSaveMessage("");
      return;
    }

    if (
      !encounterChiefComplaint.trim() &&
      !subjective.trim() &&
      !objective.trim() &&
      !assessment.trim() &&
      !plan.trim()
    ) {
      setSaveError(
        "Enter at least one clinical assessment field."
      );
      setSaveMessage("");
      return;
    }

    try {
      setSavingNote(true);
      setSaveError("");
      setSaveMessage("");

      const response = await fetch(
        `${API_URL}/encounters/${encounterId}/clinical-notes`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            authorId:
              DEVELOPMENT_USER_ID,

            chiefComplaint:
              encounterChiefComplaint.trim() ||
              null,

            subjective:
              subjective.trim() ||
              null,

            objective:
              objective.trim() ||
              null,

            assessment:
              assessment.trim() ||
              null,

            plan:
              plan.trim() ||
              null,
          }),
        }
      );

      const data =
        (await response.json()) as ApiResponse<
          ClinicalNoteCreateResponse
        >;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to save clinical assessment."
        );
      }

      setClinicalNotes(
        (previous) => [
          data.data.clinicalNote,
          ...previous,
        ]
      );

      setEncounterChiefComplaint(
        data.data.encounter
          .chiefComplaint || ""
      );

      setSubjective("");
      setObjective("");
      setAssessment("");
      setPlan("");

      setSaveMessage(
        "Clinical assessment saved successfully."
      );
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Unable to save clinical assessment."
      );
    } finally {
      setSavingNote(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE DIAGNOSIS
  |--------------------------------------------------------------------------
  */

  const handleSaveDiagnosis = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!encounterId) {
      setDiagnosisError(
        "No clinical encounter is available."
      );
      setDiagnosisMessage("");
      return;
    }

    if (!patientId) {
      setDiagnosisError(
        "Patient ID is missing."
      );
      setDiagnosisMessage("");
      return;
    }

    if (!diagnosisDescription.trim()) {
      setDiagnosisError(
        "Diagnosis description is required."
      );
      setDiagnosisMessage("");
      return;
    }

    if (!diagnosisType) {
      setDiagnosisError(
        "Diagnosis type is required."
      );
      setDiagnosisMessage("");
      return;
    }

    try {
      setSavingDiagnosis(true);
      setDiagnosisError("");
      setDiagnosisMessage("");

      const response = await fetch(
        `${API_URL}/encounters/${encounterId}/diagnoses`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            patientId,

            recordedById:
              DEVELOPMENT_USER_ID,

            diagnosisType,

            code:
              diagnosisCode.trim() ||
              null,

            description:
              diagnosisDescription.trim(),

            notes:
              diagnosisNotes.trim() ||
              null,
          }),
        }
      );

      const data =
        (await response.json()) as DiagnosisResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to record diagnosis."
        );
      }

      setDiagnoses(
        (previous) => [
          data.data,
          ...previous,
        ]
      );

      setDiagnosisType("PRIMARY");
      setDiagnosisCode("");
      setDiagnosisDescription("");
      setDiagnosisNotes("");

      setDiagnosisMessage(
        "Diagnosis recorded successfully."
      );
    } catch (err) {
      setDiagnosisError(
        err instanceof Error
          ? err.message
          : "Unable to record diagnosis."
      );
    } finally {
      setSavingDiagnosis(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PRESCRIPTION HELPERS
  |--------------------------------------------------------------------------
  */

  const updatePrescriptionItem = (
    index: number,
    field: keyof PrescriptionItem,
    value: string
  ) => {
    setPrescriptionItems(
      (previous) =>
        previous.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        )
    );
  };

  const addPrescriptionItem = () => {
    setPrescriptionItems(
      (previous) => [
        ...previous,
        {
          medicationName: "",
          dosage: "",
          frequency: "",
          duration: "",
          quantity: "",
          instructions: "",
        },
      ]
    );
  };

  const removePrescriptionItem = (
    index: number
  ) => {
    setPrescriptionItems(
      (previous) => {
        if (previous.length === 1) {
          return previous;
        }

        return previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        );
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE PRESCRIPTION
  |--------------------------------------------------------------------------
  */

  const handleSavePrescription = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!encounterId) {
      setPrescriptionError(
        "No clinical encounter is available."
      );
      setPrescriptionMessage("");
      return;
    }

    if (!patientId) {
      setPrescriptionError(
        "Patient ID is missing."
      );
      setPrescriptionMessage("");
      return;
    }

    const validItems =
      prescriptionItems.filter(
        (item) =>
          item.medicationName.trim()
      );

    if (validItems.length === 0) {
      setPrescriptionError(
        "Add at least one medication."
      );
      setPrescriptionMessage("");
      return;
    }

    try {
      setSavingPrescription(true);
      setPrescriptionError("");
      setPrescriptionMessage("");

      const response = await fetch(
        `${API_URL}/encounters/${encounterId}/prescriptions`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            patientId,

            prescribedById:
              DEVELOPMENT_USER_ID,

            notes:
              prescriptionNotes.trim() ||
              null,

            items: validItems.map(
              (item) => ({
                medicationName:
                  item.medicationName.trim(),

                dosage:
                  item.dosage?.trim() ||
                  null,

                frequency:
                  item.frequency?.trim() ||
                  null,

                duration:
                  item.duration?.trim() ||
                  null,

                quantity:
                  item.quantity?.trim() ||
                  null,

                instructions:
                  item.instructions?.trim() ||
                  null,
              })
            ),
          }),
        }
      );

      const data =
        (await response.json()) as ApiResponse<
          Prescription
        >;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to create prescription."
        );
      }

      setPrescriptions(
        (previous) => [
          data.data,
          ...previous,
        ]
      );

      setPrescriptionNotes("");

      setPrescriptionItems([
        {
          medicationName: "",
          dosage: "",
          frequency: "",
          duration: "",
          quantity: "",
          instructions: "",
        },
      ]);

      setPrescriptionMessage(
        "Prescription created successfully."
      );
    } catch (err) {
      setPrescriptionError(
        err instanceof Error
          ? err.message
          : "Unable to create prescription."
      );
    } finally {
      setSavingPrescription(false);
    }
  };

    /*
  |--------------------------------------------------------------------------
  | COMPLETE ENCOUNTER
  |--------------------------------------------------------------------------
  */

  const handleCompleteEncounter = async () => {
    if (!encounterId) {
      setCompletionError(
        "No clinical encounter is available."
      );
      setCompletionMessage("");
      return;
    }

    if (!encounter) {
      setCompletionError(
        "Encounter information is not available."
      );
      setCompletionMessage("");
      return;
    }

    if (encounter.status === "COMPLETED") {
      setCompletionMessage(
        "This encounter is already completed."
      );
      setCompletionError("");
      return;
    }

    try {
      setCompletingEncounter(true);
      setCompletionError("");
      setCompletionMessage("");

      const response = await fetch(
        `${API_URL}/encounters/${encounterId}/complete`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            completedById:
              DEVELOPMENT_USER_ID,
          }),
        }
      );

      const data =
        (await response.json()) as ApiResponse<Encounter>;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to complete encounter."
        );
      }

      setEncounter(data.data);

      setCompletionMessage(
        "Encounter completed successfully."
      );
    } catch (err) {
      setCompletionError(
        err instanceof Error
          ? err.message
          : "Unable to complete encounter."
      );
    } finally {
      setCompletingEncounter(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REVIEW & PAY
  |--------------------------------------------------------------------------
  */

  const handleOpenPayment = () => {
    if (!patientId) {
      return;
    }

    const params = new URLSearchParams();

    params.set("patientId", patientId);

    if (encounterId) {
      params.set(
        "encounterId",
        encounterId
      );
    }

    navigate(
      `/payment?${params.toString()}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING SCREEN
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="patient-workspace-page">
        <div className="patient-workspace-loading">

          <div className="workspace-loading-icon">
            <Activity size={26} />
          </div>

          <h2>
            Loading patient workspace
          </h2>

          <p>
            Fetching patient information
            from the MedCard clinical system.
          </p>

        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR SCREEN
  |--------------------------------------------------------------------------
  */

  if (error || !patient) {
    return (
      <div className="patient-workspace-page">
        <div className="patient-workspace-error">

          <div className="workspace-error-icon">
            <ShieldCheck size={28} />
          </div>

          <span className="eyebrow">
            PATIENT WORKSPACE
          </span>

          <h2>
            Unable to open patient
          </h2>

          <p>
            {error ||
              "The requested patient could not be found."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <ArrowLeft size={17} />
            Return to dashboard
          </button>

        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ACTIVE CARD
  |--------------------------------------------------------------------------
  */

  const activeCard =
    patient.cards.find(
      (card) =>
        card.status === "ACTIVE"
    ) || patient.cards[0];

  /*
  |--------------------------------------------------------------------------
  | MAIN WORKSPACE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="patient-workspace-page">

      {/* =================================================
          TOP BAR
      ================================================== */}

      <header className="patient-workspace-topbar">

        <div className="workspace-brand">

          <div className="workspace-brand-icon">
            <Activity size={20} />
          </div>

          <div>
            <strong>
              Med<span>Card</span>
            </strong>

            <small>
              Clinical workspace
            </small>
          </div>

        </div>

        <div className="workspace-topbar-actions">

          <div className="workspace-live-status">
            <span />
            System operational
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <ArrowLeft size={17} />
            Dashboard
          </button>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================== */}

      <main className="patient-workspace-main">

        {/* BREADCRUMB */}

        <div className="workspace-breadcrumb">

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Dashboard
          </button>

          <span>/</span>

          <strong>
            Patient Workspace
          </strong>

        </div>

        {/* =================================================
            PATIENT HERO
        ================================================== */}

        <section className="patient-workspace-hero">

          <div className="workspace-patient-identity">

            <div className="workspace-patient-avatar">
              {getInitials(
                patient.firstName,
                patient.lastName
              )}
            </div>

            <div>

              <span className="eyebrow">
                PATIENT WORKSPACE
              </span>

              <h1>
                {patient.firstName}{" "}
                {patient.lastName}
              </h1>

              <div className="workspace-patient-meta">

                <span>
                  <Hash size={14} />
                  {patient.patientNumber}
                </span>

                <span>
                  <HeartPulse size={14} />
                  {patient.gender}
                </span>

                <span>
                  <Phone size={14} />
                  {patient.phone ||
                    "No phone"}
                </span>

              </div>

            </div>

          </div>

          <div className="workspace-card-status">

            <div className="workspace-card-status-icon">
              <ShieldCheck size={20} />
            </div>

            <div>
              <span>
                MedCard status
              </span>

              <strong>
                {activeCard?.status ||
                  "NO CARD"}
              </strong>
            </div>

            {activeCard?.status ===
              "ACTIVE" && (
              <CheckCircle2 size={19} />
            )}

          </div>

        </section>

        {/* =================================================
            CLINICAL CONTEXT
        ================================================== */}

        <section className="workspace-context-bar">

          <div className="workspace-context-item">

            <div className="workspace-context-icon">
              <Stethoscope size={18} />
            </div>

            <div>

              <span>
                Encounter
              </span>

              <strong>
                {encounterId
                  ? "Active clinical encounter"
                  : "No encounter"}
              </strong>

              <small>
                {encounterId
                  ? `Encounter ${encounterId.slice(
                      0,
                      8
                    )}…`
                  : "No encounter ID provided"}
              </small>

            </div>

          </div>

          <div className="workspace-context-item">

            <div className="workspace-context-icon">
              <FileText size={18} />
            </div>

            <div>

              <span>
                Clinical notes
              </span>

              <strong>
                {clinicalNotes.length}
              </strong>

              <small>
                Recorded notes
              </small>

            </div>

          </div>

          <div className="workspace-context-item">

            <div className="workspace-context-icon">
              <ShieldCheck size={18} />
            </div>

            <div>

              <span>
                Diagnoses
              </span>

              <strong>
                {diagnoses.length}
              </strong>

              <small>
                Recorded diagnoses
              </small>

            </div>

          </div>

          <div className="workspace-context-item">

            <div className="workspace-context-icon">
              <Pill size={18} />
            </div>

            <div>

              <span>
                Prescriptions
              </span>

              <strong>
                {prescriptions.length}
              </strong>

              <small>
                Medication orders
              </small>

            </div>

          </div>

        </section>

        {/* =================================================
            ENCOUNTER CLOSURE
        ================================================== */}

        {encounterId && (
          <section className="clinical-workspace-section">

            <div className="section-heading">

              <div>

                <span className="eyebrow">
                  ENCOUNTER LIFECYCLE
                </span>

                <h2>
                  Encounter status
                </h2>

                <p>
                  Review the clinical encounter before
                  completing the visit.
                </p>

              </div>

              <div className="workspace-session-badge">
                <Activity size={15} />
                {loadingEncounter
                  ? "Checking status..."
                  : encounter?.status || "UNKNOWN"}
              </div>

            </div>

            <div className="workspace-information-grid">

              <div className="workspace-information-card">

                <div className="workspace-card-header">

                  <div className="workspace-card-icon">
                    <Stethoscope size={18} />
                  </div>

                  <div>

                    <span className="eyebrow">
                      ENCOUNTER
                    </span>

                    <h2>
                      Clinical visit
                    </h2>

                  </div>

                </div>

                <div className="workspace-information-list">

                  <div>
                    <span>Status</span>

                    <span className={`clinical-status-badge ${(encounter?.status || "").toLowerCase()}`}>
                      {encounter?.status || "Loading..."}
                    </span>
                  </div>

                  <div>
                    <span>Started</span>

                    <strong>
                      {formatDateTime(
                        encounter?.startedAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Completed</span>

                    <strong>
                      {formatDateTime(
                        encounter?.completedAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Chief complaint</span>

                    <strong>
                      {encounter?.chiefComplaint ||
                        "Not recorded"}
                    </strong>
                  </div>

                </div>

              </div>

              <div className="workspace-information-card">

                <div className="workspace-card-header">

                  <div className="workspace-card-icon">
                    <ShieldCheck size={18} />
                  </div>

                  <div>

                    <span className="eyebrow">
                      CLINICAL CLOSURE
                    </span>

                    <h2>
                      Complete encounter
                    </h2>

                  </div>

                </div>

                <p>
                  Completing the encounter indicates that
                  the current clinical visit has been finalized.
                </p>

                {completionMessage && (
                  <div className="clinical-success">
                    <CheckCircle2 size={17} />
                    <span>
                      {completionMessage}
                    </span>
                  </div>
                )}

                {completionError && (
                  <div className="clinical-error">
                    <ShieldCheck size={17} />
                    <span>
                      {completionError}
                    </span>
                  </div>
                )}

                <div className="clinical-form-actions">

                  <div className="clinical-form-status">
                    <Activity size={16} />

                    <span>
                      {encounter?.status === "COMPLETED"
                        ? "Encounter closed"
                        : "Encounter open"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="action-pill-btn primary"
                    onClick={
                      handleCompleteEncounter
                    }
                    disabled={
                      !encounterId ||
                      loadingEncounter ||
                      completingEncounter ||
                      encounter?.status === "COMPLETED"
                    }
                  >
                    {completingEncounter ? (
                      <>
                        <LoaderCircle
                          size={17}
                          className="spin"
                        />

                        Completing...
                      </>
                    ) : encounter?.status === "COMPLETED" ? (
                      <>
                        <CheckCircle2 size={17} />

                        Encounter Completed
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={17} />

                        Complete Encounter
                      </>
                    )}
                  </button>

                </div>

              </div>

            </div>

          </section>
        )}

        {/* =================================================
            PATIENT INFORMATION
        ================================================== */}

        <section className="workspace-information-grid">

          <div className="workspace-information-card">

            <div className="workspace-card-header">

              <div className="workspace-card-icon">
                <UserRound size={18} />
              </div>

              <div>

                <span className="eyebrow">
                  PATIENT
                </span>

                <h2>
                  Patient information
                </h2>

              </div>

            </div>

            <div className="workspace-information-list">

              <div>
                <span>
                  Patient number
                </span>

                <strong>
                  {patient.patientNumber}
                </strong>
              </div>

              <div>
                <span>
                  Full name
                </span>

                <strong>
                  {patient.firstName}{" "}
                  {patient.lastName}
                </strong>
              </div>

              <div>
                <span>
                  Date of birth
                </span>

                <strong>
                  {formatDate(
                    patient.dateOfBirth
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Gender
                </span>

                <strong>
                  {patient.gender}
                </strong>
              </div>

              <div>
                <span>
                  Phone
                </span>

                <strong>
                  {patient.phone ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <span>
                  Email
                </span>

                <strong>
                  {patient.email ||
                    "Not provided"}
                </strong>
              </div>

            </div>

          </div>

          <div className="workspace-information-card">

            <div className="workspace-card-header">

              <div className="workspace-card-icon">
                <ShieldCheck size={18} />
              </div>

              <div>

                <span className="eyebrow">
                  CARD
                </span>

                <h2>
                  MedCard identity
                </h2>

              </div>

            </div>

            <div className="workspace-information-list">

              <div>
                <span>
                  Card UID
                </span>

                <strong>
                  {activeCard?.cardUid ||
                    "Not available"}
                </strong>
              </div>

              <div>
                <span>
                  Status
                </span>

                <span className={`clinical-status-badge ${(activeCard?.status || "active").toLowerCase()}`}>
                  {activeCard?.status ||
                    "ACTIVE"}
                </span>
              </div>

              <div>
                <span>
                  Issued
                </span>

                <strong>
                  {formatDateTime(
                    activeCard?.issuedAt
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Last used
                </span>

                <strong>
                  {formatDateTime(
                    activeCard?.lastUsedAt
                  )}
                </strong>
              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            CLINICAL ASSESSMENT
        ================================================== */}

        <section className="clinical-workspace-section">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                CONSULTATION
              </span>

              <h2>
                Clinical assessment
              </h2>

              <p>
                Document the patient's current
                clinical presentation using the
                SOAP structure.
              </p>

            </div>

            <div className="workspace-session-badge">
              <Stethoscope size={15} />
              Active encounter
            </div>

          </div>

          {!encounterId && (
            <div className="clinical-warning">

              <ShieldCheck size={18} />

              <div>

                <strong>
                  No active encounter
                </strong>

                <span>
                  A clinical encounter is required
                  before recording clinical data.
                </span>

              </div>

            </div>
          )}

          <form
            className="clinical-assessment-form"
            onSubmit={
              handleSaveClinicalNote
            }
          >

            <div className="clinical-field">

              <label htmlFor="chiefComplaint">
                Chief complaint
              </label>

              <textarea
                id="chiefComplaint"
                value={
                  encounterChiefComplaint
                }
                onChange={(event) =>
                  setEncounterChiefComplaint(
                    event.target.value
                  )
                }
                placeholder="Why did the patient come to the facility?"
                rows={3}
                disabled={
                  !encounterId ||
                  savingNote
                }
              />

            </div>

            <div className="clinical-field-grid">

              <div className="clinical-field">

                <label htmlFor="subjective">
                  Subjective
                </label>

                <textarea
                  id="subjective"
                  value={subjective}
                  onChange={(event) =>
                    setSubjective(
                      event.target.value
                    )
                  }
                  placeholder="Patient-reported symptoms, history and concerns."
                  rows={6}
                  disabled={
                    !encounterId ||
                    savingNote
                  }
                />

              </div>

              <div className="clinical-field">

                <label htmlFor="objective">
                  Objective
                </label>

                <textarea
                  id="objective"
                  value={objective}
                  onChange={(event) =>
                    setObjective(
                      event.target.value
                    )
                  }
                  placeholder="Clinical findings, examination and observations."
                  rows={6}
                  disabled={
                    !encounterId ||
                    savingNote
                  }
                />

              </div>

            </div>

            <div className="clinical-field-grid">

              <div className="clinical-field">

                <label htmlFor="assessment">
                  Assessment
                </label>

                <textarea
                  id="assessment"
                  value={assessment}
                  onChange={(event) =>
                    setAssessment(
                      event.target.value
                    )
                  }
                  placeholder="Clinical assessment and interpretation."
                  rows={6}
                  disabled={
                    !encounterId ||
                    savingNote
                  }
                />

              </div>

              <div className="clinical-field">

                <label htmlFor="plan">
                  Plan
                </label>

                <textarea
                  id="plan"
                  value={plan}
                  onChange={(event) =>
                    setPlan(
                      event.target.value
                    )
                  }
                  placeholder="Treatment, investigations, follow-up and referrals."
                  rows={6}
                  disabled={
                    !encounterId ||
                    savingNote
                  }
                />

              </div>

            </div>

            {saveMessage && (
              <div className="clinical-success">

                <CheckCircle2 size={17} />

                <span>
                  {saveMessage}
                </span>

              </div>
            )}

            {saveError && (
              <div className="clinical-error">

                <ShieldCheck size={17} />

                <span>
                  {saveError}
                </span>

              </div>
            )}

            <div className="clinical-form-actions">

              <div className="clinical-form-status">

                <Activity size={16} />

                <span>
                  {encounterId
                    ? "Clinical encounter active"
                    : "No encounter"}
                </span>

              </div>

              <button
                type="submit"
                disabled={
                  !encounterId ||
                  savingNote
                }
              >
                {savingNote ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />

                    Save Clinical Assessment
                  </>
                )}
              </button>

            </div>

          </form>

        </section>

                {/* =================================================
            DIAGNOSIS
        ================================================== */}

        <section className="clinical-workspace-section">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                CLINICAL FINDINGS
              </span>

              <h2>
                Diagnosis
              </h2>

              <p>
                Record the patient's clinical diagnosis
                and supporting information.
              </p>

            </div>

            <div className="workspace-session-badge">
              <ShieldCheck size={15} />
              {diagnoses.length} recorded
            </div>

          </div>


          <form
            className="clinical-assessment-form"
            onSubmit={
              handleSaveDiagnosis
            }
          >

            <div className="clinical-field-grid">

              <div className="clinical-field">

                <label htmlFor="diagnosisType">
                  Diagnosis type
                </label>

                <select
                  id="diagnosisType"
                  value={diagnosisType}
                  onChange={(event) =>
                    setDiagnosisType(
                      event.target.value
                    )
                  }
                  disabled={
                    !encounterId ||
                    savingDiagnosis
                  }
                >

                  <option value="PRIMARY">
                    Primary
                  </option>

                  <option value="SECONDARY">
                    Secondary
                  </option>

                  <option value="DIFFERENTIAL">
                    Differential
                  </option>

                </select>

              </div>


              <div className="clinical-field">

                <label htmlFor="diagnosisCode">
                  Diagnosis code
                </label>

                <input
                  id="diagnosisCode"
                  value={diagnosisCode}
                  onChange={(event) =>
                    setDiagnosisCode(
                      event.target.value
                    )
                  }
                  placeholder="e.g. K04.7"
                  disabled={
                    !encounterId ||
                    savingDiagnosis
                  }
                />

              </div>

            </div>


            <div className="clinical-field">

              <label htmlFor="diagnosisDescription">
                Diagnosis
              </label>

              <input
                id="diagnosisDescription"
                value={
                  diagnosisDescription
                }
                onChange={(event) =>
                  setDiagnosisDescription(
                    event.target.value
                  )
                }
                placeholder="Enter clinical diagnosis"
                disabled={
                  !encounterId ||
                  savingDiagnosis
                }
              />

            </div>


            <div className="clinical-field">

              <label htmlFor="diagnosisNotes">
                Clinical notes
              </label>

              <textarea
                id="diagnosisNotes"
                value={diagnosisNotes}
                onChange={(event) =>
                  setDiagnosisNotes(
                    event.target.value
                  )
                }
                placeholder="Add supporting clinical information..."
                rows={4}
                disabled={
                  !encounterId ||
                  savingDiagnosis
                }
              />

            </div>


            {diagnosisMessage && (
              <div className="clinical-success">

                <CheckCircle2 size={17} />

                <span>
                  {diagnosisMessage}
                </span>

              </div>
            )}


            {diagnosisError && (
              <div className="clinical-error">

                <ShieldCheck size={17} />

                <span>
                  {diagnosisError}
                </span>

              </div>
            )}


            <div className="clinical-form-actions">

              <div className="clinical-form-status">

                <ShieldCheck size={16} />

                <span>
                  Diagnosis is linked to this encounter
                </span>

              </div>

              <button
                type="submit"
                disabled={
                  !encounterId ||
                  savingDiagnosis
                }
              >

                {savingDiagnosis ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={17} />

                    Record Diagnosis
                  </>
                )}

              </button>

            </div>

          </form>


          {/* =================================================
              DIAGNOSIS HISTORY
          ================================================== */}

          <div className="workspace-history">

            <div className="workspace-history-header">

              <div>

                <span className="eyebrow">
                  HISTORY
                </span>

                <h3>
                  Recorded diagnoses
                </h3>

              </div>

              {loadingDiagnoses && (
                <LoaderCircle
                  size={18}
                  className="spin"
                />
              )}

            </div>


            {diagnoses.length === 0 &&
            !loadingDiagnoses ? (
              <div className="workspace-empty-state">

                <ShieldCheck size={24} />

                <strong>
                  No diagnoses recorded
                </strong>

                <span>
                  Diagnoses added during this
                  encounter will appear here.
                </span>

              </div>
            ) : (
              <div className="workspace-history-list">

                {diagnoses.map(
                  (diagnosis) => (
                    <article
                      key={diagnosis.id}
                      className="workspace-history-card"
                    >

                      <div className="workspace-history-icon">
                        <ShieldCheck size={18} />
                      </div>

                      <div className="workspace-history-content">

                        <div className="workspace-history-title">

                          <strong>
                            {diagnosis.description}
                          </strong>

                          <span className="clinical-status-badge active">
                            {diagnosis.diagnosisType}
                          </span>

                        </div>

                        <div className="workspace-history-meta">

                          {diagnosis.code && (
                            <span className="lab-test-code">
                              {diagnosis.code}
                            </span>
                          )}

                          <span>
                            Recorded{" "}
                            {formatDateTime(
                              diagnosis.createdAt
                            )}
                          </span>

                        </div>

                        {diagnosis.notes && (
                          <p>
                            {diagnosis.notes}
                          </p>
                        )}

                        {diagnosis.recordedBy && (
                          <small>
                            Recorded by{" "}
                            {
                              diagnosis
                                .recordedBy
                                .firstName
                            }{" "}
                            {
                              diagnosis
                                .recordedBy
                                .lastName
                            }
                          </small>
                        )}

                      </div>

                    </article>
                  )
                )}

              </div>
            )}

          </div>

        </section>


        {/* =================================================
            LABORATORY
        ================================================== */}

        <section className="clinical-workspace-section">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                DIAGNOSTICS
              </span>

              <h2>
                Laboratory
              </h2>

              <p>
                Request laboratory investigations
                for this clinical encounter.
              </p>

            </div>

            <div className="workspace-session-badge">
              <Activity size={15} />
              Laboratory
            </div>

          </div>


          {patientId &&
          encounterId ? (
            <LaboratoryOrderPanel
              patientId={patientId}
              encounterId={encounterId}
            />
          ) : (
            <div className="clinical-warning">

              <ShieldCheck size={18} />

              <div>

                <strong>
                  Laboratory unavailable
                </strong>

                <span>
                  A patient and encounter are required
                  before laboratory orders can be created.
                </span>

              </div>

            </div>
          )}

        </section>


        {/* =================================================
            PRESCRIPTIONS
        ================================================== */}

        <section className="clinical-workspace-section">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                MEDICATION
              </span>

              <h2>
                Prescription
              </h2>

              <p>
                Create medication orders associated
                with this encounter.
              </p>

            </div>

            <div className="workspace-session-badge">
              <Pill size={15} />
              {prescriptions.length}{" "}
              prescriptions
            </div>

          </div>


          <form
            className="clinical-assessment-form"
            onSubmit={
              handleSavePrescription
            }
          >

            <div className="clinical-field">

              <label htmlFor="prescriptionNotes">
                Prescription notes
              </label>

              <textarea
                id="prescriptionNotes"
                value={prescriptionNotes}
                onChange={(event) =>
                  setPrescriptionNotes(
                    event.target.value
                  )
                }
                placeholder="General instructions for the prescription..."
                rows={4}
                disabled={
                  !encounterId ||
                  savingPrescription
                }
              />

            </div>


            {/* =================================================
                MEDICATION ITEMS
            ================================================== */}

            <div className="prescription-items">

              <div className="workspace-history-header">

                <div>

                  <span className="eyebrow">
                    MEDICATIONS
                  </span>

                  <h3>
                    Prescription items
                  </h3>

                </div>

                <button
                  type="button"
                  onClick={
                    addPrescriptionItem
                  }
                  disabled={
                    !encounterId ||
                    savingPrescription
                  }
                >
                  <Plus size={16} />
                  Add medication
                </button>

              </div>


              {prescriptionItems.map(
                (item, index) => (
                  <div
                    className="prescription-item-card"
                    key={index}
                  >

                    <div className="prescription-item-header">

                      <div>

                        <span className="eyebrow">
                          MEDICATION{" "}
                          {index + 1}
                        </span>

                        <strong>
                          Medication details
                        </strong>

                      </div>

                      {prescriptionItems.length >
                        1 && (
                        <button
                          type="button"
                          className="icon-danger-button"
                          onClick={() =>
                            removePrescriptionItem(
                              index
                            )
                          }
                          disabled={
                            savingPrescription
                          }
                          title="Remove medication"
                        >
                          <Trash2 size={17} />
                        </button>
                      )}

                    </div>


                    <div className="clinical-field">

                      <label
                        htmlFor={`medication-${index}`}
                      >
                        Medication name
                      </label>

                      <input
                        id={`medication-${index}`}
                        value={
                          item.medicationName
                        }
                        onChange={(event) =>
                          updatePrescriptionItem(
                            index,
                            "medicationName",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Amoxicillin"
                        disabled={
                          !encounterId ||
                          savingPrescription
                        }
                      />

                    </div>


                    <div className="clinical-field-grid">

                      <div className="clinical-field">

                        <label
                          htmlFor={`dosage-${index}`}
                        >
                          Dosage
                        </label>

                        <input
                          id={`dosage-${index}`}
                          value={
                            item.dosage || ""
                          }
                          onChange={(event) =>
                            updatePrescriptionItem(
                              index,
                              "dosage",
                              event.target.value
                            )
                          }
                          placeholder="e.g. 500 mg"
                          disabled={
                            !encounterId ||
                            savingPrescription
                          }
                        />

                      </div>


                      <div className="clinical-field">

                        <label
                          htmlFor={`frequency-${index}`}
                        >
                          Frequency
                        </label>

                        <input
                          id={`frequency-${index}`}
                          value={
                            item.frequency ||
                            ""
                          }
                          onChange={(event) =>
                            updatePrescriptionItem(
                              index,
                              "frequency",
                              event.target.value
                            )
                          }
                          placeholder="e.g. Three times daily"
                          disabled={
                            !encounterId ||
                            savingPrescription
                          }
                        />

                      </div>

                    </div>


                    <div className="clinical-field-grid">

                      <div className="clinical-field">

                        <label
                          htmlFor={`duration-${index}`}
                        >
                          Duration
                        </label>

                        <input
                          id={`duration-${index}`}
                          value={
                            item.duration ||
                            ""
                          }
                          onChange={(event) =>
                            updatePrescriptionItem(
                              index,
                              "duration",
                              event.target.value
                            )
                          }
                          placeholder="e.g. 5 days"
                          disabled={
                            !encounterId ||
                            savingPrescription
                          }
                        />

                      </div>


                      <div className="clinical-field">

                        <label
                          htmlFor={`quantity-${index}`}
                        >
                          Quantity
                        </label>

                        <input
                          id={`quantity-${index}`}
                          value={
                            item.quantity ||
                            ""
                          }
                          onChange={(event) =>
                            updatePrescriptionItem(
                              index,
                              "quantity",
                              event.target.value
                            )
                          }
                          placeholder="e.g. 15 capsules"
                          disabled={
                            !encounterId ||
                            savingPrescription
                          }
                        />

                      </div>

                    </div>


                    <div className="clinical-field">

                      <label
                        htmlFor={`instructions-${index}`}
                      >
                        Instructions
                      </label>

                      <textarea
                        id={`instructions-${index}`}
                        value={
                          item.instructions ||
                          ""
                        }
                        onChange={(event) =>
                          updatePrescriptionItem(
                            index,
                            "instructions",
                            event.target.value
                          )
                        }
                        placeholder="How should the patient take the medication?"
                        rows={3}
                        disabled={
                          !encounterId ||
                          savingPrescription
                        }
                      />

                    </div>

                  </div>
                )
              )}

            </div>


            {prescriptionMessage && (
              <div className="clinical-success">

                <CheckCircle2 size={17} />

                <span>
                  {prescriptionMessage}
                </span>

              </div>
            )}


            {prescriptionError && (
              <div className="clinical-error">

                <ShieldCheck size={17} />

                <span>
                  {prescriptionError}
                </span>

              </div>
            )}


            <div className="clinical-form-actions">

              <div className="clinical-form-status">

                <Pill size={16} />

                <span>
                  Prescription linked to encounter
                </span>

              </div>

              <button
                type="submit"
                disabled={
                  !encounterId ||
                  savingPrescription
                }
              >

                {savingPrescription ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="spin"
                    />

                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={17} />

                    Create Prescription
                  </>
                )}

              </button>

            </div>

          </form>


          {/* =================================================
              PRESCRIPTION HISTORY
          ================================================== */}

          <div className="workspace-history">

            <div className="workspace-history-header">

              <div>

                <span className="eyebrow">
                  HISTORY
                </span>

                <h3>
                  Existing prescriptions
                </h3>

              </div>

              {loadingPrescriptions && (
                <LoaderCircle
                  size={18}
                  className="spin"
                />
              )}

            </div>


            {prescriptions.length === 0 &&
            !loadingPrescriptions ? (
              <div className="workspace-empty-state">

                <Pill size={24} />

                <strong>
                  No prescriptions recorded
                </strong>

                <span>
                  Prescriptions created during this
                  encounter will appear here.
                </span>

              </div>
            ) : (
              <div className="workspace-history-list">

                {prescriptions.map(
                  (prescription) => (
                    <article
                      key={prescription.id}
                      className="workspace-history-card"
                    >

                      <div className="workspace-history-icon">
                        <Pill size={18} />
                      </div>

                      <div className="workspace-history-content">

                        <div className="workspace-history-title">

                          <strong>
                            Prescription
                          </strong>

                          <span className={`clinical-status-badge ${(prescription.status || "active").toLowerCase()}`}>
                            {prescription.status}
                          </span>

                        </div>

                        <div className="workspace-history-meta">

                          <span>
                            Created{" "}
                            {formatDateTime(
                              prescription.createdAt
                            )}
                          </span>

                          {prescription.prescribedBy && (
                            <span>
                              • By Dr.{" "}
                              {
                                prescription
                                  .prescribedBy
                                  .firstName
                              }{" "}
                              {
                                prescription
                                  .prescribedBy
                                  .lastName
                              }
                            </span>
                          )}

                        </div>

                        {prescription.notes && (
                          <p>
                            {prescription.notes}
                          </p>
                        )}

                        <div className="prescription-history-items">

                          {prescription.items.map(
                            (item) => (
                              <div
                                key={
                                  item.id ||
                                  `${prescription.id}-${item.medicationName}`
                                }
                                className="prescription-history-item"
                              >

                                <div>

                                  <strong>
                                    {
                                      item.medicationName
                                    }
                                  </strong>

                                  {item.dosage && (
                                    <span>
                                      {
                                        item.dosage
                                      }
                                    </span>
                                  )}

                                </div>

                                <div>

                                  {item.frequency && (
                                    <span>
                                      {
                                        item.frequency
                                      }
                                    </span>
                                  )}

                                  {item.duration && (
                                    <span>
                                      {
                                        item.duration
                                      }
                                    </span>
                                  )}

                                  {item.quantity && (
                                    <span>
                                      Qty:{" "}
                                      {
                                        item.quantity
                                      }
                                    </span>
                                  )}

                                </div>

                                {item.instructions && (
                                  <small>
                                    {
                                      item.instructions
                                    }
                                  </small>
                                )}

                              </div>
                            )
                          )}

                        </div>

                      </div>

                    </article>
                  )
                )}

              </div>
            )}

          </div>

        </section>
                {/* =================================================
            PRESCRIPTION HISTORY
        ================================================== */}

        <section className="clinical-history-section">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                MEDICATION HISTORY
              </span>

              <h2>
                Prescriptions
              </h2>

            </div>

            {loadingPrescriptions && (
              <LoaderCircle
                size={18}
                className="spin"
              />
            )}

          </div>


          {loadingPrescriptions ? (

            <div className="clinical-history-empty">

              <LoaderCircle
                size={25}
                className="spin"
              />

              <strong>
                Loading prescriptions
              </strong>

              <span>
                Fetching medication history
                for this encounter.
              </span>

            </div>

          ) : prescriptions.length === 0 ? (

            <div className="clinical-history-empty">

              <Pill size={25} />

              <strong>
                No prescriptions recorded
              </strong>

              <span>
                Prescriptions created for this
                encounter will appear here.
              </span>

            </div>

          ) : (

            <div className="clinical-notes-list">

              {prescriptions.map(
                (prescription) => (

                  <article
                    key={prescription.id}
                    className="clinical-note-card"
                  >

                    <div className="clinical-note-header">

                      <div>

                        <span>
                          Prescription
                        </span>

                        <strong>
                          {formatDateTime(
                            prescription.createdAt
                          )}
                        </strong>

                      </div>

                      <div className="clinical-note-status">

                        <CheckCircle2 size={14} />

                        {prescription.status}

                      </div>

                    </div>


                    {prescription.prescribedBy && (

                      <div className="clinical-note-author">

                        <UserRound size={14} />

                        <span>

                          {
                            prescription
                              .prescribedBy
                              .firstName
                          }{" "}

                          {
                            prescription
                              .prescribedBy
                              .lastName
                          }

                        </span>

                        <small>

                          {
                            prescription
                              .prescribedBy
                              .role
                          }

                        </small>

                      </div>

                    )}


                    <div className="clinical-note-grid">

                      {prescription.items.map(
                        (item, index) => (

                          <div
                            key={
                              item.id ||
                              index
                            }
                          >

                            <span>
                              {
                                item.medicationName
                              }
                            </span>

                            <p>

                              {item.dosage ||
                                "Dose not specified"}

                              {" • "}

                              {item.frequency ||
                                "Frequency not specified"}

                              {" • "}

                              {item.duration ||
                                "Duration not specified"}

                            </p>


                            {item.quantity && (

                              <p>

                                Quantity:{" "}

                                {item.quantity}

                              </p>

                            )}


                            {item.instructions && (

                              <p>

                                {
                                  item.instructions
                                }

                              </p>

                            )}

                          </div>

                        )
                      )}


                      {prescription.notes && (

                        <div>

                          <span>
                            Notes
                          </span>

                          <p>
                            {
                              prescription.notes
                            }
                          </p>

                        </div>

                      )}

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>


        {/* =================================================
            LABORATORY
        ================================================== */}

        <LaboratoryOrderPanel
          patientId={patient.id}
          encounterId={encounterId}
        />


        {/* =================================================
            CLINICAL NOTES HISTORY
        ================================================== */}

        <section className="clinical-history-section">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                CLINICAL HISTORY
              </span>

              <h2>
                Previous clinical notes
              </h2>

            </div>

            {loadingNotes && (

              <LoaderCircle
                size={18}
                className="spin"
              />

            )}

          </div>


          {loadingNotes ? (

            <div className="clinical-history-empty">

              <LoaderCircle
                size={25}
                className="spin"
              />

              <strong>
                Loading clinical notes
              </strong>

              <span>
                Fetching the patient's
                clinical history.
              </span>

            </div>

          ) : clinicalNotes.length === 0 ? (

            <div className="clinical-history-empty">

              <FileText size={25} />

              <strong>
                No clinical notes recorded
              </strong>

              <span>
                Clinical notes recorded for
                this encounter will appear here.
              </span>

            </div>

          ) : (

            <div className="clinical-notes-list">

              {clinicalNotes.map(
                (note) => (

                  <article
                    key={note.id}
                    className="clinical-note-card"
                  >

                    <div className="clinical-note-header">

                      <div>

                        <span>
                          Clinical note
                        </span>

                        <strong>
                          {formatDateTime(
                            note.createdAt
                          )}
                        </strong>

                      </div>

                      <div className="clinical-note-status">

                        <CheckCircle2 size={14} />

                        Recorded

                      </div>

                    </div>


                    {note.author && (

                      <div className="clinical-note-author">

                        <UserRound size={14} />

                        <span>

                          {
                            note.author
                              .firstName
                          }{" "}

                          {
                            note.author
                              .lastName
                          }

                        </span>

                        <small>

                          {
                            note.author
                              .role
                          }

                        </small>

                      </div>

                    )}


                    <div className="clinical-note-grid">

                      {note.subjective && (

                        <div>

                          <span>
                            Subjective
                          </span>

                          <p>
                            {note.subjective}
                          </p>

                        </div>

                      )}


                      {note.objective && (

                        <div>

                          <span>
                            Objective
                          </span>

                          <p>
                            {note.objective}
                          </p>

                        </div>

                      )}


                      {note.assessment && (

                        <div>

                          <span>
                            Assessment
                          </span>

                          <p>
                            {note.assessment}
                          </p>

                        </div>

                      )}


                      {note.plan && (

                        <div>

                          <span>
                            Plan
                          </span>

                          <p>
                            {note.plan}
                          </p>

                        </div>

                      )}

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>


        {/* =================================================
            PAYMENT ACTION
        ================================================== */}

        <section className="workspace-payment-banner">

          <div className="workspace-payment-content">

            <div className="workspace-payment-icon">

              <CreditCard size={24} />

            </div>


            <div>

              <span className="eyebrow">
                MEDCARD PAYMENT
              </span>

              <h2>
                Ready to settle this visit?
              </h2>

              <p>
                Review the patient's charges,
                insurance responsibility and available
                payment options before completing the
                transaction.
              </p>

            </div>

          </div>


          <div className="workspace-payment-action">

            <div className="workspace-payment-security">

              <ShieldCheck size={16} />

              <span>
                Patient already verified
              </span>

            </div>


            <button
              type="button"
              onClick={handleOpenPayment}
              disabled={
                !patientId ||
                !encounterId
              }
            >

              <CreditCard size={18} />

              Review & Pay

            </button>

          </div>

        </section>


        {/* =================================================
            SYSTEM FOOTER
        ================================================== */}

        <section className="workspace-system-footer">

          <div>

            <ShieldCheck size={18} />

            <div>

              <strong>
                Verified MedCard identity
              </strong>

              <span>
                Clinical information is connected
                to the patient's MedCard record.
              </span>

            </div>

          </div>


          <div>

            <Activity size={17} />

            <span>
              Patient record updated{" "}
              {formatDateTime(
                patient.updatedAt
              )}
            </span>

          </div>

        </section>

      </main>

    </div>
  );
}

export default PatientWorkspacePage;