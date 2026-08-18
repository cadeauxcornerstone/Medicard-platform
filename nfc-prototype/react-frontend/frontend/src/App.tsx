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
import PatientWorkspacePage from "./pages/PatientWorkspacePage";
import LaboratoryWorkspacePage from "./pages/LaboratoryWorkspacePage";
import PharmacyWorkspacePage from "./pages/PharmacyWorkspacePage";
import PaymentWorkspacePage from "./pages/PaymentWorkspacePage";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =====================================================
            PUBLIC MEDCARD LANDING PAGE
        ====================================================== */}

        <Route
          path="/"
          element={
            <LandingPage />
          }
        />


        {/* =====================================================
            FACILITY ACCESS
            Demo facility authentication
        ====================================================== */}

        <Route
          path="/facility-login"
          element={
            <FacilityLoginPage />
          }
        />


        {/* =====================================================
            STAFF / ROLE LOGIN
            Existing login flow
        ====================================================== */}

        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />


        {/* =====================================================
            MAIN DASHBOARD
        ====================================================== */}

        <Route
          path="/dashboard"
          element={
            <DashboardPage />
          }
        />


        {/* =====================================================
            NFC PATIENT IDENTIFICATION
        ====================================================== */}

        <Route
          path="/nfc"
          element={
            <NFCScannerPage />
          }
        />


        {/* =====================================================
            PATIENT WORKSPACE
        ====================================================== */}

        <Route
          path="/patients/:patientId"
          element={
            <PatientWorkspacePage />
          }
        />


        {/* =====================================================
            LABORATORY WORKSPACE
        ====================================================== */}

        <Route
          path="/laboratory"
          element={
            <LaboratoryWorkspacePage />
          }
        />


        {/* =====================================================
            PHARMACY WORKSPACE
        ====================================================== */}

        <Route
          path="/pharmacy"
          element={
            <PharmacyWorkspacePage />
          }
        />


        {/* =====================================================
            PAYMENT WORKSPACE
        ====================================================== */}

        <Route
          path="/payment"
          element={
            <PaymentWorkspacePage />
          }
        />


        {/* =====================================================
            FALLBACK
        ====================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;