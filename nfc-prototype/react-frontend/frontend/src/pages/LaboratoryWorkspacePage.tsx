import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  FlaskConical,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Plus,
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

// Configuration files

const API_URL = "http://localhost:5000/api/v1";
const FACILITY_ID = "9e268cfd-1e17-47cf-aadb-be42c58ad79f";
const DEFAULT_USER_ID = "ac844b2b-cc1b-45a4-9404-e059fdd6df0b";

type LabRequestStatus =
  | "REQUESTED"
  | "SAMPLE_COLLECTED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

type LabResultStatus = "COMPLETED" | "VERIFIED" | "CANCELLED";

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string;
  phone?: string | null;
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

// Sample mock data for demo reliability

const MOCK_LAB_REQUESTS: LabRequest[] = [
  {
    id: "req-lab-001",
    patientId: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
    encounterId: "enc-001",
    requestedById: "doc-001",
    status: "PROCESSING",
    clinicalIndication: "Post-operative inflammatory markers & infection screen",
    notes: "Patient underwent arthroscopy 12 days ago. Check CRP and ESR.",
    requestedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    completedAt: null,
    patient: {
      id: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
      patientNumber: "MC-2026-0811",
      firstName: "Alice",
      lastName: "Mutoni",
      gender: "Female",
      phone: "+250 788 123 456",
    },
    tests: [
      { id: "test-1", labRequestId: "req-lab-001", testName: "Complete Blood Count (CBC)", testCode: "CBC-DIFF", createdAt: "" },
      { id: "test-2", labRequestId: "req-lab-001", testName: "C-Reactive Protein (CRP)", testCode: "CRP-QUANT", createdAt: "" },
      { id: "test-3", labRequestId: "req-lab-001", testName: "Erythrocyte Sedimentation Rate", testCode: "ESR", createdAt: "" },
    ],
    requestedBy: {
      id: "doc-001",
      firstName: "Solange",
      lastName: "Uwera",
      role: "Consultant Physician",
    },
    encounter: {
      id: "enc-001",
      patientId: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
      facilityId: FACILITY_ID,
      status: "IN_PROGRESS",
      startedAt: new Date().toISOString(),
      completedAt: null,
    },
  },
  {
    id: "req-lab-002",
    patientId: "patient-003",
    encounterId: "enc-002",
    requestedById: "doc-001",
    status: "REQUESTED",
    clinicalIndication: "Acute febrile illness investigation with chills",
    notes: "Urgent smear requested to rule out Plasmodium falciparum.",
    requestedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    completedAt: null,
    patient: {
      id: "patient-003",
      patientNumber: "MC-2026-1108",
      firstName: "Keza",
      lastName: "Uwase",
      gender: "Female",
      phone: "+250 783 777 888",
    },
    tests: [
      { id: "test-4", labRequestId: "req-lab-002", testName: "Malaria Blood Smear & RDT", testCode: "MAL-SMR", createdAt: "" },
      { id: "test-5", labRequestId: "req-lab-002", testName: "Full Blood Count", testCode: "FBC", createdAt: "" },
    ],
    requestedBy: {
      id: "doc-001",
      firstName: "Solange",
      lastName: "Uwera",
      role: "Consultant Physician",
    },
    encounter: {
      id: "enc-002",
      patientId: "patient-003",
      facilityId: FACILITY_ID,
      status: "IN_PROGRESS",
      startedAt: new Date().toISOString(),
      completedAt: null,
    },
  },
  {
    id: "req-lab-003",
    patientId: "patient-002",
    encounterId: "enc-003",
    requestedById: "doc-002",
    status: "COMPLETED",
    clinicalIndication: "Hypertension baseline renal & lipid panel",
    notes: "Prior to starting Telmisartan dosage titration.",
    requestedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    patient: {
      id: "patient-002",
      patientNumber: "MC-2026-0492",
      firstName: "Jean",
      lastName: "Rukundo",
      gender: "Male",
      phone: "+250 788 456 789",
    },
    tests: [
      { id: "test-6", labRequestId: "req-lab-003", testName: "Serum Creatinine & eGFR", testCode: "CREAT", createdAt: "" },
      { id: "test-7", labRequestId: "req-lab-003", testName: "Lipid Profile Panel", testCode: "LIPID", createdAt: "" },
    ],
    requestedBy: {
      id: "doc-002",
      firstName: "Jean-Paul",
      lastName: "Kagame",
      role: "Cardiologist",
    },
    encounter: {
      id: "enc-003",
      patientId: "patient-002",
      facilityId: FACILITY_ID,
      status: "IN_PROGRESS",
      startedAt: new Date().toISOString(),
      completedAt: null,
    },
  },
];

