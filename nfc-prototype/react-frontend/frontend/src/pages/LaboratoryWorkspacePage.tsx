import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Beaker,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FlaskConical,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Wifi,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_URL = "http://localhost:5000/api/v1";

const DEVELOPMENT_FACILITY_ID =
  "9e268cfd-1e17-47cf-aadb-be42c58ad79f";

const DEVELOPMENT_USER_ID =
  "ac844b2b-cc1b-45a4-9404-e059fdd6df0b";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type LabRequestStatus =
  | "REQUESTED"
  | "SAMPLE_COLLECTED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

type LabResultStatus =
  | "COMPLETED"
  | "VERIFIED"
  | "CANCELLED";

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string;
  phone: string | null;
}

interface LabTest {
  id: string;
  labRequestId: string;
  testName: string;
  testCode: string | null;
  createdAt: string;
}

interface RequestedBy {
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
  completedAt: string | null;
}

interface LabRequest {
  id: string;
  patientId: string;
  encounterId: string;
  requestedById: string;
  status: LabRequestStatus;
  clinicalIndication: string | null;
  notes: string | null;
  requestedAt: string;
  completedAt: string | null;

  patient: Patient;
  tests: LabTest[];

  requestedBy: RequestedBy;

  encounter: Encounter;
}

interface LabResult {
  id: string;
  labRequestId: string;
  performedById: string;

  testName: string;
  resultValue: string;
  unit: string | null;
  referenceRange: string | null;
  interpretation: string | null;

  status: LabResultStatus;

  resultDate: string;
  verifiedAt: string | null;

  createdAt: string;
  updatedAt: string;

  performedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface ResultForm {
  resultValue: string;
  unit: string;
  referenceRange: string;
  interpretation: string;
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
  status: LabRequestStatus
) => {
  switch (status) {
    case "REQUESTED":
      return "Requested";

    case "SAMPLE_COLLECTED":
      return "Sample collected";

    case "PROCESSING":
      return "Processing";

    case "COMPLETED":
      return "Completed";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status;
  }
};

const getStatusClass = (
  status: LabRequestStatus
) => {
  switch (status) {
    case "REQUESTED":
      return "lab-status-requested";

    case "SAMPLE_COLLECTED":
      return "lab-status-collected";

    case "PROCESSING":
      return "lab-status-processing";

    case "COMPLETED":
      return "lab-status-completed";

    case "CANCELLED":
      return "lab-status-cancelled";

    default:
      return "";
  }
};

const getResultStatusLabel = (
  status: LabResultStatus
) => {
  switch (status) {
    case "COMPLETED":
      return "Completed";

    case "VERIFIED":
      return "Verified";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status;
  }
};

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

function LaboratoryWorkspacePage() {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | QUEUE
  |--------------------------------------------------------------------------
  */

  const [requests, setRequests] =
    useState<LabRequest[]>([]);

  const [selectedRequestId, setSelectedRequestId] =
    useState<string | null>(null);

  const [loadingQueue, setLoadingQueue] =
    useState(true);

  const [queueError, setQueueError] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | REQUEST DETAIL
  |--------------------------------------------------------------------------
  */

  const [selectedRequest, setSelectedRequest] =
    useState<LabRequest | null>(null);

  const [loadingRequest, setLoadingRequest] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const [actionMessage, setActionMessage] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | LAB RESULTS
  |--------------------------------------------------------------------------
  */

  const [results, setResults] =
    useState<LabResult[]>([]);

  const [loadingResults, setLoadingResults] =
    useState(false);

  const [resultError, setResultError] =
    useState("");

  const [resultMessage, setResultMessage] =
    useState("");

  const [resultForms, setResultForms] =
    useState<Record<string, ResultForm>>({});

  const [savingResultFor, setSavingResultFor] =
    useState<string | null>(null);

  const [verifyingResultId, setVerifyingResultId] =
    useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | LOAD QUEUE
  |--------------------------------------------------------------------------
  */

  const loadQueue = useCallback(
    async () => {
      setLoadingQueue(true);
      setQueueError("");

      try {
        const response =
          await fetch(
            `${API_URL}/lab-requests?facilityId=${DEVELOPMENT_FACILITY_ID}`
          );

        const result =
          (await response.json()) as ApiResponse<
            LabRequest[]
          >;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Unable to load laboratory queue."
          );
        }

        setRequests(result.data);
      } catch (error) {
        setQueueError(
          error instanceof Error
            ? error.message
            : "Unable to load laboratory queue."
        );
      } finally {
        setLoadingQueue(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  /*
  |--------------------------------------------------------------------------
  | LOAD REQUEST DETAILS
  |--------------------------------------------------------------------------
  */

  const openRequest = async (
    requestId: string
  ) => {
    setSelectedRequestId(requestId);
    setSelectedRequest(null);
    setResults([]);
    setResultForms({});
    setLoadingRequest(true);

    setActionError("");
    setActionMessage("");

    setResultError("");
    setResultMessage("");

    try {
      const response =
        await fetch(
          `${API_URL}/lab-requests/${requestId}`
        );

      const result =
        (await response.json()) as ApiResponse<LabRequest>;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to load laboratory request."
        );
      }

      setSelectedRequest(result.data);

      await loadResults(requestId);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to load laboratory request."
      );
    } finally {
      setLoadingRequest(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD RESULTS
  |--------------------------------------------------------------------------
  */

  const loadResults = async (
    labRequestId: string
  ) => {
    setLoadingResults(true);
    setResultError("");

    try {
      const response =
        await fetch(
          `${API_URL}/lab-requests/${labRequestId}/results`
        );

      const result =
        (await response.json()) as ApiResponse<
          LabResult[]
        >;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to load laboratory results."
        );
      }

      setResults(result.data);

      /*
       * Build forms for tests that do not yet
       * have a result.
       */
      setResultForms((current) => {
        const next = {
          ...current,
        };

        const existingTestNames =
          new Set(
            result.data.map(
              (item) =>
                item.testName.trim().toLowerCase()
            )
          );

        if (selectedRequest) {
          for (const test of selectedRequest.tests) {
            if (
              !existingTestNames.has(
                test.testName
                  .trim()
                  .toLowerCase()
              )
            ) {
              next[test.id] =
                next[test.id] || {
                  resultValue: "",
                  unit: "",
                  referenceRange: "",
                  interpretation: "",
                };
            }
          }
        }

        return next;
      });
    } catch (error) {
      setResultError(
        error instanceof Error
          ? error.message
          : "Unable to load laboratory results."
      );
    } finally {
      setLoadingResults(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE RESULT FORM
  |--------------------------------------------------------------------------
  */

  const updateResultForm = (
    testId: string,
    field: keyof ResultForm,
    value: string
  ) => {
    setResultForms((current) => ({
      ...current,
      [testId]: {
        ...(current[testId] || {
          resultValue: "",
          unit: "",
          referenceRange: "",
          interpretation: "",
        }),
        [field]: value,
      },
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE RESULT
  |--------------------------------------------------------------------------
  */

  const saveResult = async (
    test: LabTest
  ) => {
    if (!selectedRequest) {
      return;
    }

    const form =
      resultForms[test.id];

    if (!form?.resultValue.trim()) {
      setResultError(
        `Enter a result value for ${test.testName}.`
      );

      return;
    }

    setSavingResultFor(test.id);
    setResultError("");
    setResultMessage("");

    try {
      const response =
        await fetch(
          `${API_URL}/lab-requests/${selectedRequest.id}/results`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              performedById:
                DEVELOPMENT_USER_ID,

              testName: test.testName,

              resultValue:
                form.resultValue.trim(),

              unit:
                form.unit.trim() || null,

              referenceRange:
                form.referenceRange.trim() ||
                null,

              interpretation:
                form.interpretation.trim() ||
                null,
            }),
          }
        );

      const result =
        (await response.json()) as ApiResponse<LabResult>;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to save laboratory result."
        );
      }

      setResults((current) => {
        const withoutExisting =
          current.filter(
            (item) =>
              item.id !== result.data.id
          );

        return [
          result.data,
          ...withoutExisting,
        ];
      });

      setResultMessage(
        `${test.testName} result saved successfully.`
      );

      /*
       * Clear the form after successful save.
       */
      setResultForms((current) => ({
        ...current,
        [test.id]: {
          resultValue: "",
          unit: "",
          referenceRange: "",
          interpretation: "",
        },
      }));
    } catch (error) {
      setResultError(
        error instanceof Error
          ? error.message
          : "Unable to save laboratory result."
      );
    } finally {
      setSavingResultFor(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | VERIFY RESULT
  |--------------------------------------------------------------------------
  */

  const verifyResult = async (
    resultId: string
  ) => {
    setVerifyingResultId(resultId);
    setResultError("");
    setResultMessage("");

    try {
      const response =
        await fetch(
          `${API_URL}/lab-results/${resultId}/verify`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              verifiedById:
                DEVELOPMENT_USER_ID,
            }),
          }
        );

      const result =
        (await response.json()) as ApiResponse<LabResult>;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to verify laboratory result."
        );
      }

      setResults((current) =>
        current.map((item) =>
          item.id === result.data.id
            ? result.data
            : item
        )
      );

      setResultMessage(
        `${result.data.testName} has been verified successfully.`
      );
    } catch (error) {
      setResultError(
        error instanceof Error
          ? error.message
          : "Unable to verify laboratory result."
      );
    } finally {
      setVerifyingResultId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE REQUEST STATUS
  |--------------------------------------------------------------------------
  */

  const updateStatus = async (
    status:
      | "SAMPLE_COLLECTED"
      | "PROCESSING"
      | "COMPLETED"
  ) => {
    if (!selectedRequest) {
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionMessage("");

    try {
      const response =
        await fetch(
          `${API_URL}/lab-requests/${selectedRequest.id}/status`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status,
            }),
          }
        );

      const result =
        (await response.json()) as ApiResponse<LabRequest>;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to update laboratory request."
        );
      }

      setSelectedRequest(result.data);

      setRequests((current) =>
        current.map((request) =>
          request.id === result.data.id
            ? result.data
            : request
        )
      );

      setActionMessage(
        status === "SAMPLE_COLLECTED"
          ? "Sample collection recorded successfully."
          : status === "PROCESSING"
          ? "Laboratory request moved to processing."
          : "Laboratory request completed successfully."
      );

      if (status === "COMPLETED") {
        await loadQueue();
      }
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update laboratory request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */

  const filteredRequests =
    requests.filter((request) => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      if (!search) {
        return true;
      }

      const patientName =
        `${request.patient.firstName} ${request.patient.lastName}`
          .toLowerCase();

      const patientNumber =
        request.patient.patientNumber.toLowerCase();

      const testNames =
        request.tests
          .map((test) =>
            test.testName.toLowerCase()
          )
          .join(" ");

      return (
        patientName.includes(search) ||
        patientNumber.includes(search) ||
        testNames.includes(search)
      );
    });

