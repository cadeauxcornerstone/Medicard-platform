import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Activity,
  ArrowLeft,
  Beaker,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LoaderCircle,
  LogOut,
  Pill,
  RefreshCw,
  Search,
  ShieldCheck,
  
  Wifi,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_URL =
  "http://localhost:5000/api/v1";

const DEVELOPMENT_FACILITY_ID =
  "9e268cfd-1e17-47cf-aadb-be42c58ad79f";

const DEVELOPMENT_USER_ID =
  "ac844b2b-cc1b-45a4-9404-e059fdd6df0b";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type PrescriptionStatus =
  | "ACTIVE"
  | "DISPENSED"
  | "CANCELLED"
  | "COMPLETED";

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string;
  phone: string | null;
}

interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicationName: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: string | null;
  instructions: string | null;
  createdAt: string;
}

interface PrescribedBy {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Encounter {
  id: string;
  patientId: string;
  facilityId: string;
  status: string;
  startedAt: string;
}

interface Prescription {
  id: string;
  patientId: string;
  encounterId: string;
  prescribedById: string;
  status: PrescriptionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  patient: Patient;
  items: PrescriptionItem[];
  prescribedBy: PrescribedBy;
  encounter: Encounter;
}

interface QueueSummary {
  active: number;
  dispensed: number;
  completed: number;
  cancelled: number;
  total: number;
}

interface DispensingItemResult {
  id: string;
  dispensingRecordId: string;
  prescriptionItemId: string;
  quantityDispensed: string;
  createdAt: string;
}

interface DispensingRecordResult {
  id: string;
  prescriptionId: string;
  dispensedById: string;
  notes: string | null;
  dispensedAt: string;

  dispensedBy: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };

  items: DispensingItemResult[];
}

interface DispensingResponse {
  dispensingRecord: DispensingRecordResult;
  prescription: Prescription;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
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

const getInitials = (
  firstName: string,
  lastName: string
) => {
  return `${firstName?.[0] || ""}${
    lastName?.[0] || ""
  }`.toUpperCase();
};

const getStatusLabel = (
  status: PrescriptionStatus
) => {
  switch (status) {
    case "ACTIVE":
      return "Awaiting dispensing";

    case "DISPENSED":
      return "Dispensed";

    case "COMPLETED":
      return "Completed";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status;
  }
};

const getStatusClass = (
  status: PrescriptionStatus
) => {
  switch (status) {
    case "ACTIVE":
      return "pharmacy-status-active";

    case "DISPENSED":
      return "pharmacy-status-dispensed";

    case "COMPLETED":
      return "pharmacy-status-completed";

    case "CANCELLED":
      return "pharmacy-status-cancelled";

    default:
      return "";
  }
};

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

function PharmacyWorkspacePage() {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | QUEUE STATE
  |--------------------------------------------------------------------------
  */

  const [
    prescriptions,
    setPrescriptions,
  ] = useState<Prescription[]>([]);

  const [
    summary,
    setSummary,
  ] = useState<QueueSummary | null>(null);

  const [
    selectedPrescription,
    setSelectedPrescription,
  ] = useState<Prescription | null>(
    null
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingSummary,
    setLoadingSummary,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState<Date | null>(null);

  /*
  |--------------------------------------------------------------------------
  | DISPENSING STATE
  |--------------------------------------------------------------------------
  */

  const [
    dispensingMode,
    setDispensingMode,
  ] = useState(false);

  const [
    dispensing,
    setDispensing,
  ] = useState(false);

  const [
    dispensingError,
    setDispensingError,
  ] = useState("");

  const [
    dispensingNotes,
    setDispensingNotes,
  ] = useState("");

  const [
    dispensingQuantities,
    setDispensingQuantities,
  ] = useState<
    Record<string, string>
  >({});

  const [
    dispensingSuccess,
    setDispensingSuccess,
  ] = useState<
    DispensingResponse | null
  >(null);

  /*
  |--------------------------------------------------------------------------
  | LOAD QUEUE
  |--------------------------------------------------------------------------
  */

  const loadQueue = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const query =
          new URLSearchParams();

        query.set(
          "facilityId",
          DEVELOPMENT_FACILITY_ID
        );

        if (search.trim()) {
          query.set(
            "search",
            search.trim()
          );
        }

        const response =
          await fetch(
            `${API_URL}/pharmacy/prescriptions?${query.toString()}`
          );

        if (!response.ok) {
          throw new Error(
            "Failed to load pharmacy queue."
          );
        }

        const result: ApiResponse<
          Prescription[]
        > = await response.json();

        if (!result.success) {
          throw new Error(
            result.message ||
              "Unable to load pharmacy queue."
          );
        }

        setPrescriptions(
          result.data || []
        );

        setLastUpdated(
          new Date()
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load pharmacy queue."
        );
      } finally {
        setLoading(false);
      }
    },
    [search]
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD SUMMARY
  |--------------------------------------------------------------------------
  */

