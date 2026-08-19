import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import FacilityLoginPage from "./pages/FacilityLoginPage";
import LoginPage from "./pages/LoginPage";

import DashboardPage from "./pages/DashboardPage";
import NFCScannerPage from "./pages/NFCScannerPage";
import PatientsPage from "./pages/PatientsPage";
import PatientWorkspacePage from "./pages/PatientWorkspacePage";
import AppointmentsPage from "./pages/AppointmentsPage";
import MedicalRecordsPage from "./pages/MedicalRecordsPage";
import LaboratoryWorkspacePage from "./pages/LaboratoryWorkspacePage";
import PharmacyWorkspacePage from "./pages/PharmacyWorkspacePage";
import PaymentWorkspacePage from "./pages/PaymentWorkspacePage";
import PatientRegistrationPage from "./pages/PatientRegistrationPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================
            PUBLIC MEDCARD LANDING PAGE
        ====================================================== */}
        <Route path="/" element={<LandingPage />} />

        {/* =====================================================
            PATIENT REGISTRATION
            New patient + NFC card linking
        ====================================================== */}

        <Route
          path="/register-patient"
          element={
            <PatientRegistrationPage />
          }
        />


        {/* =====================================================
            FACILITY ACCESS
        ====================================================== */}
        <Route path="/facility-login" element={<FacilityLoginPage />} />

        {/* =====================================================
            STAFF / ROLE LOGIN
        ====================================================== */}
        <Route path="/login" element={<LoginPage />} />

        {/* =====================================================
            MAIN DASHBOARD
        ====================================================== */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* =====================================================
            NFC PATIENT IDENTIFICATION
        ====================================================== */}
        <Route path="/nfc" element={<NFCScannerPage />} />

        {/* =====================================================
            PATIENTS REGISTRY & DIRECTORY
        ====================================================== */}
        <Route path="/patients" element={<PatientsPage />} />

        {/* =====================================================
            PATIENT WORKSPACE (SINGLE PATIENT)
        ====================================================== */}
        <Route
          path="/patients/:patientId"
          element={<PatientWorkspacePage />}
        />

        {/* =====================================================
            APPOINTMENTS & QUEUE
        ====================================================== */}
        <Route path="/appointments" element={<AppointmentsPage />} />

        {/* =====================================================
            MEDICAL RECORDS EXPLORER
        ====================================================== */}
        <Route path="/medical-records" element={<MedicalRecordsPage />} />

        {/* =====================================================
            LABORATORY WORKSPACE
        ====================================================== */}
        <Route
          path="/laboratory"
          element={<LaboratoryWorkspacePage />}
        />

        {/* =====================================================
            PHARMACY WORKSPACE
        ====================================================== */}
        <Route path="/pharmacy" element={<PharmacyWorkspacePage />} />

        {/* =====================================================
            PAYMENT WORKSPACE
        ====================================================== */}
        <Route path="/payment" element={<PaymentWorkspacePage />} />

        {/* =====================================================
            SETTINGS & DIAGNOSTICS
        ====================================================== */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* =====================================================
            FALLBACK
        ====================================================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;