  /*
  |--------------------------------------------------------------------------
  | CLOSE DETAIL
  |--------------------------------------------------------------------------
  */

  const closeRequest = () => {
    setSelectedRequestId(null);
    setSelectedRequest(null);

    setResults([]);
    setResultForms({});

    setActionError("");
    setActionMessage("");

    setResultError("");
    setResultMessage("");
  };

  /*
  |--------------------------------------------------------------------------
  | RESULT HELPERS
  |--------------------------------------------------------------------------
  */

  const getResultForTest = (
    testName: string
  ) => {
    return results.find(
      (result) =>
        result.testName.trim().toLowerCase() ===
        testName.trim().toLowerCase()
    );
  };

  const allTestsHaveResults =
    selectedRequest
      ? selectedRequest.tests.length > 0 &&
        selectedRequest.tests.every(
          (test) =>
            Boolean(
              getResultForTest(test.testName)
            )
        )
      : false;

  const allResultsVerified =
    selectedRequest
      ? selectedRequest.tests.length > 0 &&
        selectedRequest.tests.every(
          (test) => {
            const result =
              getResultForTest(
                test.testName
              );

            return (
              result?.status ===
              "VERIFIED"
            );
          }
        )
      : false;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="laboratory-workspace-page">

      {/* =====================================================
          TOP BAR
      ====================================================== */}

      <header className="laboratory-topbar">

        <div className="laboratory-brand">

          <div className="laboratory-brand-icon">
            <Activity size={20} />
          </div>

          <div>
            <strong>
              Med<span>Card</span>
            </strong>

            <small>
              Digital Health Platform
            </small>
          </div>

        </div>


        <div className="laboratory-topbar-center">

          <div className="laboratory-role-icon">
            <FlaskConical size={18} />
          </div>

          <div>
            <strong>
              Laboratory Workspace
            </strong>

            <small>
              Clinical diagnostics
            </small>
          </div>

        </div>


        <div className="laboratory-topbar-actions">

          <div className="laboratory-live-status">
            <span />
            System operational
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
          >
            <LogOut size={16} />
            Sign out
          </button>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="laboratory-workspace-main">

        {/* BREADCRUMB */}

        <div className="laboratory-breadcrumb">

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
            Laboratory
          </strong>

        </div>


        {/* =================================================
            PAGE HEADER
        ================================================== */}

        <section className="laboratory-page-header">

          <div>

            <span className="laboratory-eyebrow">
              DIAGNOSTIC SERVICES
            </span>

            <h1>
              Laboratory Queue
            </h1>

            <p>
              Review laboratory requests,
              collect specimens, process
              investigations, and record
              verified results.
            </p>

          </div>


          <button
            type="button"
            className="laboratory-refresh-button"
            onClick={() => {
              void loadQueue();
            }}
            disabled={loadingQueue}
          >
            {loadingQueue ? (
              <LoaderCircle
                size={17}
                className="spin"
              />
            ) : (
              <RefreshCw size={17} />
            )}

            Refresh queue
          </button>

        </section>


        {/* =================================================
            SUMMARY
        ================================================== */}

        <section className="laboratory-summary-grid">

          <div className="laboratory-summary-card">

            <div className="laboratory-summary-icon blue">
              <ClipboardList size={20} />
            </div>

            <div>
              <span>
                Active requests
              </span>

              <strong>
                {requests.length}
              </strong>
            </div>

          </div>


          <div className="laboratory-summary-card">

            <div className="laboratory-summary-icon amber">
              <Clock3 size={20} />
            </div>

            <div>
              <span>
                Awaiting collection
              </span>

              <strong>
                {
                  requests.filter(
                    (request) =>
                      request.status ===
                      "REQUESTED"
                  ).length
                }
              </strong>
            </div>

          </div>


          <div className="laboratory-summary-card">

            <div className="laboratory-summary-icon green">
              <Beaker size={20} />
            </div>

