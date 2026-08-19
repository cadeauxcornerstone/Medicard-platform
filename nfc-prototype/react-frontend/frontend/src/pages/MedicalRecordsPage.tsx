import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Download,
  Stethoscope,
  FlaskConical,
  Pill,
  Activity,
  ShieldCheck,
  User,
  Printer,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";

interface MedicalRecord {
  id: string;
  recordCode: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  medcardUid: string;
  recordType: "Consultation" | "Laboratory" | "Prescription" | "Radiology" | "Discharge";
  facility: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  summary: string;
  vitals?: {
    bp: string;
    pulse: string;
    temp: string;
    spo2: string;
    weight: string;
  };
  attachments?: string[];
  digitalSignature: string;
}

const INITIAL_RECORDS: MedicalRecord[] = [
  {
    id: "rec-001",
    recordCode: "EHR-2026-9041",
    patientId: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
    patientName: "Alice Mutoni",
    patientNumber: "MC-2026-0811",
    medcardUid: "04:A2:8B:1F:90:3C",
    recordType: "Consultation",
    facility: "King Faisal Hospital (Kigali)",
    doctorName: "Dr. Solange Uwera (Consultant Physician)",
    date: "18 Aug 2026, 09:30 AM",
    diagnosis: "Knee Arthroscopy Post-Op Evaluation (ICD-10 Z48.81)",
    summary:
      "Patient reports moderate pain improvement on day 12 post-op. Surgical wound clean with dry borders, no discharge or signs of localized infection. Full range of motion progressing with physiotherapy.",
    vitals: {
      bp: "118/76 mmHg",
      pulse: "72 bpm",
      temp: "36.6 °C",
      spo2: "99%",
      weight: "62.5 kg",
    },
    attachments: ["Surgical_Summary.pdf", "Physiotherapy_Protocol_v2.pdf"],
    digitalSignature: "RSA-4096-SHA256 • Verified Rwanda MoH E-Health Grid",
  },
  {
    id: "rec-002",
    recordCode: "LAB-2026-4412",
    patientId: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
    patientName: "Alice Mutoni",
    patientNumber: "MC-2026-0811",
    medcardUid: "04:A2:8B:1F:90:3C",
    recordType: "Laboratory",
    facility: "National Reference Laboratory (Kigali)",
    doctorName: "Dr. Eric Gasasira (Clinical Pathologist)",
    date: "17 Aug 2026, 02:15 PM",
    diagnosis: "Comprehensive Metabolic & Inflammatory Panel",
    summary:
      "CRP: 3.2 mg/L (Normal), ESR: 12 mm/hr, Hemoglobin: 13.8 g/dL, WBC: 6.4 x 10^9/L, Platelets: 240 x 10^9/L. Liver and renal parameters within normal limits.",
    attachments: ["Full_Hematology_Report.pdf"],
    digitalSignature: "RSA-4096-SHA256 • Certified Laboratory Sign-off",
  },
  {
    id: "rec-003",
    recordCode: "RX-2026-8819",
    patientId: "patient-002",
    patientName: "Jean Rukundo",
    patientNumber: "MC-2026-0492",
    medcardUid: "04:C5:1E:44:88:9A",
    recordType: "Prescription",
    facility: "Kigali University Teaching Hospital (CHUK)",
    doctorName: "Dr. Jean-Paul Kagame (Cardiologist)",
    date: "18 Aug 2026, 10:45 AM",
    diagnosis: "Primary Essential Hypertension (ICD-10 I10)",
    summary:
      "Amlodipine 5mg PO Daily (30 Days), Telmisartan 40mg PO Daily (30 Days). Low sodium dietary guidance provided. Patient verified eligibility via MedCard wallet insurance.",
    vitals: {
      bp: "142/88 mmHg",
      pulse: "78 bpm",
      temp: "36.8 °C",
      spo2: "98%",
      weight: "84.0 kg",
    },
    attachments: ["E-Prescription_RAMA_Approved.pdf"],
    digitalSignature: "RSA-4096-SHA256 • MoH Pharmacy Dispense Stamp",
  },
  {
    id: "rec-004",
    recordCode: "RAD-2026-1933",
    patientId: "patient-003",
    patientName: "Keza Uwase",
    patientNumber: "MC-2026-1108",
    medcardUid: "04:F8:33:AA:11:55",
    recordType: "Radiology",
    facility: "King Faisal Hospital (Kigali)",
    doctorName: "Dr. Diane Mukarugwiza (Radiologist)",
    date: "16 Aug 2026, 04:00 PM",
    diagnosis: "Chest Radiograph 2-View (PA and Lateral)",
    summary:
      "Clear lung fields bilaterally without focal consolidation, pneumothorax, or pleural effusion. Normal cardiac silhouette and mediastinal contours.",
    attachments: ["DICOM_CXR_DigitalView.link", "Radiology_Official_Findings.pdf"],
    digitalSignature: "RSA-4096-SHA256 • Verified PACS Imaging Link",
  },
  {
    id: "rec-005",
    recordCode: "EHR-2026-7721",
    patientId: "patient-004",
    patientName: "Emmanuel Ndayisaba",
    patientNumber: "MC-2026-0744",
    medcardUid: "04:99:B2:77:4F:2C",
    recordType: "Consultation",
    facility: "Polyclinique de l'Étoile (Kigali)",
    doctorName: "Dr. Patrick Mugabo (Endocrinologist)",
    date: "14 Aug 2026, 11:20 AM",
    diagnosis: "Type 2 Diabetes Mellitus with Stable Control",
    summary:
      "HbA1c level recorded at 6.8% (improved from 7.4%). Continue Metformin 1000mg BID. Foot exam negative for neuropathy or ulcerations.",
    vitals: {
      bp: "124/80 mmHg",
      pulse: "68 bpm",
      temp: "36.5 °C",
      spo2: "99%",
      weight: "76.2 kg",
    },
    attachments: ["Diabetic_Management_CarePlan.pdf"],
    digitalSignature: "RSA-4096-SHA256 • RSSB Connected Record",
  },
];

