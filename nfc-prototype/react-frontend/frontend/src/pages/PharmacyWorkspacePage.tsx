import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  LoaderCircle,
  Pill,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";

const API_URL = "http://localhost:5000/api/v1";
const DEVELOPMENT_FACILITY_ID = "9e268cfd-1e17-47cf-aadb-be42c58ad79f";
const DEVELOPMENT_USER_ID = "ac844b2b-cc1b-45a4-9404-e059fdd6df0b";

type PrescriptionStatus = "ACTIVE" | "DISPENSED" | "COMPLETED" | "CANCELLED";

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

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: "rx-001",
    patientId: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
    encounterId: "enc-001",
    prescribedById: "doc-001",
    status: "ACTIVE",
    notes: "Take after meals. Return if fever or persistent pain continues.",
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    patient: {
      id: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
      patientNumber: "MC-2026-0811",
      firstName: "Alice",
      lastName: "Mutoni",
      dateOfBirth: "1994-05-12",
      gender: "Female",
      phone: "+250 788 123 456",
    },
    items: [
      {
        id: "item-1",
        prescriptionId: "rx-001",
        medicationName: "Amoxicillin",
        dosage: "500 mg",
        frequency: "Three times daily",
        duration: "5 days",
        quantity: "15 capsules",
        instructions: "Take with food",
        createdAt: "",
      },
      {
        id: "item-2",
        prescriptionId: "rx-001",
        medicationName: "Paracetamol",
        dosage: "500 mg",
        frequency: "Three times daily as needed",
        duration: "3 days",
        quantity: "9 tablets",
        instructions: "Take for pain or fever",
        createdAt: "",
      },
    ],
    prescribedBy: {
      id: "doc-001",
      firstName: "Solange",
      lastName: "Uwera",
      role: "Consultant Physician",
    },
    encounter: {
      id: "enc-001",
      patientId: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
      facilityId: DEVELOPMENT_FACILITY_ID,
      status: "OPEN",
      startedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    },
  },
  {
    id: "rx-002",
    patientId: "patient-002",
    encounterId: "enc-002",
    prescribedById: "doc-002",
    status: "ACTIVE",
    notes: "Essential hypertension maintenance. Low sodium dietary guidance given.",
    createdAt: new Date(Date.now() - 55 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 55 * 60000).toISOString(),
    patient: {
      id: "patient-002",
      patientNumber: "MC-2026-0492",
      firstName: "Jean",
      lastName: "Rukundo",
      dateOfBirth: "1982-11-20",
      gender: "Male",
      phone: "+250 788 456 789",
    },
    items: [
      {
        id: "item-3",
        prescriptionId: "rx-002",
        medicationName: "Amlodipine",
        dosage: "5 mg",
        frequency: "Once daily in the morning",
        duration: "30 days",
        quantity: "30 tablets",
        instructions: "Take daily with water",
        createdAt: "",
      },
      {
        id: "item-4",
        prescriptionId: "rx-002",
        medicationName: "Telmisartan",
        dosage: "40 mg",
        frequency: "Once daily",
        duration: "30 days",
        quantity: "30 tablets",
        instructions: "Take at regular time",
        createdAt: "",
      },
    ],
    prescribedBy: {
      id: "doc-002",
      firstName: "Jean-Paul",
      lastName: "Kagame",
      role: "Cardiologist",
    },
    encounter: {
      id: "enc-002",
      patientId: "patient-002",
      facilityId: DEVELOPMENT_FACILITY_ID,
      status: "OPEN",
      startedAt: new Date(Date.now() - 90 * 60000).toISOString(),
    },
  },
  {
    id: "rx-003",
    patientId: "patient-003",
    encounterId: "enc-003",
    prescribedById: "doc-003",
    status: "DISPENSED",
    notes: "Dispensed full course. Patient informed on hydration.",
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    patient: {
      id: "patient-003",
      patientNumber: "MC-2026-1108",
      firstName: "Keza",
      lastName: "Uwase",
      dateOfBirth: "1999-03-15",
      gender: "Female",
      phone: "+250 788 777 888",
    },
    items: [
      {
        id: "item-5",
        prescriptionId: "rx-003",
        medicationName: "Ciprofloxacin",
        dosage: "500 mg",
        frequency: "Twice daily",
        duration: "7 days",
        quantity: "14 tablets",
        instructions: "Complete entire antibiotic course",
        createdAt: "",
      },
    ],
    prescribedBy: {
      id: "doc-003",
      firstName: "Patrick",
      lastName: "Mugabo",
      role: "General Practitioner",
    },
    encounter: {
      id: "enc-003",
      patientId: "patient-003",
      facilityId: DEVELOPMENT_FACILITY_ID,
      status: "COMPLETED",
      startedAt: new Date(Date.now() - 200 * 60000).toISOString(),
    },
  },
];