            <div>
              <span>
                In processing
              </span>

              <strong>
                {
                  requests.filter(
                    (request) =>
                      request.status ===
                      "PROCESSING"
                  ).length
                }
              </strong>
            </div>

          </div>

        </section>


        {/* =================================================
            CONTENT GRID
        ================================================== */}

        <section className="laboratory-content-grid">


          {/* =================================================
              QUEUE
          ================================================== */}

          <div className="laboratory-queue-panel">

            <div className="laboratory-panel-header">

              <div>

                <span>
                  WORK QUEUE
                </span>

                <h2>
                  Pending laboratory requests
                </h2>

              </div>

              <span className="laboratory-count-badge">
                {filteredRequests.length}
              </span>

            </div>


            {/* SEARCH */}

            <div className="laboratory-search">

              <Search size={17} />

              <input
                type="text"
                placeholder="Search patient or test..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

            </div>


            {/* ERROR */}

            {queueError && (
              <div className="laboratory-inline-error">

                <strong>
                  Unable to load queue
                </strong>

                <span>
                  {queueError}
                </span>

              </div>
            )}


            {/* LOADING */}

            {loadingQueue && (
              <div className="laboratory-empty-state">

                <LoaderCircle
                  size={28}
                  className="spin"
                />

                <strong>
                  Loading laboratory queue
                </strong>

                <p>
                  Retrieving active requests
                  for this facility.
                </p>

              </div>
            )}


            {/* EMPTY */}

            {!loadingQueue &&
              !queueError &&
              filteredRequests.length === 0 && (
                <div className="laboratory-empty-state">

                  <div className="laboratory-empty-icon">
                    <CheckCircle2 size={26} />
                  </div>

                  <strong>
                    Laboratory queue is clear
                  </strong>

                  <p>
                    There are no active
                    laboratory requests waiting
                    for attention.
                  </p>

                </div>
              )}


            {/* REQUESTS */}