export default function MedicalRecordsPage() {
  const navigate = useNavigate();
  const [records] = useState<MedicalRecord[]>(INITIAL_RECORDS);
  const [selectedType, setSelectedType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>("rec-001");
  const [exportModalRecord, setExportModalRecord] = useState<MedicalRecord | null>(null);

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.recordCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.facility.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === "All" || rec.recordType === selectedType;

    return matchesSearch && matchesType;
  });

  const toggleExpand = (id: string) => {
    setExpandedRecordId(expandedRecordId === id ? null : id);
  };

  return (
    <AppLayout
      pageTitle="Medical Records Explorer"
      pageSubtitle="Interoperable Rwanda National Health Record Archive"
      actionButton={{
        label: "Export Selected Records",
        onClick: () => setExportModalRecord(records[0]),
        icon: <Download size={16} />,
      }}
    >
      <div className="medical-records-container">
        {/* Analytics Top Strip */}
        <div className="analytics-metrics-grid">
          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Accessible Records</span>
              <strong className="metric-value">28,490</strong>
              <small className="metric-trend positive">Across 14 facilities</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">MoH Encrypted</span>
              <strong className="metric-value">100%</strong>
              <small className="metric-trend highlight">Zero tampering risk</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Diagnostic Feeds</span>
              <strong className="metric-value">8,120</strong>
              <small className="metric-trend positive">Instant sync on release</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Retrieval Latency</span>
              <strong className="metric-value">4.2s</strong>
              <small className="metric-trend neutral">Average cross-facility</small>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="page-filters-card">
          <div className="tab-pill-group">
            <button
              type="button"
              className={`tab-pill-item ${selectedType === "All" ? "active" : ""}`}
              onClick={() => setSelectedType("All")}
            >
              All Records
            </button>
            <button
              type="button"
              className={`tab-pill-item ${selectedType === "Consultation" ? "active" : ""}`}
              onClick={() => setSelectedType("Consultation")}
            >
              Consultations
            </button>
            <button
              type="button"
              className={`tab-pill-item ${selectedType === "Laboratory" ? "active" : ""}`}
              onClick={() => setSelectedType("Laboratory")}
            >
              Lab Results
            </button>
            <button
              type="button"
              className={`tab-pill-item ${selectedType === "Prescription" ? "active" : ""}`}
              onClick={() => setSelectedType("Prescription")}
            >
              Prescriptions
            </button>
            <button
              type="button"
              className={`tab-pill-item ${selectedType === "Radiology" ? "active" : ""}`}
              onClick={() => setSelectedType("Radiology")}
            >
              Radiology
            </button>
          </div>

          <div className="filter-dropdowns-group">
            <div className="search-input-wrapper">
              <Search size={16} className="search-box-icon" />
              <input
                type="text"
                placeholder="Search by Patient, Record Code, Diagnosis, Doctor, or Facility..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="patients-search-input"
              />
            </div>
          </div>
        </div>

        {/* Records Interactive Accordion List */}
        <div className="records-accordion-list">
          {filteredRecords.length === 0 ? (
            <div className="empty-results-box full-width">
              <FileText size={42} />
              <strong>No medical records found</strong>
              <p>Try modifying your search keywords or switching record categories.</p>
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const isExpanded = expandedRecordId === rec.id;
              const typeIcon =
                rec.recordType === "Laboratory" ? (
                  <FlaskConical size={15} />
                ) : rec.recordType === "Prescription" ? (
                  <Pill size={15} />
                ) : rec.recordType === "Radiology" ? (
                  <Activity size={15} />
                ) : (
                  <Stethoscope size={15} />
                );

              const badgeColorClass =
                rec.recordType === "Laboratory"
                  ? "badge-lab"
                  : rec.recordType === "Prescription"
                  ? "badge-rx"
                  : rec.recordType === "Radiology"
                  ? "badge-rad"
                  : "badge-consult";

              return (
                <article
                  key={rec.id}
                  className={`medical-record-card ${isExpanded ? "expanded" : ""}`}
                >
                  {/* Compact Header Row — click to expand */}
                  <div
                    className="record-summary-header"
                    onClick={() => toggleExpand(rec.id)}
                  >
                    <div className="record-header-left">
                      <div className={`record-type-badge ${badgeColorClass}`}>
                        {typeIcon}
                        <span>{rec.recordType}</span>
                      </div>
                      <div className="record-meta-main">
                        <strong className="record-diagnosis">{rec.diagnosis}</strong>
                        <div className="record-sub-meta">
                          <span className="record-patient-name">{rec.patientName}</span>
                          <span className="meta-dot">·</span>
                          <span className="record-code">{rec.recordCode}</span>
                          <span className="meta-dot">·</span>
                          <span className="record-date">{rec.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="record-header-right">
                      <span className="record-facility-text">{rec.facility}</span>
                      <button
                        type="button"
                        className="record-toggle-btn"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Body */}
                  {isExpanded && (
                    <div className="record-expanded-body">

                      {/* Author + Signature — one quiet row */}
                      <div className="record-author-row">
                        <div className="author-data">
                          <User size={13} />
                          <span>{rec.doctorName}</span>
                        </div>
                        <div className="security-verified-stamp">
                          <ShieldCheck size={13} />
                          <span>{rec.digitalSignature}</span>
                        </div>
                      </div>

                      {/* Clinical Narrative — just text, no container box */}
                      <div className="record-narrative-section">
                        <span className="record-section-label">Clinical Notes</span>
                        <p className="record-narrative-text">{rec.summary}</p>
                      </div>

                      {/* Vitals — card strip with individual labelled readings */}
                      {rec.vitals && (
                        <div className="record-vitals-section">
                          <span className="record-section-label">Encounter Vitals</span>
                          <div className="vitals-readings-strip">
                            <div className="vital-reading-card">
                              <span className="vital-label">Blood Pressure</span>
                              <strong className="vital-value">{rec.vitals.bp}</strong>
                            </div>
                            <div className="vital-reading-card">
                              <span className="vital-label">Heart Rate</span>
                              <strong className="vital-value">{rec.vitals.pulse}</strong>
                            </div>
                            <div className="vital-reading-card">
                              <span className="vital-label">Temperature</span>
                              <strong className="vital-value">{rec.vitals.temp}</strong>
                            </div>
                            <div className="vital-reading-card">
                              <span className="vital-label">SpO₂</span>
                              <strong className="vital-value highlight">{rec.vitals.spo2}</strong>
                            </div>
                            <div className="vital-reading-card">
                              <span className="vital-label">Weight</span>
                              <strong className="vital-value">{rec.vitals.weight}</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Footer: Attachments + Actions */}
                      <div className="record-actions-footer">
                        {rec.attachments && rec.attachments.length > 0 && (
                          <div className="attachments-list">
                            {rec.attachments.map((att, i) => (
                              <span key={i} className="attachment-pill">
                                <FileText size={13} />
                                {att}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="footer-buttons-group">
                          <button
                            type="button"
                            className="action-pill-btn secondary small"
                            onClick={() => setExportModalRecord(rec)}
                          >
                            <Printer size={14} />
                            <span>Print / Export PDF</span>
                          </button>

                          <button
                            type="button"
                            className="action-pill-btn primary small"
                            onClick={() => navigate(`/patients/${rec.patientId}`)}
                          >
                            <Stethoscope size={14} />
                            <span>Open Patient Workspace</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Export / Print Preview Modal */}
      {exportModalRecord && (
        <div className="modal-overlay-backdrop" onClick={() => setExportModalRecord(null)}>
          <div className="modal-card-dialog modal-dialog-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <div className="modal-title-wrap">
                <span className="eyebrow-dot-inline" />
                <h3>Rwanda Digital Health Record Export</h3>
                <p>MoH compliant interoperable medical summary packet.</p>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setExportModalRecord(null)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="print-preview-sheet">
              <div className="print-header-top">
                <div className="gov-seal-box">
                  <strong>REPUBLIC OF RWANDA</strong>
                  <small>Ministry of Health • MedCard Health Grid</small>
                </div>
                <div className="doc-meta-right">
                  <strong>{exportModalRecord.recordCode}</strong>
                  <small>{exportModalRecord.date}</small>
                </div>
              </div>

              <div className="print-patient-summary">
                <div>
                  <small>PATIENT NAME</small>
                  <strong>{exportModalRecord.patientName}</strong>
                </div>
                <div>
                  <small>PATIENT NUMBER</small>
                  <strong>{exportModalRecord.patientNumber}</strong>
                </div>
                <div>
                  <small>MEDCARD UID</small>
                  <strong>{exportModalRecord.medcardUid}</strong>
                </div>
              </div>

              <div className="print-body-content">
                <strong>DIAGNOSIS: {exportModalRecord.diagnosis}</strong>
                <p>{exportModalRecord.summary}</p>
                <div className="print-verified-footer">
                  <ShieldCheck size={16} />
                  <span>Digitally Signed: {exportModalRecord.digitalSignature}</span>
                </div>
              </div>
            </div>

            <div className="modal-actions-bar">
              <button
                type="button"
                className="action-pill-btn secondary"
                onClick={() => setExportModalRecord(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="action-pill-btn primary"
                onClick={() => {
                  window.print();
                  setExportModalRecord(null);
                }}
              >
                <Download size={16} />
                <span>Download Certified PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