  const loadSummary =
    useCallback(async () => {
      try {
        setLoadingSummary(true);

        const response =
          await fetch(
            `${API_URL}/pharmacy/summary?facilityId=${DEVELOPMENT_FACILITY_ID}`
          );

        if (!response.ok) {
          throw new Error(
            "Failed to load pharmacy summary."
          );
        }

        const result: ApiResponse<
          QueueSummary
        > = await response.json();

        if (!result.success) {
          throw new Error(
            result.message ||
              "Unable to load summary."
          );
        }

        setSummary(
          result.data
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSummary(false);
      }
    }, []);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const refreshWorkspace =
    async () => {
      await Promise.all([
        loadQueue(),
        loadSummary(),
      ]);
    };

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const handleSearch =
    async () => {
      await loadQueue();
    };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout = () => {
    navigate("/login");
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN PRESCRIPTION
  |--------------------------------------------------------------------------
  */

  const openPrescription = (
    prescription: Prescription
  ) => {
    setSelectedPrescription(
      prescription
    );

    setDispensingMode(false);
    setDispensingError("");
    setDispensingSuccess(null);
    setDispensingNotes("");

    const initialQuantities: Record<
      string,
      string
    > = {};

    prescription.items.forEach(
      (item) => {
        initialQuantities[item.id] =
          item.quantity || "";
      }
    );

    setDispensingQuantities(
      initialQuantities
    );
  };

  /*
  |--------------------------------------------------------------------------
  | START DISPENSING
  |--------------------------------------------------------------------------
  */

  const startDispensing = () => {
    if (!selectedPrescription) {
      return;
    }

    setDispensingMode(true);
    setDispensingError("");
    setDispensingSuccess(null);

    const initialQuantities: Record<
      string,
      string
    > = {};

    selectedPrescription.items.forEach(
      (item) => {
        initialQuantities[item.id] =
          item.quantity || "";
      }
    );

    setDispensingQuantities(
      initialQuantities
    );
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE DISPENSING QUANTITY
  |--------------------------------------------------------------------------
  */

  const updateDispensingQuantity = (
    prescriptionItemId: string,
    value: string
  ) => {
    setDispensingQuantities(
      (current) => ({
        ...current,
        [prescriptionItemId]:
          value,
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | CONFIRM DISPENSING
  |--------------------------------------------------------------------------
  */

  const confirmDispensing =
    async () => {
      if (!selectedPrescription) {
        return;
      }

      try {
        setDispensing(true);
        setDispensingError("");

        /*
        |--------------------------------------------------------------------------
        | Validate quantities
        |--------------------------------------------------------------------------
        */

        for (const item of
          selectedPrescription.items) {
          const quantity =
            dispensingQuantities[
              item.id
            ]?.trim();

          if (!quantity) {
            setDispensingError(
              `Please enter the quantity dispensed for ${item.medicationName}.`
            );

            setDispensing(false);

            return;
          }
        }

        /*
        |--------------------------------------------------------------------------
        | Build request
        |--------------------------------------------------------------------------
        */

        const payload = {
          dispensedById:
            DEVELOPMENT_USER_ID,

          facilityId:
            DEVELOPMENT_FACILITY_ID,

          notes:
            dispensingNotes.trim() ||
            null,

          items:
            selectedPrescription.items.map(
              (item) => ({
                prescriptionItemId:
                  item.id,

                quantityDispensed:
                  dispensingQuantities[
                    item.id
                  ].trim(),
              })
            ),
        };

        /*
        |--------------------------------------------------------------------------
        | Send dispensing request
        |--------------------------------------------------------------------------
        */

        const response =
          await fetch(
            `${API_URL}/prescriptions/${selectedPrescription.id}/dispense`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                payload
              ),
            }
          );

        const result: ApiResponse<
          DispensingResponse
        > = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to dispense prescription."
          );
        }

        if (!result.success) {
          throw new Error(
            result.message ||
              "Dispensing failed."
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Success
        |--------------------------------------------------------------------------
        */

        setDispensingSuccess(
          result.data
        );

        setSelectedPrescription(
          result.data.prescription
        );

        setDispensingMode(false);

        /*
        |--------------------------------------------------------------------------
        | Refresh pharmacy data
        |--------------------------------------------------------------------------
        */

        await Promise.all([
          loadQueue(),
          loadSummary(),
        ]);
      } catch (err) {
        console.error(err);

        setDispensingError(
          err instanceof Error
            ? err.message
            : "Unable to complete dispensing."
        );
      } finally {
        setDispensing(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | CLOSE MODAL
  |--------------------------------------------------------------------------
  */

  const closePrescription =
    () => {
      if (dispensing) {
        return;
      }

      setSelectedPrescription(
        null
      );

      setDispensingMode(false);
      setDispensingError("");
      setDispensingSuccess(null);
      setDispensingNotes("");
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="pharmacy-page">

      {/* ================================================================
          HEADER
      ================================================================ */}

      <header className="pharmacy-header">

        <div className="pharmacy-header-left">

          <button
            type="button"
            className="pharmacy-icon-button"
            onClick={() =>
              navigate("/dashboard")
            }
            title="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="pharmacy-brand">

            <div className="pharmacy-brand-icon">
              <Pill size={22} />
            </div>

            <div>
              <h1>
                MedCard Pharmacy
              </h1>

              <p>
                Dispensing Workspace
              </p>
            </div>

          </div>

        </div>

        <div className="pharmacy-header-right">

          <div className="pharmacy-connection">

            <Wifi size={16} />

            <span>
              Connected
            </span>

          </div>

          <button
            type="button"
            className="pharmacy-logout-button"
            onClick={
              handleLogout
            }
          >
            <LogOut size={17} />

            <span>
              Logout
            </span>
          </button>

        </div>

      </header>


      {/* ================================================================
          MAIN
      ================================================================ */}

      <main className="pharmacy-main">

        {/* ==============================================================
            PAGE INTRO
        ============================================================== */}

        <section className="pharmacy-intro">

          <div>

            <div className="pharmacy-eyebrow">
              <ShieldCheck size={15} />

              PHARMACY SERVICES
            </div>

            <h2>
              Prescription Queue
            </h2>

            <p>
              Review active prescriptions
              and verify medication orders
              before dispensing.
            </p>

          </div>

          <button
            type="button"
            className="pharmacy-refresh-button"
            onClick={
              refreshWorkspace
            }
            disabled={
              loading ||
              loadingSummary
            }
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "pharmacy-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </section>


        {/* ==============================================================
            SUMMARY CARDS
        ============================================================== */}

        <section className="pharmacy-summary-grid">

          <div className="pharmacy-summary-card pharmacy-summary-primary">

            <div className="pharmacy-summary-icon">
              <Clock3 size={21} />
            </div>

            <div>

              <span>
                Awaiting dispensing
              </span>

              <strong>
                {loadingSummary
                  ? "—"
                  : summary?.active ?? 0}
              </strong>

            </div>

          </div>


          <div className="pharmacy-summary-card">

            <div className="pharmacy-summary-icon">
              <CheckCircle2 size={21} />
            </div>

            <div>

              <span>
                Dispensed
              </span>

              <strong>
                {loadingSummary
                  ? "—"
                  : summary?.dispensed ?? 0}
              </strong>

            </div>

          </div>


          <div className="pharmacy-summary-card">

            <div className="pharmacy-summary-icon">
              <ClipboardList size={21} />
            </div>

            <div>

              <span>
                Completed
              </span>

              <strong>
                {loadingSummary
                  ? "—"
                  : summary?.completed ?? 0}
              </strong>

            </div>

          </div>


          <div className="pharmacy-summary-card">

            <div className="pharmacy-summary-icon">
              <Activity size={21} />
            </div>

            <div>

              <span>
                Total prescriptions
              </span>

              <strong>
                {loadingSummary
                  ? "—"
                  : summary?.total ?? 0}
              </strong>

            </div>

          </div>

        </section>


        {/* ==============================================================
            SEARCH
        ============================================================== */}

        <section className="pharmacy-search-card">

          <div className="pharmacy-search-heading">

            <div>

              <h3>
                Find Prescription
              </h3>

              <p>
                Search by patient name,
                patient number, or prescription
                ID.
              </p>

            </div>

          </div>


          <div className="pharmacy-search-row">

            <div className="pharmacy-search-input">

              <Search size={19} />

              <input
                type="text"
                value={search}
                placeholder="Search patient or prescription..."
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    handleSearch();
                  }
                }}
              />

              {search && (
                <button
                  type="button"
                  className="pharmacy-clear-search"
                  onClick={() => {
                    setSearch("");
                  }}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}

            </div>

            <button
              type="button"
              className="pharmacy-search-button"
              onClick={
                handleSearch
              }
              disabled={loading}
            >
              {loading ? (
                <LoaderCircle
                  size={17}
                  className="pharmacy-spin"
                />
              ) : (
                <Search size={17} />
              )}

              Search
            </button>

          </div>

        </section>


        {/* ==============================================================
            ERROR
        ============================================================== */}

        {error && (
          <div className="pharmacy-error">

            <Activity size={18} />

            <div>

              <strong>
                Unable to load pharmacy queue
              </strong>

              <p>
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={
                refreshWorkspace
              }
            >
              Try again
            </button>

          </div>
        )}


        {/* ==============================================================
            QUEUE
        ============================================================== */}

        <section className="pharmacy-queue-card">

          <div className="pharmacy-section-header">

            <div>

              <div className="pharmacy-section-title">

                <Beaker size={19} />

                <h3>
                  Awaiting Dispensing
                </h3>

              </div>

              <p>
                Active prescriptions requiring
                pharmacy review.
              </p>

            </div>

            <div className="pharmacy-queue-count">

              {prescriptions.length}

              <span>
                prescription
                {prescriptions.length ===
                1
                  ? ""
                  : "s"}
              </span>

            </div>

          </div>


          {/* LOADING */}

          {loading && (
            <div className="pharmacy-loading">

              <LoaderCircle
                size={30}
                className="pharmacy-spin"
              />

              <p>
                Loading prescriptions...
              </p>

            </div>
          )}


          {/* EMPTY */}

          {!loading &&
            prescriptions.length ===
              0 && (
              <div className="pharmacy-empty">

                <div className="pharmacy-empty-icon">
                  <CheckCircle2 size={28} />
                </div>

                <h3>
                  No prescriptions waiting
                </h3>

                <p>
                  There are currently no
                  active prescriptions in
                  the pharmacy queue.
                </p>

              </div>
            )}


          {/* PRESCRIPTION LIST */}

          {!loading &&
            prescriptions.length >
              0 && (
              <div className="pharmacy-prescription-list">

                {prescriptions.map(
                  (
                    prescription
                  ) => (
                    <article
                      key={
                        prescription.id
                      }
                      className="pharmacy-prescription-row"
                    >

                      {/* PATIENT */}

                      <div className="pharmacy-patient-cell">

                        <div className="pharmacy-avatar">

                          {getInitials(
                            prescription
                              .patient
                              .firstName,
                            prescription
                              .patient
                              .lastName
                          )}

                        </div>

                        <div>

                          <strong>
                            {
                              prescription
                                .patient
                                .firstName
                            }{" "}
                            {
                              prescription
                                .patient
                                .lastName
                            }
                          </strong>

                          <span>
                            {
                              prescription
                                .patient
                                .patientNumber
                            }
                          </span>

                        </div>

                      </div>


                      {/* MEDICATIONS */}

                      <div className="pharmacy-medication-cell">

                        <div className="pharmacy-medication-count">

                          <Pill size={16} />

                          <strong>
                            {
                              prescription
                                .items
                                .length
                            }
                          </strong>

                          <span>
                            medication
                            {prescription
                              .items
                              .length ===
                            1
                              ? ""
                              : "s"}
                          </span>

                        </div>

                        <span className="pharmacy-medication-preview">

                          {prescription.items
                            .slice(
                              0,
                              2
                            )
                            .map(
                              (
                                item
                              ) =>
                                item.medicationName
                            )
                            .join(
                              ", "
                            )}

                          {prescription
                            .items
                            .length >
                            2 &&
                            ` +${
                              prescription
                                .items
                                .length -
                              2
                            } more`}

                        </span>

                      </div>


                      {/* PRESCRIBER */}

                      <div className="pharmacy-prescriber-cell">

                        <span>
                          Prescribed by
                        </span>

                        <strong>
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
                        </strong>

                      </div>


                      {/* DATE */}

                      <div className="pharmacy-date-cell">

                        <span>
                          Created
                        </span>

                        <strong>
                          {formatDateTime(
                            prescription.createdAt
                          )}
                        </strong>

                      </div>


                      {/* STATUS */}

                      <div className="pharmacy-status-cell">

                        <span
                          className={`pharmacy-status ${getStatusClass(
                            prescription.status
                          )}`}
                        >

                          <span className="pharmacy-status-dot" />

                          {getStatusLabel(
                            prescription.status
                          )}

                        </span>

                      </div>


                      {/* ACTION */}

                      <div className="pharmacy-action-cell">

                        <button
                          type="button"
                          className="pharmacy-view-button"
                          onClick={() =>
                            openPrescription(
                              prescription
                            )
                          }
                        >
                          View
                        </button>

                      </div>

                    </article>
                  )
                )}

              </div>
            )}

        </section>


        {/* ==============================================================
            LAST UPDATED
        ============================================================== */}

        {lastUpdated && (
          <div className="pharmacy-last-updated">

            <RefreshCw size={14} />

            Last updated{" "}
            {lastUpdated.toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}

          </div>
        )}

      </main>


      {/* ================================================================
          PRESCRIPTION MODAL
      ================================================================ */}

      {selectedPrescription && (
        <div
          className="pharmacy-modal-backdrop"
          onClick={
            closePrescription
          }
        >

          <div
            className="pharmacy-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* ==========================================================
                SUCCESS VIEW
            ========================================================== */}

            {dispensingSuccess ? (
              <>
                <div className="pharmacy-modal-header">

                  <div>

                    <div className="pharmacy-modal-label">

                      <CheckCircle2
                        size={15}
                      />

                      DISPENSING COMPLETE

                    </div>

                    <h2>
                      Medication Dispensed
                    </h2>

                  </div>

                  <button
                    type="button"
                    className="pharmacy-modal-close"
                    onClick={
                      closePrescription
                    }
                    title="Close"
                  >
                    <X size={20} />
                  </button>

                </div>


                <div className="pharmacy-success-panel">

                  <div className="pharmacy-success-icon">
                    <CheckCircle2
                      size={42}
                    />
                  </div>

                  <h3>
                    Dispensing completed
                    successfully
                  </h3>

                  <p>
                    The prescription has
                    been recorded as dispensed
                    and the transaction has
                    been saved to the MedCard
                    audit trail.
                  </p>

                </div>


                <div className="pharmacy-modal-patient">

                  <div className="pharmacy-modal-patient-avatar">

                    {getInitials(
                      selectedPrescription
                        .patient
                        .firstName,
                      selectedPrescription
                        .patient
                        .lastName
                    )}

                  </div>

                  <div>

                    <span>
                      Patient
                    </span>

                    <strong>
                      {
                        selectedPrescription
                          .patient
                          .firstName
                      }{" "}
                      {
                        selectedPrescription
                          .patient
                          .lastName
                      }
                    </strong>

                    <p>
                      {
                        selectedPrescription
                          .patient
                          .patientNumber
                      }
                    </p>

                  </div>

                  <span className="pharmacy-status pharmacy-status-dispensed">

                    <span className="pharmacy-status-dot" />

                    Dispensed

                  </span>

                </div>


                <div className="pharmacy-dispensing-receipt">

                  <div className="pharmacy-receipt-header">

                    <div>
                      <strong>
                        Dispensing summary
                      </strong>

                      <span>
                        {
                          selectedPrescription
                            .items
                            .length
                        }{" "}
                        medication
                        {selectedPrescription
                          .items
                          .length ===
                        1
                          ? ""
                          : "s"}
                      </span>
                    </div>

                    <CheckCircle2
                      size={20}
                    />

                  </div>


                  {dispensingSuccess
                    .dispensingRecord
                    .items
                    .map(
                      (
                        dispensingItem
                      ) => {

                        const medication =
                          selectedPrescription.items.find(
                            (item) =>
                              item.id ===
                              dispensingItem.prescriptionItemId
                          );

                        return (
                          <div
                            key={
                              dispensingItem.id
                            }
                            className="pharmacy-receipt-item"
                          >

                            <div>

                              <strong>
                                {medication
                                  ?.medicationName ||
                                  "Medication"}
                              </strong>

                              {medication?.dosage && (
                                <span>
                                  {
                                    medication.dosage
                                  }
                                </span>
                              )}

                            </div>

                            <strong>
                              {
                                dispensingItem.quantityDispensed
                              }
                            </strong>

                          </div>
                        );
                      }
                    )}

                </div>


                <div className="pharmacy-dispensed-meta">

                  <div>

                    <span>
                      Dispensed by
                    </span>

                    <strong>
                      {
                        dispensingSuccess
                          .dispensingRecord
                          .dispensedBy
                          .firstName
                      }{" "}
                      {
                        dispensingSuccess
                          .dispensingRecord
                          .dispensedBy
                          .lastName
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Date & time
                    </span>

                    <strong>
                      {formatDateTime(
                        dispensingSuccess
                          .dispensingRecord
                          .dispensedAt
                      )}
                    </strong>

                  </div>

                </div>


                <div className="pharmacy-modal-actions">

                  <button
                    type="button"
                    className="pharmacy-secondary-button"
                    onClick={
                      closePrescription
                    }
                  >
                    Back to Queue
                  </button>

                  <button
                    type="button"
                    className="pharmacy-primary-button"
                    onClick={
                      closePrescription
                    }
                  >
                    <CheckCircle2
                      size={17}
                    />

                    Done
                  </button>

                </div>

              </>
            ) : dispensingMode ? (

              /* ========================================================
                 DISPENSING CONFIRMATION
              ======================================================== */

              <>

                <div className="pharmacy-modal-header">

                  <div>

                    <div className="pharmacy-modal-label">

                      <Pill size={15} />

                      DISPENSING

                    </div>

                    <h2>
                      Confirm Dispensing
                    </h2>

                  </div>

                  <button
                    type="button"
                    className="pharmacy-modal-close"
                    onClick={() =>
                      setDispensingMode(
                        false
                      )
                    }
                    disabled={
                      dispensing
                    }
                    title="Close"
                  >
                    <X size={20} />
                  </button>

                </div>


                {/* PATIENT */}

                <div className="pharmacy-modal-patient">

                  <div className="pharmacy-modal-patient-avatar">

                    {getInitials(
                      selectedPrescription
                        .patient
                        .firstName,
                      selectedPrescription
                        .patient
                        .lastName
                    )}

                  </div>

                  <div>

                    <span>
                      Patient
                    </span>

                    <strong>
                      {
                        selectedPrescription
                          .patient
                          .firstName
                      }{" "}
                      {
                        selectedPrescription
                          .patient
                          .lastName
                      }
                    </strong>

                    <p>
                      {
                        selectedPrescription
                          .patient
                          .patientNumber
                      }
                    </p>

                  </div>

                  <span className="pharmacy-status pharmacy-status-active">

                    <span className="pharmacy-status-dot" />

                    Awaiting dispensing

                  </span>

                </div>


                {/* DISPENSING NOTICE */}

                <div className="pharmacy-verification-notice">

                  <ShieldCheck
                    size={20}
                  />

                  <div>

                    <strong>
                      Final verification
                    </strong>

                    <p>
                      Confirm the quantities
                      actually supplied to the
                      patient before completing
                      this transaction.
                    </p>

                  </div>

                </div>


                {/* MEDICATIONS */}

                <div className="pharmacy-modal-section">

                  <div className="pharmacy-modal-section-title">

                    <Pill size={19} />

                    <h3>
                      Dispensing quantities
                    </h3>

                  </div>


                  <div className="pharmacy-medication-list">

                    {selectedPrescription.items.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            item.id
                          }
                          className="pharmacy-medication-card"
                        >

                          <div className="pharmacy-medication-number">
                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </div>

                          <div className="pharmacy-medication-content">

                            <h4>
                              {
                                item.medicationName
                              }
                            </h4>

                            <div className="pharmacy-medication-details">

                              {item.dosage && (
                                <div>
                                  <span>
                                    Dosage
                                  </span>

                                  <strong>
                                    {
                                      item.dosage
                                    }
                                  </strong>
                                </div>
                              )}

                              {item.frequency && (
                                <div>
                                  <span>
                                    Frequency
                                  </span>

                                  <strong>
                                    {
                                      item.frequency
                                    }
                                  </strong>
                                </div>
                              )}

                              {item.duration && (
                                <div>
                                  <span>
                                    Duration
                                  </span>

                                  <strong>
                                    {
                                      item.duration
                                    }
                                  </strong>
                                </div>
                              )}

                              {item.quantity && (
                                <div>
                                  <span>
                                    Prescribed
                                  </span>

                                  <strong>
                                    {
                                      item.quantity
                                    }
                                  </strong>
                                </div>
                              )}

                            </div>


                            {/* QUANTITY */}

                            <div className="pharmacy-dispense-quantity">

                              <label
                                htmlFor={`dispense-${item.id}`}
                              >
                                Quantity dispensed
                              </label>

                              <input
                                id={`dispense-${item.id}`}
                                type="text"
                                value={
                                  dispensingQuantities[
                                    item.id
                                  ] || ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateDispensingQuantity(
                                    item.id,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder={
                                  item.quantity ||
                                  "Enter quantity"
                                }
                                disabled={
                                  dispensing
                                }
                              />

                            </div>


                            {item.instructions && (
                              <div className="pharmacy-instructions">

                                <ClipboardList
                                  size={15}
                                />

                                <span>
                                  {
                                    item.instructions
                                  }
                                </span>

                              </div>
                            )}

                          </div>

                        </div>
                      )
                    )}

                  </div>

                </div>


                {/* NOTES */}

                <div className="pharmacy-dispensing-notes">

                  <label htmlFor="dispensing-notes">
                    Dispensing notes
                    <span>
                      Optional
                    </span>
                  </label>

                  <textarea
                    id="dispensing-notes"
                    value={
                      dispensingNotes
                    }
                    onChange={(
                      event
                    ) =>
                      setDispensingNotes(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Add any relevant dispensing notes..."
                    rows={3}
                    disabled={
                      dispensing
                    }
                  />

                </div>


                {/* ERROR */}

                {dispensingError && (
                  <div className="pharmacy-error">

                    <Activity
                      size={18}
                    />

                    <div>

                      <strong>
                        Dispensing failed
                      </strong>

                      <p>
                        {
                          dispensingError
                        }
                      </p>

                    </div>

                  </div>
                )}


                {/* ACTIONS */}

                <div className="pharmacy-modal-actions">

                  <button
                    type="button"
                    className="pharmacy-secondary-button"
                    onClick={() =>
                      setDispensingMode(
                        false
                      )
                    }
                    disabled={
                      dispensing
                    }
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    className="pharmacy-primary-button"
                    onClick={
                      confirmDispensing
                    }
                    disabled={
                      dispensing
                    }
                  >

                    {dispensing ? (
                      <>
                        <LoaderCircle
                          size={17}
                          className="pharmacy-spin"
                        />

                        Processing...

                      </>
                    ) : (
                      <>
                        <CheckCircle2
                          size={17}
                        />

                        Confirm Dispensing
                      </>
                    )}

                  </button>

                </div>

              </>

            ) : (

              /* ========================================================
                 PRESCRIPTION VERIFICATION
              ======================================================== */

              <>

                <div className="pharmacy-modal-header">

                  <div>

                    <div className="pharmacy-modal-label">

                      <ShieldCheck
                        size={15}
                      />

                      PRESCRIPTION
                      VERIFICATION

                    </div>

                    <h2>
                      Medication Order
                    </h2>

                  </div>

                  <button
                    type="button"
                    className="pharmacy-modal-close"
                    onClick={
                      closePrescription
                    }
                    title="Close"
                  >
                    <X size={20} />
                  </button>

                </div>


                {/* PATIENT CARD */}

                <div className="pharmacy-modal-patient">

                  <div className="pharmacy-modal-patient-avatar">

                    {getInitials(
                      selectedPrescription
                        .patient
                        .firstName,
                      selectedPrescription
                        .patient
                        .lastName
                    )}

                  </div>

                  <div>

                    <span>
                      Patient
                    </span>

                    <strong>
                      {
                        selectedPrescription
                          .patient
                          .firstName
                      }{" "}
                      {
                        selectedPrescription
                          .patient
                          .lastName
                      }
                    </strong>

                    <p>
                      {
                        selectedPrescription
                          .patient
                          .patientNumber
                      }
                    </p>

                  </div>

                  <span
                    className={`pharmacy-status ${getStatusClass(
                      selectedPrescription.status
                    )}`}
                  >

                    <span className="pharmacy-status-dot" />

                    {getStatusLabel(
                      selectedPrescription.status
                    )}

                  </span>

                </div>


                {/* PRESCRIPTION META */}

                <div className="pharmacy-modal-meta">

                  <div>

                    <span>
                      Prescribed by
                    </span>

                    <strong>
                      {
                        selectedPrescription
                          .prescribedBy
                          .firstName
                      }{" "}
                      {
                        selectedPrescription
                          .prescribedBy
                          .lastName
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Prescription date
                    </span>

                    <strong>
                      {formatDateTime(
                        selectedPrescription
                          .createdAt
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Encounter
                    </span>

                    <strong>
                      {selectedPrescription
                        .encounterId
                        .slice(0, 8)}
                      ...
                    </strong>

                  </div>

                </div>


                {/* MEDICATIONS */}

                <div className="pharmacy-modal-section">

                  <div className="pharmacy-modal-section-title">

                    <Pill size={19} />

                    <h3>
                      Medications
                    </h3>

                  </div>


                  <div className="pharmacy-medication-list">

                    {selectedPrescription.items.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            item.id
                          }
                          className="pharmacy-medication-card"
                        >

                          <div className="pharmacy-medication-number">

                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}

                          </div>

                          <div className="pharmacy-medication-content">

                            <h4>
                              {
                                item.medicationName
                              }
                            </h4>

                            <div className="pharmacy-medication-details">

                              {item.dosage && (
                                <div>
                                  <span>
                                    Dosage
                                  </span>

                                  <strong>
                                    {
                                      item.dosage
                                    }
                                  </strong>
                                </div>
                              )}

                              {item.frequency && (
                                <div>
                                  <span>
                                    Frequency
                                  </span>

                                  <strong>
                                    {
                                      item.frequency
                                    }
                                  </strong>
                                </div>
                              )}

                              {item.duration && (
                                <div>
                                  <span>
                                    Duration
                                  </span>

                                  <strong>
                                    {
                                      item.duration
                                    }
                                  </strong>
                                </div>
                              )}

                              {item.quantity && (
                                <div>
                                  <span>
                                    Quantity
                                  </span>

                                  <strong>
                                    {
                                      item.quantity
                                    }
                                  </strong>
                                </div>
                              )}

                            </div>

                            {item.instructions && (
                              <div className="pharmacy-instructions">

                                <ClipboardList
                                  size={15}
                                />

                                <span>
                                  {
                                    item.instructions
                                  }
                                </span>

                              </div>
                            )}

                          </div>

                        </div>
                      )
                    )}

                  </div>

                </div>


                {/* NOTES */}

                {selectedPrescription.notes && (
                  <div className="pharmacy-notes">

                    <div className="pharmacy-notes-icon">

                      <ClipboardList
                        size={17}
                      />

                    </div>

                    <div>

                      <strong>
                        Prescriber notes
                      </strong>

                      <p>
                        {
                          selectedPrescription
                            .notes
                        }
                      </p>

                    </div>

                  </div>
                )}


                {/* VERIFICATION NOTICE */}

                <div className="pharmacy-verification-notice">

                  <ShieldCheck
                    size={20}
                  />

                  <div>

                    <strong>
                      Verification required
                    </strong>

                    <p>
                      Confirm the patient,
                      prescription and
                      medication details before
                      proceeding to dispensing.
                    </p>

                  </div>

                </div>


                {/* ACTIONS */}

                <div className="pharmacy-modal-actions">

                  <button
                    type="button"
                    className="pharmacy-secondary-button"
                    onClick={
                      closePrescription
                    }
                  >
                    Close
                  </button>

                  {selectedPrescription.status ===
                    "ACTIVE" && (
                    <button
                      type="button"
                      className="pharmacy-primary-button"
                      onClick={
                        startDispensing
                      }
                    >
                      <Pill size={17} />

                      Proceed to Dispensing
                    </button>
                  )}

                </div>

              </>

            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default PharmacyWorkspacePage;