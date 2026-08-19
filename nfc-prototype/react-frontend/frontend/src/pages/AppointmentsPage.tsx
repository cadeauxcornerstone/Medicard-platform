import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  Stethoscope,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Wifi,
  X,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  doctorName: string;
  department: string;
  timeSlot: string;
  status: "In Consultation" | "Waiting in Lobby" | "Completed" | "Scheduled" | "Cancelled";
  medcardUid: string;
  priority: "Normal" | "Urgent" | "VIP";
  notes: string;
  room: string;
}

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-101",
    patientId: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
    patientName: "Alice Mutoni",
    patientNumber: "MC-2026-0811",
    doctorName: "Dr. Solange Uwera",
    department: "General OPD",
    timeSlot: "09:00 AM - 09:30 AM",
    status: "In Consultation",
    medcardUid: "04:A2:8B:1F:90:3C",
    priority: "Normal",
    notes: "Post-operative follow up & wound dressing inspection.",
    room: "Consultation Room 3",
  },
  {
    id: "apt-102",
    patientId: "patient-002",
    patientName: "Jean Rukundo",
    patientNumber: "MC-2026-0492",
    doctorName: "Dr. Jean-Paul Kagame",
    department: "Cardiology",
    timeSlot: "09:30 AM - 10:00 AM",
    status: "Waiting in Lobby",
    medcardUid: "04:C5:1E:44:88:9A",
    priority: "Urgent",
    notes: "Elevated BP follow-up with recent ECG review.",
    room: "Cardio Wing B",
  },
  {
    id: "apt-103",
    patientId: "patient-003",
    patientName: "Keza Uwase",
    patientNumber: "MC-2026-1108",
    doctorName: "Dr. Solange Uwera",
    department: "Laboratory / Diagnostic",
    timeSlot: "10:00 AM - 10:30 AM",
    status: "Waiting in Lobby",
    medcardUid: "04:F8:33:AA:11:55",
    priority: "Normal",
    notes: "Full hematology panel & malaria smear evaluation.",
    room: "Lab Collection 1",
  },
  {
    id: "apt-104",
    patientId: "patient-004",
    patientName: "Emmanuel Ndayisaba",
    patientNumber: "MC-2026-0744",
    doctorName: "Dr. Patrick Mugabo",
    department: "Endocrinology",
    timeSlot: "11:00 AM - 11:30 AM",
    status: "Scheduled",
    medcardUid: "04:99:B2:77:4F:2C",
    priority: "Normal",
    notes: "Quarterly HbA1c review and insulin dosage calibration.",
    room: "Specialty Clinic 2",
  },
  {
    id: "apt-105",
    patientId: "patient-005",
    patientName: "Chantal Mukamana",
    patientNumber: "MC-2026-1930",
    doctorName: "Dr. Marie-Claire Gasana",
    department: "Maternity",
    timeSlot: "11:30 AM - 12:00 PM",
    status: "Scheduled",
    medcardUid: "04:12:DE:FA:55:67",
    priority: "Normal",
    notes: "Routine ANC checkup with fetal ultrasound.",
    room: "Maternity Suite 1",
  },
  {
    id: "apt-106",
    patientId: "patient-006",
    patientName: "David Habimana",
    patientNumber: "MC-2026-2481",
    doctorName: "Dr. Solange Uwera",
    department: "Emergency OPD",
    timeSlot: "08:15 AM - 08:45 AM",
    status: "Completed",
    medcardUid: "Unassigned",
    priority: "Urgent",
    notes: "Right ankle x-ray ordered and compression applied.",
    room: "Emergency Bay 2",
  },
];

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [selectedTab, setSelectedTab] = useState<"All" | "Today" | "Queue">("Today");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  // New appointment form state
  const [newPatientName, setNewPatientName] = useState("");
  const [newDoctor, setNewDoctor] = useState("Dr. Solange Uwera");
  const [newDepartment, setNewDepartment] = useState("General OPD");
  const [newTime, setNewTime] = useState("02:00 PM - 02:30 PM");
  const [newNotes, setNewNotes] = useState("");
  const [newPriority, setNewPriority] = useState<"Normal" | "Urgent" | "VIP">("Normal");

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patientNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      departmentFilter === "All" || apt.department.includes(departmentFilter);

    if (selectedTab === "Queue") {
      return (
        matchesSearch &&
        matchesDept &&
        (apt.status === "Waiting in Lobby" || apt.status === "In Consultation")
      );
    }

    return matchesSearch && matchesDept;
  });

  const handleCreateAppointment = (e: FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: "ac844b2b-cc1b-45a4-9404-e059fdd6df0b",
      patientName: newPatientName,
      patientNumber: `MC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      doctorName: newDoctor,
      department: newDepartment,
      timeSlot: newTime,
      status: "Waiting in Lobby",
      medcardUid: `04:${Math.floor(10 + Math.random() * 89)}:E4:90:${Math.floor(10 + Math.random() * 89)}:B1`,
      priority: newPriority,
      notes: newNotes || "Walk-in registration booked via Reception.",
      room: "Consultation Room 2",
    };

    setAppointments([newApt, ...appointments]);
    setShowModal(false);
    setNewPatientName("");
    setNewNotes("");
  };

  const handleStatusChange = (id: string, newStatus: Appointment["status"]) => {
    setAppointments(
      appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  return (
    <AppLayout
      pageTitle="Appointments & Queue"
      pageSubtitle="Real-time patient flow, scheduling & consultation tracking"
      actionButton={{
        label: "Book Appointment",
        onClick: () => setShowModal(true),
        icon: <Plus size={16} />,
      }}
    >
      <div className="appointments-page-container">
        {/* Metric Cards Row */}
        <div className="analytics-metrics-grid">
          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Today's Scheduled</span>
              <strong className="metric-value">46</strong>
              <small className="metric-trend positive">94% attendance rate</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Waiting in Lobby</span>
              <strong className="metric-value">
                {appointments.filter((a) => a.status === "Waiting in Lobby").length} Patients
              </strong>
              <small className="metric-trend highlight">Avg. wait 12 mins</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">In Consultation</span>
              <strong className="metric-value">
                {appointments.filter((a) => a.status === "In Consultation").length} Active
              </strong>
              <small className="metric-trend positive">4 doctors on duty</small>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-data">
              <span className="metric-label">Completed Today</span>
              <strong className="metric-value">
                {appointments.filter((a) => a.status === "Completed").length} Finished
              </strong>
              <small className="metric-trend neutral">All records synced</small>
            </div>
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="page-filters-card">
          <div className="tab-pill-group">
            <button
              type="button"
              className={`tab-pill-item ${selectedTab === "Today" ? "active" : ""}`}
              onClick={() => setSelectedTab("Today")}
            >
              Today's Schedule
            </button>
            <button
              type="button"
              className={`tab-pill-item ${selectedTab === "Queue" ? "active" : ""}`}
              onClick={() => setSelectedTab("Queue")}
            >
              Live Lobby Queue
            </button>
            <button
              type="button"
              className={`tab-pill-item ${selectedTab === "All" ? "active" : ""}`}
              onClick={() => setSelectedTab("All")}
            >
              All Appointments
            </button>
          </div>

          <div className="filter-dropdowns-group">
            <div className="search-input-wrapper">
              <Search size={16} className="search-box-icon" />
              <input
                type="text"
                placeholder="Search patient, doctor, or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="patients-search-input"
              />
            </div>

            <div className="filter-select-wrapper">
              <Filter size={15} className="filter-icon" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                aria-label="Filter by department"
              >
                <option value="All">All Departments</option>
                <option value="General OPD">General OPD</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Maternity">Maternity</option>
              </select>
            </div>

            <button
              type="button"
              className="action-pill-btn secondary"
              onClick={() => navigate("/nfc")}
            >
              <Wifi size={15} />
              <span>NFC Check-In</span>
            </button>
          </div>
        </div>

        {/* Appointments List View */}
        <div className="appointments-list-grid">
          {filteredAppointments.length === 0 ? (
            <div className="empty-results-box full-width">
              <CalendarDays size={42} />
              <strong>No appointments found</strong>
              <p>No appointments match your active tab or search query.</p>
              <button
                type="button"
                className="action-pill-btn primary"
                onClick={() => {
                  setSearchQuery("");
                  setDepartmentFilter("All");
                  setSelectedTab("Today");
                }}
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            filteredAppointments.map((apt) => {
              const statusClass =
                apt.status === "In Consultation"
                  ? "status-in-consult"
                  : apt.status === "Waiting in Lobby"
                  ? "status-waiting"
                  : apt.status === "Completed"
                  ? "status-completed"
                  : "status-scheduled";

              return (
                <div key={apt.id} className="appointment-card-item">
                  <div className="appointment-card-header">
                    <div className="appointment-time-badge">
                      <Clock size={14} />
                      <span>{apt.timeSlot}</span>
                    </div>
                    <span className={`status-badge-pill ${statusClass}`}>
                      <span className="dot" />
                      {apt.status}
                    </span>
                  </div>

                  <div className="appointment-patient-row">
                    <div className="patient-avatar-badge">
                      {apt.patientName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="patient-info">
                      <strong>{apt.patientName}</strong>
                      <div className="patient-sub-meta">
                        <span>{apt.patientNumber}</span>
                        <span>•</span>
                        <span className="medcard-tag">
                          <Wifi size={11} />
                          {apt.medcardUid}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="appointment-details-box">
                    <div className="detail-field">
                      <span className="label">ATTENDING PHYSICIAN</span>
                      <strong className="value doctor">{apt.doctorName}</strong>
                    </div>
                    <div className="detail-field">
                      <span className="label">DEPARTMENT & ROOM</span>
                      <strong className="value">
                        {apt.department} • {apt.room}
                      </strong>
                    </div>
                  </div>

                  <p className="appointment-clinical-notes">{apt.notes}</p>

                  <div className="appointment-actions-footer">
                    <button
                      type="button"
                      className="action-pill-btn primary small"
                      onClick={() => navigate(`/patients/${apt.patientId}`)}
                    >
                      <Stethoscope size={14} />
                      <span>Open Workspace</span>
                    </button>

                    {apt.status === "Waiting in Lobby" && (
                      <button
                        type="button"
                        className="action-pill-btn secondary small"
                        onClick={() => handleStatusChange(apt.id, "In Consultation")}
                      >
                        <span>Call into Room</span>
                      </button>
                    )}

                    {apt.status === "In Consultation" && (
                      <button
                        type="button"
                        className="action-pill-btn green small"
                        onClick={() => handleStatusChange(apt.id, "Completed")}
                      >
                        <CheckCircle2 size={14} />
                        <span>Finish Encounter</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Book New Appointment Modal */}
      {showModal && (
        <div className="modal-overlay-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <div className="modal-title-wrap">
                <span className="eyebrow-dot-inline" />
                <h3>Schedule New Clinical Encounter</h3>
                <p>Assign a patient slot to a doctor or department queue.</p>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="modal-form-body">
              <div className="form-field">
                <label>Patient Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Alice Mutoni or Jean Rukundo"
                  required
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                />
              </div>

              <div className="form-row-2col">
                <div className="form-field">
                  <label>Department *</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                  >
                    <option value="General OPD">General OPD</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Laboratory">Laboratory Services</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Attending Doctor *</label>
                  <select
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                  >
                    <option value="Dr. Solange Uwera">Dr. Solange Uwera (OPD)</option>
                    <option value="Dr. Jean-Paul Kagame">Dr. Jean-Paul Kagame (Cardio)</option>
                    <option value="Dr. Patrick Mugabo">Dr. Patrick Mugabo (Endo)</option>
                    <option value="Dr. Marie-Claire Gasana">Dr. Marie-Claire Gasana (OB-GYN)</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-field">
                  <label>Time Slot *</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={(e) =>
                      setNewPriority(e.target.value as "Normal" | "Urgent" | "VIP")
                    }
                  >
                    <option value="Normal">Normal Routine</option>
                    <option value="Urgent">Urgent / Priority</option>
                    <option value="VIP">VIP Fast-Track</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>Reason / Chief Complaint</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Follow-up consultation, diagnostic report review, blood test..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="action-pill-btn secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="action-pill-btn primary">
                  <CheckCircle2 size={15} />
                  <span>Confirm Booking & Notify Queue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