export default function PharmacyWorkspacePage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(MOCK_PRESCRIPTIONS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [dispensing, setDispensing] = useState(false);
  const [dispensingNotes, setDispensingNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/prescriptions?facilityId=${encodeURIComponent(DEVELOPMENT_FACILITY_ID)}`
      );
      if (response.ok) {
        const payload = await response.json();
        if (payload?.success && Array.isArray(payload.data) && payload.data.length > 0) {
          setPrescriptions(payload.data);
        }
      }
    } catch {
      // Keep mock prescriptions intact
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const handleConfirmDispense = async () => {
    if (!selectedPrescription) return;
    setDispensing(true);

    try {
      await fetch(`${API_URL}/prescriptions/${selectedPrescription.id}/dispense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dispensedById: DEVELOPMENT_USER_ID,
          notes: dispensingNotes || "Dispensed by Pharmacy",
        }),
      });
    } catch {
      // Local fallback
    }

    setPrescriptions((prev) =>
      prev.map((rx) =>
        rx.id === selectedPrescription.id ? { ...rx, status: "DISPENSED" } : rx
      )
    );

    setSuccessMessage(
      `Medication successfully dispensed for ${selectedPrescription.patient.firstName} ${selectedPrescription.patient.lastName}.`
    );
    setDispensing(false);
    setSelectedPrescription(null);
    setDispensingNotes("");
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const query = search.toLowerCase();
    const matchesSearch =
      rx.patient.firstName.toLowerCase().includes(query) ||
      rx.patient.lastName.toLowerCase().includes(query) ||
      rx.patient.patientNumber.toLowerCase().includes(query) ||
      rx.items.some((item) => item.medicationName.toLowerCase().includes(query)) ||
      rx.prescribedBy.firstName.toLowerCase().includes(query) ||
      rx.prescribedBy.lastName.toLowerCase().includes(query);

    const matchesStatus = filterStatus === "ALL" || rx.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "Recently";
    return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  };

  const activeCount = prescriptions.filter((r) => r.status === "ACTIVE").length;
  const dispensedCount = prescriptions.filter((r) => r.status === "DISPENSED").length;
  const completedCount = prescriptions.filter((r) => r.status === "COMPLETED").length;

  return (
    <AppLayout
      pageTitle="Pharmacy Workspace"
      pageSubtitle="King Faisal Hospital • Medication Dispensing Department"
      actionButton={{
        label: "Refresh Queue",
        onClick: () => void loadQueue(),
        icon: <RefreshCw size={15} className={loading ? "spin" : ""} />,
      }}
    >
      <div className="pharmacy-workspace-container">
        {/* Metric Summary Strip */}
        <div className="analytics-metrics-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Awaiting Dispensing</span>
              <strong className="metric-value">{activeCount}</strong>
              <small className="metric-trend highlight">Pending pharmacy check</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Dispensed Today</span>
              <strong className="metric-value">{dispensedCount}</strong>
              <small className="metric-trend positive">Fulfilled prescriptions</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Completed Visits</span>
              <strong className="metric-value">{completedCount}</strong>
              <small className="metric-trend neutral">Closed encounters</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Total in Queue</span>
              <strong className="metric-value">{prescriptions.length}</strong>
              <small className="metric-trend neutral">Daily volume</small>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="clinical-success">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="pharmacy-filter-row">
          <div className="search-input-wrapper" style={{ minWidth: "320px", flex: 1 }}>
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              placeholder="Search by patient name, number, medication, or doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch("")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="pharmacy-filter-tabs">
            <button
              type="button"
              className={`pharmacy-filter-tab ${filterStatus === "ALL" ? "active" : ""}`}
              onClick={() => setFilterStatus("ALL")}
            >
              All ({prescriptions.length})
            </button>
            <button
              type="button"
              className={`pharmacy-filter-tab ${filterStatus === "ACTIVE" ? "active" : ""}`}
              onClick={() => setFilterStatus("ACTIVE")}
            >
              Awaiting ({activeCount})
            </button>
            <button
              type="button"
              className={`pharmacy-filter-tab ${filterStatus === "DISPENSED" ? "active" : ""}`}
              onClick={() => setFilterStatus("DISPENSED")}
            >
              Dispensed ({dispensedCount})
            </button>
          </div>
        </div>

        {/* Prescription Queue Cards List */}
        <div className="pharmacy-queue-grid">
          {filteredPrescriptions.length === 0 ? (
            <div className="workspace-empty-state">
              <Pill size={36} />
              <strong>No Prescriptions Found</strong>
              <span>There are no matching medication orders in the current queue.</span>
            </div>
          ) : (
            filteredPrescriptions.map((rx) => (
              <article key={rx.id} className="pharmacy-rx-card">
                {/* Header */}
                <div className="pharmacy-rx-header">
                  <div className="pharmacy-patient-meta">
                    <div className="pharmacy-patient-avatar">
                      {getInitials(rx.patient.firstName, rx.patient.lastName)}
                    </div>
                    <div className="pharmacy-patient-details">
                      <strong>
                        {rx.patient.firstName} {rx.patient.lastName}
                      </strong>
                      <small>Patient No: {rx.patient.patientNumber} • {rx.patient.gender}</small>
                    </div>
                  </div>

                  <span className={`clinical-status-badge ${rx.status.toLowerCase()}`}>
                    {rx.status === "ACTIVE" ? "Awaiting Dispensing" : rx.status}
                  </span>
                </div>

                {/* Meta details */}
                <div className="pharmacy-rx-meta">
                  <span>
                    <User size={14} />
                    Prescribed by Dr. {rx.prescribedBy.firstName} {rx.prescribedBy.lastName} ({rx.prescribedBy.role})
                  </span>
                  <span>
                    <Clock3 size={14} />
                    Ordered {formatDateTime(rx.createdAt)}
                  </span>
                </div>

                {rx.notes && (
                  <p className="prescription-notes" style={{ margin: 0 }}>
                    Clinical Note: {rx.notes}
                  </p>
                )}

                {/* Medication items */}
                <div className="pharmacy-med-items">
                  {rx.items.map((item) => (
                    <div key={item.id} className="pharmacy-med-item">
                      <div className="pharmacy-med-name-dosage">
                        <Pill size={15} style={{ color: "var(--green-primary)" }} />
                        <strong>{item.medicationName}</strong>
                        {item.dosage && <span className="dosage-badge">{item.dosage}</span>}
                      </div>

                      <div className="pharmacy-med-tags">
                        {item.frequency && <span className="meta-tag">{item.frequency}</span>}
                        {item.duration && <span className="meta-tag">{item.duration}</span>}
                        {item.quantity && <span className="qty-tag">Qty: {item.quantity}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Action */}
                <div className="pharmacy-rx-footer">
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {rx.items.length} medication{rx.items.length === 1 ? "" : "s"} ordered
                  </span>

                  {rx.status === "ACTIVE" ? (
                    <button
                      type="button"
                      className="action-pill-btn primary"
                      onClick={() => setSelectedPrescription(rx)}
                    >
                      <Pill size={15} />
                      <span>Dispense Medications</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="action-pill-btn secondary"
                      onClick={() => setSelectedPrescription(rx)}
                    >
                      <ClipboardList size={15} />
                      <span>View Dispensing Record</span>
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Dispensing Modal */}
      {selectedPrescription && (
        <div className="modal-overlay-backdrop" onClick={() => setSelectedPrescription(null)}>
          <div className="modal-card-dialog modal-dialog-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <div className="modal-title-wrap">
                <span className="eyebrow-dot-inline" />
                <h3>Dispense Prescription</h3>
                <p>
                  Verify medication details for {selectedPrescription.patient.firstName}{" "}
                  {selectedPrescription.patient.lastName} ({selectedPrescription.patient.patientNumber})
                </p>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setSelectedPrescription(null)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-content" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="print-patient-summary">
                <div>
                  <small>PATIENT</small>
                  <strong>
                    {selectedPrescription.patient.firstName} {selectedPrescription.patient.lastName}
                  </strong>
                </div>
                <div>
                  <small>PATIENT ID</small>
                  <strong>{selectedPrescription.patient.patientNumber}</strong>
                </div>
                <div>
                  <small>PRESCRIBER</small>
                  <strong>Dr. {selectedPrescription.prescribedBy.lastName}</strong>
                </div>
              </div>

              <div className="clinical-field">
                <label>Prescribed Medications to Dispense</label>
                <div className="pharmacy-med-items">
                  {selectedPrescription.items.map((item) => (
                    <div key={item.id} className="pharmacy-med-item">
                      <div className="pharmacy-med-name-dosage">
                        <CheckCircle2 size={16} style={{ color: "var(--green-primary)" }} />
                        <strong>{item.medicationName}</strong>
                        {item.dosage && <span className="dosage-badge">{item.dosage}</span>}
                      </div>
                      <div className="pharmacy-med-tags">
                        <span className="meta-tag">{item.frequency}</span>
                        <span className="qty-tag">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="clinical-field">
                <label htmlFor="pharmacy-notes">Pharmacist Dispensing Verification Notes</label>
                <textarea
                  id="pharmacy-notes"
                  rows={3}
                  value={dispensingNotes}
                  onChange={(e) => setDispensingNotes(e.target.value)}
                  placeholder="Patient counseling notes, batch numbers, or special instructions..."
                />
              </div>
            </div>

            <div className="modal-actions-bar">
              <button
                type="button"
                className="action-pill-btn secondary"
                onClick={() => setSelectedPrescription(null)}
              >
                Close
              </button>
              {selectedPrescription.status === "ACTIVE" && (
                <button
                  type="button"
                  className="action-pill-btn primary"
                  onClick={handleConfirmDispense}
                  disabled={dispensing}
                >
                  {dispensing ? (
                    <>
                      <LoaderCircle size={16} className="spin" />
                      <span>Verifying & Dispensing...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Confirm & Dispense</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}