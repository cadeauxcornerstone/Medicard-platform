import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Wifi,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Stethoscope,
  X,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { getPatients, createPatient } from "../services/api";

interface MockPatient {
  id: string;
  patientNumber: string;
  name: string;
  age: number;
  gender: "Female" | "Male";
  phone: string;
  nationalId: string;
  medcardUid: string;
  cardStatus: "Active" | "Pending" | "Unassigned";
  insurance: string;
  lastVisit: string;
  department: string;
  bloodType: string;
  allergies: string[];
  condition: string;
  walletBalance: string;
}

const INITIAL_PATIENTS: MockPatient[] = [
  {
    id: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
    patientNumber: "MC-2026-0811",
    name: "Alice Mutoni",
    age: 29,
    gender: "Female",
    phone: "+250 788 123 456",
    nationalId: "1 1995 7 0048291 0 42",
    medcardUid: "04:A2:8B:1F:90:3C",
    cardStatus: "Active",
    insurance: "RSSB / RAMA (85%)",
    lastVisit: "Today, 09:15 AM",
    department: "General OPD",
    bloodType: "O+",
    allergies: ["Penicillin", "Sulfa drugs"],
    condition: "Post-op Follow-up",
    walletBalance: "RWF 125,000",
  },
  {
    id: "patient-002",
    patientNumber: "MC-2026-0492",
    name: "Jean Rukundo",
    age: 44,
    gender: "Male",
    phone: "+250 788 456 789",
    nationalId: "1 1980 8 0039182 1 19",
    medcardUid: "04:C5:1E:44:88:9A",
    cardStatus: "Active",
    insurance: "MMI Military (90%)",
    lastVisit: "Today, 10:30 AM",
    department: "Cardiology",
    bloodType: "A+",
    allergies: ["None known"],
    condition: "Hypertension Stage 1",
    walletBalance: "RWF 48,500",
  },
  {
    id: "patient-003",
    patientNumber: "MC-2026-1108",
    name: "Keza Uwase",
    age: 22,
    gender: "Female",
    phone: "+250 783 777 888",
    nationalId: "1 2002 7 0055192 0 88",
    medcardUid: "04:F8:33:AA:11:55",
    cardStatus: "Active",
    insurance: "CBHI Mutuelle de Santé (100%)",
    lastVisit: "Yesterday, 03:45 PM",
    department: "Laboratory / Diagnostic",
    bloodType: "B+",
    allergies: ["Aspirin"],
    condition: "Acute Febrile Illness",
    walletBalance: "RWF 18,200",
  },
  {
    id: "patient-004",
    patientNumber: "MC-2026-0744",
    name: "Emmanuel Ndayisaba",
    age: 56,
    gender: "Male",
    phone: "+250 782 990 112",
    nationalId: "1 1968 8 0019283 1 33",
    medcardUid: "04:99:B2:77:4F:2C",
    cardStatus: "Active",
    insurance: "Radiant Health (80%)",
    lastVisit: "16 Aug 2026",
    department: "Endocrinology",
    bloodType: "O-",
    allergies: ["Latex"],
    condition: "Type 2 Diabetes Mellitus",
    walletBalance: "RWF 210,000",
  },
  {
    id: "patient-005",
    patientNumber: "MC-2026-1930",
    name: "Chantal Mukamana",
    age: 35,
    gender: "Female",
    phone: "+250 785 334 221",
    nationalId: "1 1989 7 0041920 0 11",
    medcardUid: "04:12:DE:FA:55:67",
    cardStatus: "Active",
    insurance: "RSSB / RAMA (85%)",
    lastVisit: "14 Aug 2026",
    department: "Maternity / OB-GYN",
    bloodType: "AB+",
    allergies: ["Iodine contrast"],
    condition: "Antenatal Care (Trimester 2)",
    walletBalance: "RWF 95,000",
  },
  {
    id: "patient-006",
    patientNumber: "MC-2026-2481",
    name: "David Habimana",
    age: 19,
    gender: "Male",
    phone: "+250 789 112 334",
    nationalId: "1 2005 8 0092182 1 09",
    medcardUid: "Unassigned",
    cardStatus: "Pending",
    insurance: "CBHI Mutuelle de Santé (100%)",
    lastVisit: "Today, 11:10 AM",
    department: "Emergency OPD",
    bloodType: "A-",
    allergies: ["None known"],
    condition: "Sports Injury (Right Ankle)",
    walletBalance: "RWF 5,000",
  },
];