const MOCK_RESULTS: Record<string, LabResult[]> = {
  "req-lab-001": [
    {
      id: "res-001",
      labRequestId: "req-lab-001",
      performedById: DEFAULT_USER_ID,
      testName: "Complete Blood Count (CBC)",
      resultValue: "Hemoglobin 13.6 g/dL, WBC 6.8 x 10^9/L, Platelets 248 x 10^9/L",
      unit: "Standard Clinical",
      referenceRange: "Hgb: 12.0-15.5 g/dL, WBC: 4.5-11.0",
      interpretation: "Within normal limits. No leukocytosis observed.",
      status: "VERIFIED",
      resultDate: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      performedBy: {
        id: DEFAULT_USER_ID,
        firstName: "Eric",
        lastName: "Gasasira",
        role: "Medical Laboratory Technologist",
      },
    },
  ],
  "req-lab-003": [
    {
      id: "res-002",
      labRequestId: "req-lab-003",
      performedById: DEFAULT_USER_ID,
      testName: "Serum Creatinine & eGFR",
      resultValue: "0.92 mg/dL (eGFR: >90 mL/min/1.73m²)",
      unit: "mg/dL",
      referenceRange: "0.70 - 1.30 mg/dL",
      interpretation: "Normal kidney function.",
      status: "VERIFIED",
      resultDate: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "res-003",
      labRequestId: "req-lab-003",
      performedById: DEFAULT_USER_ID,
      testName: "Lipid Profile Panel",
      resultValue: "Total Chol: 188 mg/dL, LDL: 110 mg/dL, HDL: 48 mg/dL, Trig: 142 mg/dL",
      unit: "mg/dL",
      referenceRange: "Total < 200, LDL < 100, HDL > 40",
      interpretation: "Mildly elevated LDL cholesterol. Dietary counseling suggested.",
      status: "VERIFIED",
      resultDate: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

/* Format Helpers */
const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
};

const getStatusLabel = (status: LabRequestStatus) => {
  switch (status) {
    case "REQUESTED":
      return "Awaiting Collection";
    case "SAMPLE_COLLECTED":
      return "Sample Collected";
    case "PROCESSING":
      return "Under Analysis";
    case "COMPLETED":
      return "Results Finalized";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
};

const getStatusTheme = (status: LabRequestStatus) => {
  switch (status) {
    case "REQUESTED":
      return { badge: "bg-amber-50 text-amber-800 border-amber-200", border: "#fde68a" };
    case "SAMPLE_COLLECTED":
      return { badge: "bg-blue-50 text-blue-800 border-blue-200", border: "#bfdbfe" };
    case "PROCESSING":
      return { badge: "bg-emerald-50 text-emerald-800 border-emerald-200", border: "#a7f3d0" };
    case "COMPLETED":
      return { badge: "bg-teal-50 text-teal-800 border-teal-200", border: "#99f6e4" };
    default:
      return { badge: "bg-slate-50 text-slate-700 border-slate-200", border: "#e2e8f0" };
  }
};

export default function LaboratoryWorkspacePage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<LabRequest[]>(MOCK_LAB_REQUESTS);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>("req-lab-001");
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(MOCK_LAB_REQUESTS[0]);
  const [results, setResults] = useState<LabResult[]>(MOCK_RESULTS["req-lab-001"] || []);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Result entry form modal
  const [activeTestForEntry, setActiveTestForEntry] = useState<LabTest | null>(null);
  const [resultForm, setResultForm] = useState<ResultForm>({
    resultValue: "",
    unit: "",
    referenceRange: "",
    interpretation: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  /* Load Queue from Backend or fallback */
  const loadQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const response = await fetch(
        `${API_URL}/lab-requests?facilityId=${encodeURIComponent(FACILITY_ID)}`
      );
      if (response.ok) {
        const payload: ApiResponse<LabRequest[]> = await response.json();
        if (payload?.success && Array.isArray(payload.data) && payload.data.length > 0) {
          setRequests(payload.data);
        }
      }
    } catch {
      // Keep resilient mock state
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  /* Open a specific request */
  const handleSelectRequest = async (requestId: string) => {
    setSelectedRequestId(requestId);
    setStatusMessage("");

    // Look in current state
    const found = requests.find((r) => r.id === requestId);
    if (found) {
      setSelectedRequest(found);
      setResults(MOCK_RESULTS[requestId] || []);
    }

    try {
      const response = await fetch(`${API_URL}/lab-requests/${encodeURIComponent(requestId)}`);
      if (response.ok) {
        const payload: ApiResponse<LabRequest> = await response.json();
        if (payload?.success && payload.data) {
          setSelectedRequest(payload.data);
        }
      }

      // Fetch results
      const resResponse = await fetch(`${API_URL}/lab-requests/${encodeURIComponent(requestId)}/results`);
      if (resResponse.ok) {
        const resPayload: ApiResponse<LabResult[]> = await resResponse.json();
        if (resPayload?.success && Array.isArray(resPayload.data)) {
          setResults(resPayload.data);
        }
      }
    } catch {
      // Mock fallback preserved
    }
  };

  /* Change Status Handler */
  const handleUpdateStatus = async (newStatus: LabRequestStatus) => {
    if (!selectedRequest) return;
    setActionLoading(true);

    try {
      await fetch(`${API_URL}/lab-requests/${selectedRequest.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Local fallback
    }

    const updated = { ...selectedRequest, status: newStatus };
    setSelectedRequest(updated);
    setRequests(requests.map((r) => (r.id === updated.id ? updated : r)));
    setActionLoading(false);
    setStatusMessage(`Request status updated to ${getStatusLabel(newStatus)}.`);
  };

  /* Submit Lab Test Result */
  const handleSubmitResult = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !activeTestForEntry) return;
    setActionLoading(true);

    const newResult: LabResult = {
      id: `res-${Date.now()}`,
      labRequestId: selectedRequest.id,
      performedById: DEFAULT_USER_ID,
      testName: activeTestForEntry.testName,
      resultValue: resultForm.resultValue,
      unit: resultForm.unit || null,
      referenceRange: resultForm.referenceRange || null,
      interpretation: resultForm.interpretation || null,
      status: "COMPLETED",
      resultDate: new Date().toISOString(),
      verifiedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      performedBy: {
        id: DEFAULT_USER_ID,
        firstName: "Eric",
        lastName: "Gasasira",
        role: "Medical Laboratory Technologist",
      },
    };

    try {
      await fetch(`${API_URL}/lab-requests/${selectedRequest.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testName: activeTestForEntry.testName,
          resultValue: resultForm.resultValue,
          unit: resultForm.unit,
          referenceRange: resultForm.referenceRange,
          interpretation: resultForm.interpretation,
          performedById: DEFAULT_USER_ID,
        }),
      });
    } catch {
      // Local fallback
    }

    const updatedResults = [...results, newResult];
    setResults(updatedResults);
    MOCK_RESULTS[selectedRequest.id] = updatedResults;

    // If all tests have results, mark completed
    if (updatedResults.length >= selectedRequest.tests.length) {
      handleUpdateStatus("COMPLETED");
    }

    setActiveTestForEntry(null);
    setResultForm({ resultValue: "", unit: "", referenceRange: "", interpretation: "" });
    setActionLoading(false);
    setStatusMessage(`Result recorded for ${activeTestForEntry.testName}.`);
  };

  /* Verify Result */
  const handleVerifyResult = async (resultId: string) => {
    setActionLoading(true);
    try {
      await fetch(`${API_URL}/lab-results/${resultId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifiedById: DEFAULT_USER_ID }),
      });
    } catch {
      // Local fallback
    }

    setResults(
      results.map((r) =>
        r.id === resultId
          ? { ...r, status: "VERIFIED", verifiedAt: new Date().toISOString() }
          : r
      )
    );
    setActionLoading(false);
    setStatusMessage("Result verified and signed off for clinical review.");
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patient.patientNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tests.some((t) => t.testName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout
      pageTitle="Laboratory Workspace"
      pageSubtitle="King Faisal Hospital • Diagnostics Department"
    >
      <div className="medical-records-container">
        {/* Metric Summary Strip */}
        <div className="analytics-metrics-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Total Requests</span>
              <strong className="metric-value">{requests.length}</strong>
              <small className="metric-trend neutral">Active laboratory queue</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Awaiting Collection</span>
              <strong className="metric-value">
                {requests.filter((r) => r.status === "REQUESTED").length}
              </strong>
              <small className="metric-trend highlight">Samples pending intake</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Under Analysis</span>
              <strong className="metric-value">
                {requests.filter((r) => r.status === "PROCESSING" || r.status === "SAMPLE_COLLECTED").length}
              </strong>
              <small className="metric-trend positive">Processing in lab</small>
            </div>
          </div>
        </div>

        {/* 2-Column Workspace */}
        <div className="lab-workspace-grid">
          {/* Left: Pending Lab Requests Queue */}
          <div className="lab-queue-panel">
            <div className="lab-panel-header">
              <div>
                <h2>Pending Lab Requests</h2>
                <p>Active orders from outpatient and specialty departments</p>
              </div>

              <button
                type="button"
                onClick={() => void loadQueue()}
                disabled={loadingQueue}
                className="action-pill-btn secondary small"
              >
                <RefreshCw size={13} className={loadingQueue ? "spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="search-input-wrapper" style={{ minWidth: "100%" }}>
              <Search size={15} className="search-box-icon" />
              <input
                type="text"
                placeholder="Search by patient name, ID, or test..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="tab-pill-group">
              {["ALL", "REQUESTED", "PROCESSING", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`tab-pill-item ${filterStatus === st ? "active" : ""}`}
                >
                  {st === "ALL"
                    ? "All"
                    : st === "REQUESTED"
                    ? "Awaiting"
                    : st === "PROCESSING"
                    ? "In Process"
                    : "Completed"}
                </button>
              ))}
            </div>

            {/* Queue List */}
            <div className="lab-queue-list">
              {filteredRequests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-secondary)" }}>
                  <CheckCircle2 size={32} style={{ margin: "0 auto 8px", color: "var(--text-subtle)" }} />
                  <strong style={{ display: "block", fontSize: "13px", color: "var(--text-primary)" }}>
                    No requests match your filter
                  </strong>
                  <p style={{ margin: "4px 0 0", fontSize: "11.5px" }}>All laboratory tasks in this queue are clear.</p>
                </div>
              ) : (
                filteredRequests.map((request) => {
                  const isSelected = selectedRequestId === request.id;
                  const theme = getStatusTheme(request.status);

                  return (
                    <div
                      key={request.id}
                      onClick={() => void handleSelectRequest(request.id)}
                      className={`lab-request-item ${isSelected ? "selected" : ""}`}
                    >
                      <div className="lab-item-header">
                        <div className="lab-patient-info">
                          <div className="lab-patient-avatar">
                            {getInitials(request.patient.firstName, request.patient.lastName)}
                          </div>
                          <div>
                            <strong className="lab-patient-name">
                              {request.patient.firstName} {request.patient.lastName}
                            </strong>
                            <span className="lab-patient-id">
                              {request.patient.patientNumber}
                            </span>
                          </div>
                        </div>

                        <span
                          className="status-badge-pill"
                          style={{
                            background: theme.badge.includes("amber")
                              ? "var(--status-waiting-bg)"
                              : theme.badge.includes("emerald")
                              ? "var(--status-success-bg)"
                              : "var(--bg-app)",
                            color: theme.badge.includes("amber")
                              ? "var(--status-waiting-text)"
                              : theme.badge.includes("emerald")
                              ? "var(--status-success-text)"
                              : "var(--text-secondary)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </div>

                      <div className="lab-item-tests">
                        {request.tests.map((t) => (
                          <span key={t.id} className="lab-test-chip">
                            <FlaskConical size={11} />
                            {t.testName}
                          </span>
                        ))}
                      </div>

                      <div className="lab-item-footer">
                        <span>Dr. {request.requestedBy.lastName}</span>
                        <span>{formatDateTime(request.requestedAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Selected Request Details & Results */}
          <div className="lab-detail-panel">
            {!selectedRequest ? (
              <div style={{ textAlign: "center", padding: "64px 20px", color: "var(--text-secondary)" }}>
                <FlaskConical size={40} style={{ margin: "0 auto 12px", color: "var(--text-subtle)" }} />
                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)" }}>Select a Lab Request</h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                  Choose a patient from the queue to view ordered tests and record results.
                </p>
              </div>
            ) : (
              <>
                {/* Header & Status Indicator */}
                <div className="lab-detail-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="drawer-avatar-lg">
                      {getInitials(selectedRequest.patient.firstName, selectedRequest.patient.lastName)}
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
                        {selectedRequest.patient.firstName} {selectedRequest.patient.lastName}
                      </h2>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        <span>ID: {selectedRequest.patient.patientNumber}</span>
                        <span>•</span>
                        <span>{selectedRequest.patient.gender || "Citizen"}</span>
                        {selectedRequest.patient.phone && (
                          <>
                            <span>•</span>
                            <span>{selectedRequest.patient.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span className="status-badge-pill status-completed">
                      {getStatusLabel(selectedRequest.status)}
                    </span>
                    <span style={{ display: "block", fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "3px" }}>
                      {formatDateTime(selectedRequest.requestedAt)}
                    </span>
                  </div>
                </div>

                {/* Status Message Alert */}
                {statusMessage && (
                  <div style={{ padding: "10px 14px", background: "var(--green-subtle)", border: "1px solid var(--green-border)", borderRadius: "10px", fontSize: "12px", color: "var(--green-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={15} />
                    <span>{statusMessage}</span>
                  </div>
                )}

                {/* Clinical Indication & Physician Card */}
                <div style={{ background: "var(--bg-app)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "10.5px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                    Clinical Indication
                  </span>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-primary)", lineHeight: "1.5" }}>
                    {selectedRequest.clinicalIndication || "Routine diagnostic evaluation."}
                  </p>
                  {selectedRequest.notes && (
                    <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                      Notes: {selectedRequest.notes}
                    </p>
                  )}
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", paddingTop: "4px" }}>
                    Ordering Physician: Dr. {selectedRequest.requestedBy.firstName} {selectedRequest.requestedBy.lastName} ({selectedRequest.requestedBy.role})
                  </div>
                </div>

                {/* Workflow Actions */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {selectedRequest.status === "REQUESTED" && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus("SAMPLE_COLLECTED")}
                      className="action-pill-btn primary"
                    >
                      Mark Sample Collected
                    </button>
                  )}

                  {selectedRequest.status === "SAMPLE_COLLECTED" && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus("PROCESSING")}
                      className="action-pill-btn primary"
                    >
                      Begin Laboratory Analysis
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate(`/patients`)}
                    className="action-pill-btn secondary"
                  >
                    <UserRound size={14} />
                    <span>View Patient Medical File</span>
                  </button>
                </div>

                {/* Requested Investigations & Test Results */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: "13.5px", fontWeight: "700", color: "var(--text-primary)" }}>
                      Requested Investigations ({selectedRequest.tests.length})
                    </h3>
                    <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                      {results.length} of {selectedRequest.tests.length} recorded
                    </span>
                  </div>

                  <div className="lab-tests-list">
                    {selectedRequest.tests.map((test) => {
                      const existingResult = results.find(
                        (r) => r.testName.toLowerCase() === test.testName.toLowerCase()
                      );

                      return (
                        <div
                          key={test.id}
                          className={`lab-test-card ${existingResult ? "has-result" : ""}`}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <FlaskConical size={15} style={{ color: "var(--text-secondary)" }} />
                              <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                                {test.testName}
                              </strong>
                              {test.testCode && (
                                <span className="blood-type-pill font-mono">
                                  {test.testCode}
                                </span>
                              )}
                            </div>

                            {existingResult ? (
                              <span className="status-badge-pill status-completed">
                                ✓ Result Entered
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveTestForEntry(test)}
                                className="action-pill-btn green small"
                              >
                                <Plus size={13} />
                                <span>Record Result</span>
                              </button>
                            )}
                          </div>

                          {/* Existing Result Details */}
                          {existingResult && (
                            <div style={{ background: "var(--bg-app)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                              <div>
                                <span style={{ color: "var(--text-secondary)" }}>Value: </span>
                                <strong style={{ color: "var(--text-primary)", fontFamily: "monospace" }}>
                                  {existingResult.resultValue}
                                </strong>
                              </div>

                              {existingResult.referenceRange && (
                                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                  <span>Reference Range: </span>
                                  <span>{existingResult.referenceRange}</span>
                                </div>
                              )}

                              {existingResult.interpretation && (
                                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                  <span>Interpretation: </span>
                                  <span style={{ fontStyle: "italic" }}>{existingResult.interpretation}</span>
                                </div>
                              )}

                              <div style={{ paddingTop: "6px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10.5px", color: "var(--text-secondary)" }}>
                                <span>
                                  Recorded by {existingResult.performedBy?.firstName || "Lab Staff"} • {formatDateTime(existingResult.resultDate)}
                                </span>

                                {existingResult.status === "VERIFIED" ? (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--green-primary)", fontWeight: "700" }}>
                                    <ShieldCheck size={12} />
                                    Verified & Signed
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyResult(existingResult.id)}
                                    className="action-pill-btn primary small"
                                  >
                                    Verify Result
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Record Lab Test Result */}
      {activeTestForEntry && (
        <div className="modal-overlay-backdrop">
          <div className="modal-card-dialog">
            <div className="modal-dialog-header">
              <div className="modal-title-wrap">
                <h3>Record Test Result</h3>
                <p>
                  {activeTestForEntry.testName} • {selectedRequest?.patient.firstName} {selectedRequest?.patient.lastName} ({selectedRequest?.patient.patientNumber})
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitResult} className="modal-form-body">
              <div className="form-field">
                <label>Result Finding / Value *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 13.8 g/dL or Negative"
                  value={resultForm.resultValue}
                  onChange={(e) =>
                    setResultForm({ ...resultForm, resultValue: e.target.value })
                  }
                />
              </div>

              <div className="form-row-2col">
                <div className="form-field">
                  <label>Units</label>
                  <input
                    type="text"
                    placeholder="e.g. mg/dL, mmol/L"
                    value={resultForm.unit}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, unit: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Reference Range</label>
                  <input
                    type="text"
                    placeholder="e.g. 70 - 100 mg/dL"
                    value={resultForm.referenceRange}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, referenceRange: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Clinical Interpretation / Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Within standard reference limits. Specimen clear."
                  value={resultForm.interpretation}
                  onChange={(e) =>
                    setResultForm({ ...resultForm, interpretation: e.target.value })
                  }
                />
              </div>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  onClick={() => setActiveTestForEntry(null)}
                  className="action-pill-btn secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="action-pill-btn primary"
                >
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}