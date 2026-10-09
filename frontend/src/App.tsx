import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import CompanyLandingPage from "./pages/CompanyLandingPage";
import NFCLandingPage from "./pages/NFCLandingPage";
import PatientVaultPage from "./pages/PatientVaultPage";
import PatientVaultLoginPage from "./pages/PatientVaultLoginPage";
import VaultPortalPage from "./pages/VaultPortalPage";
import FacilityLoginPage from "./pages/FacilityLoginPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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
import TopUpPage from "./pages/TopUpPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================
            COMPANY LANDING PAGE
        ====================================================== */}
        <Route path="/" element={<CompanyLandingPage />} />

        {/* =====================================================
            NFC CARD LANDING PAGE
        ====================================================== */}
        <Route path="/nfc" element={<NFCLandingPage />} />

        {/* =====================================================
            PATIENT VAULT
        ====================================================== */}
        <Route path="/patient-vault" element={<PatientVaultPage />} />
        <Route path="/patient-vault/login" element={<PatientVaultLoginPage />} />

        {/* =====================================================
            VAULT PORTAL
        ====================================================== */}
        <Route path="/vault-portal" element={<VaultPortalPage />} />

        {/* =====================================================
            PATIENT REGISTRATION
        ====================================================== */}
        <Route
          path="/register-patient"
          element={
            <ProtectedRoute>
              <PatientRegistrationPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            FACILITY ACCESS
        ====================================================== */}
        <Route
          path="/facility-login"
          element={<FacilityLoginPage />}
        />

        {/* =====================================================
            STAFF / ROLE LOGIN
        ====================================================== */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* =====================================================
            MAIN DASHBOARD
        ====================================================== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            NFC PATIENT IDENTIFICATION
        ====================================================== */}
        <Route
          path="/nfc/scan"
          element={
            <ProtectedRoute>
              <NFCScannerPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            PATIENTS REGISTRY & DIRECTORY
        ====================================================== */}
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <PatientsPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            PATIENT WORKSPACE
        ====================================================== */}
        <Route
          path="/patients/:patientId"
          element={
            <ProtectedRoute>
              <PatientWorkspacePage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            APPOINTMENTS & QUEUE
        ====================================================== */}
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            MEDICAL RECORDS EXPLORER
        ====================================================== */}
        <Route
          path="/medical-records"
          element={
            <ProtectedRoute>
              <MedicalRecordsPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            LABORATORY WORKSPACE
        ====================================================== */}
        <Route
          path="/laboratory"
          element={
            <ProtectedRoute>
              <LaboratoryWorkspacePage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            PHARMACY WORKSPACE
        ====================================================== */}
        <Route
          path="/pharmacy"
          element={
            <ProtectedRoute>
              <PharmacyWorkspacePage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            PAYMENT WORKSPACE
        ====================================================== */}
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentWorkspacePage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            RECEPTION WALLET TOP-UP
        ====================================================== */}
        <Route
          path="/top-up"
          element={
            <ProtectedRoute>
              <TopUpPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            SETTINGS & DIAGNOSTICS
        ====================================================== */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            FALLBACK
        ====================================================== */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;