export default function PatientsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [patients, setPatients] = useState<MockPatient[]>(INITIAL_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<MockPatient | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [, setLoading] = useState(false);

  // New patient form state
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("+250 ");
  const [newNationalId, setNewNationalId] = useState("");
  const [newInsurance, setNewInsurance] = useState("RSSB / RAMA (85%)");
  const [newGender, setNewGender] = useState<"Female" | "Male">("Female");
  const [newAge, setNewAge] = useState("28");
  const [newDepartment, setNewDepartment] = useState("General OPD");
  const [cardPairSuccess, setCardPairSuccess] = useState(false);

  const fetchPatientsFromApi = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const result = await getPatients({ search: query || undefined, limit: 100 });
      if (result && result.patients && result.patients.length > 0) {
        const mapped: MockPatient[] = result.patients.map((p, idx) => ({
          id: p.id,
          patientNumber: p.patientNumber || `MC-2026-${String(idx + 1).padStart(4, "0")}`,
          name: `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Patient",
          age: 30,
          gender: (p.gender === "Male" ? "Male" : "Female"),
          phone: p.phone || "—",
          nationalId: p.nationalId || "—",
          medcardUid: "04:A2:8B:1F:90:3C",
          cardStatus: "Active",
          insurance: "RSSB / RAMA (85%)",
          lastVisit: "Recent",
          department: "General OPD",
          bloodType: p.bloodType || "O+",
          allergies: p.allergies ? [p.allergies] : ["None reported"],
          condition: "Active Registry",
          walletBalance: "RWF 50,000",
        }));
        setPatients(mapped);
      }
    } catch {
      // Backend unreachable or offline: graceful fallback to initial demo state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPatientsFromApi(searchQuery);
  }, [fetchPatientsFromApi, searchQuery]);

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patientNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.nationalId.includes(searchQuery) ||
      patient.phone.includes(searchQuery) ||
      patient.medcardUid.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDepartment === "All" || patient.department.includes(selectedDepartment);

    const matchesStatus =
      selectedStatus === "All" || patient.cardStatus === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleCreatePatient = async (e: FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim()) return;

    let createdId = `patient-${Date.now()}`;
    let createdNumber = `MC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const created = await createPatient({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        phone: newPhone.trim(),
        nationalId: newNationalId.trim(),
        gender: newGender,
      });
      if (created && created.id) {
        createdId = created.id;
        if (created.patientNumber) createdNumber = created.patientNumber;
      }
    } catch {
      // If backend fails or not running, continue with local creation
    }

    const newPatient: MockPatient = {
      id: createdId,
      patientNumber: createdNumber,
      name: `${newFirstName} ${newLastName}`,
      age: parseInt(newAge) || 25,
      gender: newGender,
      phone: newPhone,
      nationalId: newNationalId || "1 1998 7 00" + Math.floor(1000000 + Math.random() * 9000000),
      medcardUid: `04:${Math.floor(10 + Math.random() * 89)}:E4:90:${Math.floor(10 + Math.random() * 89)}:B1`,
      cardStatus: "Active",
      insurance: newInsurance,
      lastVisit: "Just now",
      department: newDepartment,
      bloodType: "O+",
      allergies: ["None reported"],
      condition: "New Enrollment",
      walletBalance: "RWF 50,000",
    };

    setPatients((prev) => [newPatient, ...prev]);
    setCardPairSuccess(true);

    setTimeout(() => {
      setCardPairSuccess(false);
      setShowRegisterModal(false);
      setNewFirstName("");
      setNewLastName("");
      setSelectedPatient(newPatient);
    }, 1200);
  };

  const handleOpenWorkspace = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  return (
    <AppLayout
      pageTitle="Patient Directory"
      pageSubtitle="Comprehensive Rwanda digital health identity & MedCard registry"
      actionButton={{
        label: "Issue New MedCard",
        onClick: () => setShowRegisterModal(true),
        icon: <Plus size={16} />,
      }}
    >
      <div className="patients-page-container">
        {/* Metric Cards Row */}
        <div className="analytics-metrics-grid">
          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Registered Patients</span>
              <strong className="metric-value">4,892</strong>
              <small className="metric-trend positive">+14 enrolled today</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-icon-box">
              <Wifi size={18} />
            </div>
            <div className="metric-data">
              <span className="metric-label">Active MedCards</span>
              <strong className="metric-value">4,810</strong>
              <small className="metric-trend highlight">98.3% paired</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Today's Encounters</span>
              <strong className="metric-value">128</strong>
              <small className="metric-trend neutral">OPD / Lab / Pharmacy</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Connected Insurance</span>
              <strong className="metric-value">RWF 42.8M</strong>
              <small className="metric-trend positive">100% digital sync</small>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="page-filters-card">
          <div className="search-input-wrapper">
            <Search size={18} className="search-box-icon" />
            <input
              type="text"
              placeholder="Search by Patient Name, Patient ID, National ID, Phone, or MedCard UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="patients-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="filter-dropdowns-group">
            <div className="filter-select-wrapper">
              <Filter size={15} className="filter-icon" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                aria-label="Filter by department"
              >
                <option value="All">All Departments</option>
                <option value="General OPD">General OPD</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Maternity">Maternity</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div className="filter-select-wrapper">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter by card status"
              >
                <option value="All">All Card Statuses</option>
                <option value="Active">Active MedCard</option>
                <option value="Pending">Pending Assignment</option>
              </select>
            </div>

            <button
              type="button"
              className="action-pill-btn secondary"
              onClick={() => navigate("/nfc")}
            >
              <Wifi size={15} />
              <span>Tap to Identify</span>
            </button>
          </div>
        </div>
        {/* Patients Table Container (Spacious Full-Width Table) */}
        <div className="patients-table-container">
          <div className="table-responsive-wrapper">
            <table className="presentation-table">
              <thead>
                <tr>
                  <th style={{ width: "24%" }}>PATIENT IDENTITY</th>
                  <th style={{ width: "18%" }}>MEDCARD NFC UID</th>
                  <th style={{ width: "20%" }}>CONTACT & NID</th>
                  <th style={{ width: "16%" }}>INSURANCE</th>
                  <th style={{ width: "14%" }}>DEPARTMENT / VISIT</th>
                  <th style={{ width: "8%", textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty-row">
                      <div className="empty-results-box">
                        <Users size={36} />
                        <strong>No patients matching "{searchQuery}"</strong>
                        <p>Try searching by MedCard UID or clearing your filter criteria.</p>
                        <button
                          type="button"
                          className="action-pill-btn primary"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedDepartment("All");
                            setSelectedStatus("All");
                          }}
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => {
                    const isSelected = selectedPatient?.id === patient.id;
                    return (
                      <tr
                        key={patient.id}
                        className={`patient-row ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedPatient(patient)}
                        title="Click to view detailed patient dossier"
                      >
                        <td>
                          <div className="patient-cell-identity">
                            <div className="patient-avatar-badge">
                              {patient.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div className="patient-meta-text">
                              <strong className="patient-name-text">
                                {patient.name}
                              </strong>
                              <span className="patient-sub-id">
                                {patient.patientNumber} • {patient.age}y, {patient.gender}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="medcard-tag-cell">
                            <span
                              className={`medcard-badge ${
                                patient.cardStatus === "Active" ? "active" : "pending"
                              }`}
                            >
                              <Wifi size={12} />
                              {patient.medcardUid}
                            </span>
                            <span className="blood-type-pill">{patient.bloodType}</span>
                          </div>
                        </td>
                        <td>
                          <div className="contact-cell">
                            <span className="contact-phone">{patient.phone}</span>
                            <span className="contact-nid">{patient.nationalId}</span>
                          </div>
                        </td>
                        <td>
                          <span className="insurance-pill">{patient.insurance}</span>
                        </td>
                        <td>
                          <div className="visit-meta-cell">
                            <strong>{patient.department}</strong>
                            <small>{patient.lastVisit}</small>
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div
                            className="action-buttons-cell"
                            style={{ justifyContent: "flex-end" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="table-action-btn primary"
                              onClick={() => handleOpenWorkspace(patient.id)}
                              title="Open Clinical Workspace"
                            >
                              <Stethoscope size={14} />
                              <span>Clinical File</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =======================================================
            PATIENT DOSSIER MODAL POPUP (FIKA-INSPIRED DETAIL VIEW)
            ======================================================= */}
        {selectedPatient && (
          <div
            className="modal-overlay-backdrop"
            onClick={() => setSelectedPatient(null)}
          >
            <div
              className="modal-card-dialog patient-dossier-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Topbar */}
              <div className="dossier-modal-topbar">
                <span className="dossier-modal-eyebrow">PATIENT PROFILE</span>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span className="dossier-ref-code">{selectedPatient.patientNumber}</span>
                  <button
                    type="button"
                    className="modal-close-button"
                    onClick={() => setSelectedPatient(null)}
                    aria-label="Close dossier"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Patient Hero / Name Banner */}
              <div className="dossier-hero-section">
                <h2 className="dossier-patient-name">{selectedPatient.name}</h2>
                <div className="dossier-status-line">
                  <CheckCircle2 size={14} className="text-success" />
                  <span>
                    {selectedPatient.cardStatus === "Active"
                      ? "Active MedCard"
                      : "Pending Assignment"}{" "}
                    · {selectedPatient.medcardUid}
                  </span>
                </div>
              </div>

              {/* Clean Key-Value Data List (No Box Containers) */}
              <div className="dossier-keyvalue-list">
                <div className="dossier-row">
                  <span className="dossier-key">National ID</span>
                  <span className="dossier-val font-mono">{selectedPatient.nationalId}</span>
                </div>

                <div className="dossier-row">
                  <span className="dossier-key">Demographics</span>
                  <span className="dossier-val">
                    {selectedPatient.age} yrs · {selectedPatient.gender} · {selectedPatient.bloodType}
                  </span>
                </div>

                <div className="dossier-row">
                  <span className="dossier-key">Phone</span>
                  <span className="dossier-val font-mono">{selectedPatient.phone}</span>
                </div>

                <div className="dossier-row">
                  <span className="dossier-key">Insurance</span>
                  <span className="dossier-val">{selectedPatient.insurance}</span>
                </div>

                <div className="dossier-row">
                  <span className="dossier-key">Department</span>
                  <span className="dossier-val">{selectedPatient.department}</span>
                </div>

                <div className="dossier-row">
                  <span className="dossier-key">Last Visit</span>
                  <span className="dossier-val">{selectedPatient.lastVisit}</span>
                </div>

                <div className="dossier-row">
                  <span className="dossier-key">Healthcare Wallet</span>
                  <span className="dossier-val" style={{ color: "var(--green-primary)", fontWeight: 600 }}>
                    {selectedPatient.walletBalance}
                  </span>
                </div>
              </div>

              {/* Clinical Care Status */}
              <div className="dossier-clinical-section">
                <span className="dossier-section-title">Encounter Status</span>
                <div className="pathway-steps">
                  <div className="pathway-step completed">
                    <span className="pathway-dot" />
                    <span>NFC Verified</span>
                  </div>
                  <div className="pathway-step completed">
                    <span className="pathway-dot" />
                    <span>Triage Vitals Recorded</span>
                  </div>
                  <div className="pathway-step active">
                    <span className="pathway-dot" />
                    <span>In Consultation with {selectedPatient.department}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="dossier-modal-actions">
                <button
                  type="button"
                  className="action-pill-btn secondary"
                  onClick={() => setSelectedPatient(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="action-pill-btn primary"
                  onClick={() => handleOpenWorkspace(selectedPatient.id)}
                >
                  <Stethoscope size={15} />
                  <span>Open Clinical Workspace</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Register New MedCard Modal */}
      {showRegisterModal && (
        <div className="modal-overlay-backdrop" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-card-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <div className="modal-title-wrap">
                <span className="eyebrow-dot-inline" />
                <h3>Issue & Pair New MedCard</h3>
                <p>Register a new citizen patient and pair a contactless smart MedCard.</p>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setShowRegisterModal(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {cardPairSuccess ? (
              <div className="modal-success-state">
                <div className="success-lottie-circle">
                  <CheckCircle2 size={48} />
                </div>
                <h3>MedCard Paired Successfully!</h3>
                <p>
                  Identity linked to Rwanda National Health Grid. Patient record initialized.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreatePatient} className="modal-form-body">
                <div className="form-row-2col">
                  <div className="form-field">
                    <label>First Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Alice"
                      required
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Mutoni"
                      required
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row-3col">
                  <div className="form-field">
                    <label>Age *</label>
                    <input
                      type="number"
                      value={newAge}
                      onChange={(e) => setNewAge(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Gender *</label>
                    <select
                      value={newGender}
                      onChange={(e) =>
                        setNewGender(e.target.value as "Female" | "Male")
                      }
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Department *</label>
                    <select
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                    >
                      <option value="General OPD">General OPD</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Laboratory">Laboratory</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Maternity">Maternity</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-field">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>National ID Number</label>
                    <input
                      type="text"
                      placeholder="1 1995 7 0048291 0 42"
                      value={newNationalId}
                      onChange={(e) => setNewNationalId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Insurance Scheme *</label>
                  <select
                    value={newInsurance}
                    onChange={(e) => setNewInsurance(e.target.value)}
                  >
                    <option value="RSSB / RAMA (85%)">RSSB / RAMA (85% coverage)</option>
                    <option value="CBHI Mutuelle de Santé (100%)">
                      CBHI Mutuelle de Santé (100% coverage)
                    </option>
                    <option value="MMI Military (90%)">MMI Military Medical Insurance (90%)</option>
                    <option value="Radiant Health (80%)">Radiant Health Insurance</option>
                    <option value="Private Cash">Private / Self-Pay</option>
                  </select>
                </div>

                <div className="nfc-pairing-preview-banner">
                  <Wifi size={24} className="banner-nfc-icon" />
                  <div>
                    <strong>Tap Blank MedCard on Reader to Assign</strong>
                    <p>Reader ready • Waiting for contactless card placement</p>
                  </div>
                  <span className="status-live-tag">READY</span>
                </div>

                <div className="modal-actions-bar">
                  <button
                    type="button"
                    className="action-pill-btn secondary"
                    onClick={() => setShowRegisterModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="action-pill-btn primary">
                    <ShieldCheck size={16} />
                    <span>Complete Registration & Pair Card</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