            {!loadingQueue &&
              filteredRequests.length > 0 && (
                <div className="laboratory-request-list">

                  {filteredRequests.map(
                    (request) => {

                      const selected =
                        selectedRequestId ===
                        request.id;

                      return (
                        <button
                          key={request.id}
                          type="button"
                          className={`laboratory-request-card ${
                            selected
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            void openRequest(
                              request.id
                            )
                          }
                        >

                          <div className="laboratory-request-avatar">
                            {getInitials(
                              request.patient
                                .firstName,
                              request.patient
                                .lastName
                            )}
                          </div>


                          <div className="laboratory-request-main">

                            <div className="laboratory-request-name-row">

                              <strong>
                                {
                                  request.patient
                                    .firstName
                                }{" "}
                                {
                                  request.patient
                                    .lastName
                                }
                              </strong>

                              <span
                                className={`laboratory-status-badge ${getStatusClass(
                                  request.status
                                )}`}
                              >
                                {getStatusLabel(
                                  request.status
                                )}
                              </span>

                            </div>


                            <span className="laboratory-patient-number">
                              {
                                request.patient
                                  .patientNumber
                              }
                            </span>


                            <div className="laboratory-test-preview">

                              {request.tests
                                .slice(0, 2)
                                .map(
                                  (test) => (
                                    <span
                                      key={
                                        test.id
                                      }
                                    >
                                      <FlaskConical
                                        size={13}
                                      />

                                      {
                                        test.testName
                                      }
                                    </span>
                                  )
                                )}

                              {request.tests.length >
                                2 && (
                                <span>
                                  +
                                  {request.tests.length -
                                    2}{" "}
                                  more
                                </span>
                              )}

                            </div>


                            <small>
                              Requested{" "}
                              {formatDateTime(
                                request.requestedAt
                              )}
                            </small>

                          </div>


                          <div className="laboratory-request-arrow">
                            →
                          </div>

                        </button>
                      );
                    }
                  )}

                </div>
              )}

          </div>


          {/* =================================================
              DETAIL
          ================================================== */}

          <div className="laboratory-detail-panel">

            {!selectedRequestId && (
              <div className="laboratory-detail-empty">

                <div className="laboratory-detail-empty-icon">
                  <FlaskConical size={30} />
                </div>

                <h2>
                  Select a laboratory request
                </h2>

                <p>
                  Choose a request from the queue
                  to review the patient, requested
                  tests, clinical indication, and
                  workflow status.
                </p>

              </div>
            )}


            {selectedRequestId &&
              loadingRequest && (
                <div className="laboratory-detail-empty">

                  <LoaderCircle
                    size={30}
                    className="spin"
                  />

                  <h2>
                    Loading request
                  </h2>

                  <p>
                    Retrieving laboratory request
                    details.
                  </p>

                </div>
              )}


            {selectedRequest &&
              !loadingRequest && (
                <div className="laboratory-detail-content">

                  {/* DETAIL HEADER */}

                  <div className="laboratory-detail-header">

                    <button
                      type="button"
                      className="laboratory-back-button"
                      onClick={
                        closeRequest
                      }
                    >
                      <ArrowLeft
                        size={16}
                      />

                      Back to queue
                    </button>


                    <div className="laboratory-detail-title">

                      <div className="laboratory-detail-avatar">
                        {getInitials(
                          selectedRequest
                            .patient.firstName,
                          selectedRequest
                            .patient.lastName
                        )}
                      </div>

                      <div>

                        <span>
                          LABORATORY REQUEST
                        </span>

                        <h2>
                          {
                            selectedRequest
                              .patient
                              .firstName
                          }{" "}
                          {
                            selectedRequest
                              .patient
                              .lastName
                          }
                        </h2>

                        <p>
                          {
                            selectedRequest
                              .patient
                              .patientNumber
                          }
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* STATUS */}

                  <div className="laboratory-detail-status-row">

                    <div>

                      <span>
                        REQUEST STATUS
                      </span>

                      <strong
                        className={`laboratory-large-status ${getStatusClass(
                          selectedRequest.status
                        )}`}
                      >
                        {getStatusLabel(
                          selectedRequest.status
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        REQUESTED
                      </span>

                      <strong>
                        {formatDateTime(
                          selectedRequest.requestedAt
                        )}
                      </strong>

                    </div>

                  </div>


                  {/* PATIENT */}

                  <section className="laboratory-detail-section">

                    <div className="laboratory-section-heading">

                      <div className="laboratory-section-icon">
                        <UserRound size={17} />
                      </div>

                      <div>
                        <span>
                          PATIENT
                        </span>

                        <h3>
                          Patient information
                        </h3>
                      </div>

                    </div>


                    <div className="laboratory-patient-grid">

                      <div>
                        <span>
                          Patient number
                        </span>

                        <strong>
                          {
                            selectedRequest
                              .patient
                              .patientNumber
                          }
                        </strong>
                      </div>


                      <div>
                        <span>
                          Gender
                        </span>

                        <strong>
                          {
                            selectedRequest
                              .patient
                              .gender ||
                            "Not provided"
                          }
                        </strong>
                      </div>


                      <div>
                        <span>
                          Phone
                        </span>

                        <strong>
                          {
                            selectedRequest
                              .patient
                              .phone ||
                            "Not provided"
                          }
                        </strong>
                      </div>

                    </div>

                  </section>


                  {/* REQUESTED TESTS */}

                  <section className="laboratory-detail-section">

                    <div className="laboratory-section-heading">

                      <div className="laboratory-section-icon">
                        <FlaskConical
                          size={17}
                        />
                      </div>

                      <div>
                        <span>
                          INVESTIGATIONS
                        </span>

                        <h3>
                          Requested tests
                        </h3>
                      </div>

                    </div>


                    <div className="laboratory-tests-list">

                      {selectedRequest.tests.map(
                        (test) => {

                          const existingResult =
                            getResultForTest(
                              test.testName
                            );

                          return (
                            <div
                              className="laboratory-test-row"
                              key={test.id}
                            >

                              <div className="laboratory-test-icon">
                                <Beaker
                                  size={16}
                                />
                              </div>

                              <div>

                                <strong>
                                  {
                                    test.testName
                                  }
                                </strong>

                                {test.testCode && (
                                  <span>
                                    Code:{" "}
                                    {
                                      test.testCode
                                    }
                                  </span>
                                )}

                              </div>

                              <div>
                                {existingResult ? (
                                  <span>
                                    ✓ Result entered
                                  </span>
                                ) : (
                                  <span>
                                    Awaiting result
                                  </span>
                                )}
                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </section>


                  {/* CLINICAL INFORMATION */}

                  <section className="laboratory-detail-section">

                    <div className="laboratory-section-heading">

                      <div className="laboratory-section-icon">
                        <ClipboardList
                          size={17}
                        />
                      </div>

                      <div>
                        <span>
                          CLINICAL CONTEXT
                        </span>

                        <h3>
                          Request information
                        </h3>
                      </div>

                    </div>


                    <div className="laboratory-context-card">

                      <div>
                        <span>
                          Clinical indication
                        </span>

                        <p>
                          {
                            selectedRequest
                              .clinicalIndication ||
                            "No clinical indication provided."
                          }
                        </p>
                      </div>


                      <div>
                        <span>
                          Additional notes
                        </span>

                        <p>
                          {
                            selectedRequest
                              .notes ||
                            "No additional notes."
                          }
                        </p>
                      </div>


                      <div>
                        <span>
                          Requested by
                        </span>

                        <p>
                          Dr.{" "}
                          {
                            selectedRequest
                              .requestedBy
                              .firstName
                          }{" "}
                          {
                            selectedRequest
                              .requestedBy
                              .lastName
                          }
                        </p>
                      </div>

                    </div>

                  </section>


                  {/* =================================================
                      LABORATORY RESULTS
                  ================================================== */}

                  <section className="laboratory-detail-section">

                    <div className="laboratory-section-heading">

                      <div className="laboratory-section-icon">
                        <FlaskConical
                          size={17}
                        />
                      </div>

                      <div>
                        <span>
                          RESULTS
                        </span>

                        <h3>
                          Laboratory results
                        </h3>
                      </div>

                    </div>


                    {/* RESULT ERROR */}

                    {resultError && (
                      <div className="laboratory-action-error">

                        <strong>
                          Result action failed
                        </strong>

                        <span>
                          {resultError}
                        </span>

                      </div>
                    )}


                    {/* RESULT SUCCESS */}

                    {resultMessage && (
                      <div className="laboratory-action-success">

                        <CheckCircle2
                          size={18}
                        />

                        <span>
                          {resultMessage}
                        </span>

                      </div>
                    )}


                    {/* LOADING RESULTS */}

                    {loadingResults && (
                      <div className="laboratory-empty-state">

                        <LoaderCircle
                          size={25}
                          className="spin"
                        />

                        <strong>
                          Loading laboratory results
                        </strong>

                        <p>
                          Checking existing results
                          for this request.
                        </p>

                      </div>
                    )}


                    {!loadingResults && (
                      <div>

                        {/* EXISTING RESULTS */}

                        {results.length > 0 && (
                          <div
                            style={{
                              display: "grid",
                              gap: "12px",
                              marginBottom:
                                "20px",
                            }}
                          >

                            {results.map(
                              (result) => (
                                <div
                                  key={result.id}
                                  style={{
                                    border:
                                      "1px solid #e2e8f0",
                                    borderRadius:
                                      "14px",
                                    padding:
                                      "18px",
                                    background:
                                      "#ffffff",
                                  }}
                                >

                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      justifyContent:
                                        "space-between",
                                      gap: "16px",
                                      alignItems:
                                        "flex-start",
                                    }}
                                  >

                                    <div>
                                      <strong
                                        style={{
                                          display:
                                            "block",
                                          fontSize:
                                            "15px",
                                        }}
                                      >
                                        {
                                          result.testName
                                        }
                                      </strong>

                                      <small>
                                        Result recorded{" "}
                                        {formatDateTime(
                                          result.resultDate
                                        )}
                                      </small>
                                    </div>

                                    <span
                                      style={{
                                        display:
                                          "inline-flex",
                                        alignItems:
                                          "center",
                                        gap: "6px",
                                        fontSize:
                                          "12px",
                                        fontWeight:
                                          700,
                                      }}
                                    >
                                      {result.status ===
                                      "VERIFIED" ? (
                                        <ShieldCheck
                                          size={15}
                                        />
                                      ) : (
                                        <Clock3
                                          size={15}
                                        />
                                      )}

                                      {getResultStatusLabel(
                                        result.status
                                      )}
                                    </span>

                                  </div>


                                  <div
                                    style={{
                                      display:
                                        "grid",
                                      gridTemplateColumns:
                                        "repeat(auto-fit, minmax(130px, 1fr))",
                                      gap: "12px",
                                      marginTop:
                                        "16px",
                                    }}
                                  >

                                    <div>
                                      <small>
                                        Result
                                      </small>

                                      <strong
                                        style={{
                                          display:
                                            "block",
                                          marginTop:
                                            "4px",
                                          fontSize:
                                            "18px",
                                        }}
                                      >
                                        {
                                          result.resultValue
                                        }{" "}
                                        {
                                          result.unit ||
                                          ""
                                        }
                                      </strong>
                                    </div>


                                    <div>
                                      <small>
                                        Reference range
                                      </small>

                                      <strong
                                        style={{
                                          display:
                                            "block",
                                          marginTop:
                                            "4px",
                                        }}
                                      >
                                        {
                                          result.referenceRange ||
                                          "Not provided"
                                        }
                                      </strong>
                                    </div>


                                    <div>
                                      <small>
                                        Interpretation
                                      </small>

                                      <strong
                                        style={{
                                          display:
                                            "block",
                                          marginTop:
                                            "4px",
                                        }}
                                      >
                                        {
                                          result.interpretation ||
                                          "Not provided"
                                        }
                                      </strong>
                                    </div>

                                  </div>


                                  {result.status ===
                                    "COMPLETED" && (
                                    <button
                                      type="button"
                                      className="laboratory-primary-action"
                                      style={{
                                        marginTop:
                                          "16px",
                                      }}
                                      disabled={
                                        verifyingResultId ===
                                        result.id
                                      }
                                      onClick={() =>
                                        void verifyResult(
                                          result.id
                                        )
                                      }
                                    >

                                      {verifyingResultId ===
                                      result.id ? (
                                        <LoaderCircle
                                          size={17}
                                          className="spin"
                                        />
                                      ) : (
                                        <ShieldCheck
                                          size={17}
                                        />
                                      )}

                                      Verify result

                                    </button>
                                  )}


                                  {result.status ===
                                    "VERIFIED" && (
                                    <div
                                      style={{
                                        marginTop:
                                          "14px",
                                        display:
                                          "flex",
                                        alignItems:
                                          "center",
                                        gap: "7px",
                                        fontSize:
                                          "13px",
                                        fontWeight:
                                          600,
                                      }}
                                    >
                                      <CheckCircle2
                                        size={16}
                                      />

                                      Verified{" "}
                                      {formatDateTime(
                                        result.verifiedAt
                                      )}
                                    </div>
                                  )}

                                </div>
                              )
                            )}

                          </div>
                        )}


                        {/* RESULT ENTRY */}

                        {selectedRequest.status ===
                          "PROCESSING" &&
                          selectedRequest.tests.some(
                            (test) =>
                              !getResultForTest(
                                test.testName
                              )
                          ) && (

                          <div>

                            <div
                              style={{
                                marginBottom:
                                  "14px",
                              }}
                            >
                              <strong>
                                Enter laboratory results
                              </strong>

                              <p
                                style={{
                                  margin:
                                    "5px 0 0",
                                  fontSize:
                                    "13px",
                                  opacity:
                                    0.7,
                                }}
                              >
                                Record each requested
                                investigation before
                                verification.
                              </p>
                            </div>


                            <div
                              style={{
                                display:
                                  "grid",
                                gap: "16px",
                              }}
                            >

                              {selectedRequest.tests
                                .filter(
                                  (test) =>
                                    !getResultForTest(
                                      test.testName
                                    )
                                )
                                .map(
                                  (test) => {

                                    const form =
                                      resultForms[
                                        test.id
                                      ] || {
                                        resultValue:
                                          "",
                                        unit: "",
                                        referenceRange:
                                          "",
                                        interpretation:
                                          "",
                                      };

                                    return (
                                      <div
                                        key={
                                          test.id
                                        }
                                        style={{
                                          border:
                                            "1px solid #e2e8f0",
                                          borderRadius:
                                            "14px",
                                          padding:
                                            "18px",
                                        }}
                                      >

                                        <div
                                          style={{
                                            display:
                                              "flex",
                                            alignItems:
                                              "center",
                                            gap:
                                              "10px",
                                            marginBottom:
                                              "16px",
                                          }}
                                        >

                                          <div className="laboratory-test-icon">
                                            <Beaker
                                              size={
                                                16
                                              }
                                            />
                                          </div>

                                          <div>
                                            <strong>
                                              {
                                                test.testName
                                              }
                                            </strong>

                                            {test.testCode && (
                                              <small
                                                style={{
                                                  display:
                                                    "block",
                                                }}
                                              >
                                                Code:{" "}
                                                {
                                                  test.testCode
                                                }
                                              </small>
                                            )}
                                          </div>

                                        </div>


                                        <div
                                          style={{
                                            display:
                                              "grid",
                                            gridTemplateColumns:
                                              "repeat(auto-fit, minmax(160px, 1fr))",
                                            gap:
                                              "12px",
                                          }}
                                        >

                                          <label>
                                            <span>
                                              Result value
                                            </span>

                                            <input
                                              type="text"
                                              value={
                                                form.resultValue
                                              }
                                              onChange={(
                                                event
                                              ) =>
                                                updateResultForm(
                                                  test.id,
                                                  "resultValue",
                                                  event
                                                    .target
                                                    .value
                                                )
                                              }
                                              placeholder="e.g. 8.4"
                                            />
                                          </label>


                                          <label>
                                            <span>
                                              Unit
                                            </span>

                                            <input
                                              type="text"
                                              value={
                                                form.unit
                                              }
                                              onChange={(
                                                event
                                              ) =>
                                                updateResultForm(
                                                  test.id,
                                                  "unit",
                                                  event
                                                    .target
                                                    .value
                                                )
                                              }
                                              placeholder="e.g. mg/L"
                                            />
                                          </label>


                                          <label>
                                            <span>
                                              Reference range
                                            </span>

                                            <input
                                              type="text"
                                              value={
                                                form.referenceRange
                                              }
                                              onChange={(
                                                event
                                              ) =>
                                                updateResultForm(
                                                  test.id,
                                                  "referenceRange",
                                                  event
                                                    .target
                                                    .value
                                                )
                                              }
                                              placeholder="e.g. 4.0 - 11.0"
                                            />
                                          </label>

                                        </div>


                                        <label
                                          style={{
                                            display:
                                              "block",
                                            marginTop:
                                              "12px",
                                          }}
                                        >
                                          <span>
                                            Interpretation
                                          </span>

                                          <textarea
                                            value={
                                              form.interpretation
                                            }
                                            onChange={(
                                              event
                                            ) =>
                                              updateResultForm(
                                                test.id,
                                                "interpretation",
                                                event
                                                  .target
                                                  .value
                                              )
                                            }
                                            placeholder="Enter clinical interpretation..."
                                            rows={3}
                                          />
                                        </label>


                                        <button
                                          type="button"
                                          className="laboratory-primary-action"
                                          style={{
                                            marginTop:
                                              "14px",
                                          }}
                                          disabled={
                                            savingResultFor ===
                                            test.id
                                          }
                                          onClick={() =>
                                            void saveResult(
                                              test
                                            )
                                          }
                                        >

                                          {savingResultFor ===
                                          test.id ? (
                                            <LoaderCircle
                                              size={
                                                17
                                              }
                                              className="spin"
                                            />
                                          ) : (
                                            <CheckCircle2
                                              size={
                                                17
                                              }
                                            />
                                          )}

                                          Save result

                                        </button>

                                      </div>
                                    );
                                  }
                                )}

                            </div>

                          </div>
                        )}


                        {/* NO RESULTS */}

                        {results.length === 0 &&
                          selectedRequest.status !==
                            "PROCESSING" && (
                            <div
                              className="laboratory-empty-state"
                            >

                              <div className="laboratory-empty-icon">
                                <FlaskConical
                                  size={25}
                                />
                              </div>

                              <strong>
                                No laboratory results yet
                              </strong>

                              <p>
                                Results can be entered
                                once this request is
                                in processing.
                              </p>

                            </div>
                          )}

                      </div>
                    )}

                  </section>


                  {/* ACTION ERROR */}

                  {actionError && (
                    <div className="laboratory-action-error">

                      <strong>
                        Action failed
                      </strong>

                      <span>
                        {actionError}
                      </span>

                    </div>
                  )}


                  {/* ACTION SUCCESS */}

                  {actionMessage && (
                    <div className="laboratory-action-success">

                      <CheckCircle2
                        size={18}
                      />

                      <span>
                        {actionMessage}
                      </span>

                    </div>
                  )}


                  {/* =================================================
                      WORKFLOW ACTION
                  ================================================== */}

                  <section className="laboratory-workflow-card">

                    <div>

                      <span>
                        NEXT WORKFLOW STEP
                      </span>

                      <h3>
                        {selectedRequest.status ===
                        "REQUESTED"
                          ? "Collect specimen"
                          : selectedRequest.status ===
                            "SAMPLE_COLLECTED"
                          ? "Begin processing"
                          : selectedRequest.status ===
                            "PROCESSING"
                          ? allTestsHaveResults
                            ? "Complete laboratory request"
                            : "Laboratory processing in progress"
                          : "Request completed"}
                      </h3>

                      <p>
                        {selectedRequest.status ===
                        "REQUESTED"
                          ? "Confirm that the required specimen has been collected from the patient."
                          : selectedRequest.status ===
                            "SAMPLE_COLLECTED"
                          ? "Move the specimen into laboratory processing."
                          : selectedRequest.status ===
                            "PROCESSING"
                          ? allTestsHaveResults
                            ? allResultsVerified
                              ? "All requested results have been verified. The laboratory request can now be completed."
                              : "All requested results have been entered. Verify each result before completing the request."
                            : "Results will be entered during laboratory processing."
                          : "No further action is required here."}
                      </p>

                    </div>


                    {selectedRequest.status ===
                      "REQUESTED" && (
                      <button
                        type="button"
                        className="laboratory-primary-action"
                        disabled={
                          actionLoading
                        }
                        onClick={() =>
                          void updateStatus(
                            "SAMPLE_COLLECTED"
                          )
                        }
                      >

                        {actionLoading ? (
                          <LoaderCircle
                            size={17}
                            className="spin"
                          />
                        ) : (
                          <CheckCircle2
                            size={17}
                          />
                        )}

                        Collect sample

                      </button>
                    )}


                    {selectedRequest.status ===
                      "SAMPLE_COLLECTED" && (
                      <button
                        type="button"
                        className="laboratory-primary-action"
                        disabled={
                          actionLoading
                        }
                        onClick={() =>
                          void updateStatus(
                            "PROCESSING"
                          )
                        }
                      >

                        {actionLoading ? (
                          <LoaderCircle
                            size={17}
                            className="spin"
                          />
                        ) : (
                          <Beaker
                            size={17}
                          />
                        )}

                        Start processing

                      </button>
                    )}


                    {selectedRequest.status ===
                      "PROCESSING" &&
                      allTestsHaveResults &&
                      allResultsVerified && (
                        <button
                          type="button"
                          className="laboratory-primary-action"
                          disabled={
                            actionLoading
                          }
                          onClick={() =>
                            void updateStatus(
                              "COMPLETED"
                            )
                          }
                        >

                          {actionLoading ? (
                            <LoaderCircle
                              size={17}
                              className="spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={17}
                            />
                          )}

                          Complete request

                        </button>
                      )}

                  </section>


                  {/* SYSTEM FOOTER */}

                  <div className="laboratory-system-footer">

                    <div>

                      <Wifi size={17} />

                      <div>

                        <strong>
                          MedCard clinical workflow
                        </strong>

                        <span>
                          This request is linked to
                          the patient's active
                          encounter.
                        </span>

                      </div>

                    </div>

                    <span>
                      Request ID:{" "}
                      {selectedRequest.id}
                    </span>

                  </div>

                </div>
              )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default LaboratoryWorkspacePage;