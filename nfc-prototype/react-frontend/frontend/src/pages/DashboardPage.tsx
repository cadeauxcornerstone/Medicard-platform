import { useEffect, useState } from "react";

import {
  Activity,
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  Bell,
  Search,
  Wifi,
  UserRoundPlus,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import PatientIdentificationPanel from "../components/nfc/PatientIdentificationPanel";
import { socket } from "../services/socket";


type Role =
  | "Reception"
  | "Doctor"
  | "Nurse"
  | "Laboratory"
  | "Pharmacy"
  | "Cashier";


type NfcDashboardState =
  | "waiting"
  | "identified"
  | "not-registered"
  | "not-allowed"
  | "error";


const CURRENT_ROLE_KEY =
  "medcard_current_role";


function DashboardPage() {

  const navigate = useNavigate();


  /*
  |--------------------------------------------------------------------------
  | CURRENT PROTOTYPE ROLE
  |--------------------------------------------------------------------------
  */

  const [currentRole, setCurrentRole] =
    useState<Role>(() => {

      const storedRole =
        localStorage.getItem(
          CURRENT_ROLE_KEY
        );

      if (
        storedRole === "Reception" ||
        storedRole === "Doctor" ||
        storedRole === "Nurse" ||
        storedRole === "Laboratory" ||
        storedRole === "Pharmacy" ||
        storedRole === "Cashier"
      ) {
        return storedRole;
      }

      return "Reception";
    });


  /*
  |--------------------------------------------------------------------------
  | NFC STATE
  |--------------------------------------------------------------------------
  */

  const [nfcState, setNfcState] =
    useState<NfcDashboardState>(
      "waiting"
    );


  /*
  |--------------------------------------------------------------------------
  | KEEP ROLE IN SYNC
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const storedRole =
      localStorage.getItem(
        CURRENT_ROLE_KEY
      );

    if (
      storedRole === "Reception" ||
      storedRole === "Doctor" ||
      storedRole === "Nurse" ||
      storedRole === "Laboratory" ||
      storedRole === "Pharmacy" ||
      storedRole === "Cashier"
    ) {
      setCurrentRole(storedRole);
    }

  }, []);


  /*
  |--------------------------------------------------------------------------
  | NFC REAL-TIME STATE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const handlePatientIdentified =
      () => {

        setNfcState(
          "identified"
        );

      };


    const handleIdentificationFailed =
      (response: {
        success: boolean;
        code?: string;
      }) => {

        if (
          response.code ===
          "CARD_NOT_REGISTERED"
        ) {

          setNfcState(
            "not-registered"
          );

          return;
        }


        if (
          response.code ===
          "CARD_NOT_ALLOWED"
        ) {

          setNfcState(
            "not-allowed"
          );

          return;
        }


        setNfcState(
          "error"
        );

      };


    socket.on(
      "patient:identified",
      handlePatientIdentified
    );

    socket.on(
      "card:identification-failed",
      handleIdentificationFailed
    );


    return () => {

      socket.off(
        "patient:identified",
        handlePatientIdentified
      );

      socket.off(
        "card:identification-failed",
        handleIdentificationFailed
      );

    };

  }, []);


  /*
  |--------------------------------------------------------------------------
  | WAITING STATE
  |--------------------------------------------------------------------------
  */

  const showWaitingExperience =
    nfcState === "waiting";


  /*
  |--------------------------------------------------------------------------
  | ROLE LABEL
  |--------------------------------------------------------------------------
  */

  const roleLabel =
    currentRole.toUpperCase();


  return (

    <div className="dashboard-layout">


      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">


        <div className="sidebar-brand">

          <div className="brand-mark small">

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


        <div className="sidebar-section">

          <span className="sidebar-label">
            WORKSPACE
          </span>


          <button
            type="button"
            className="sidebar-item active"
          >

            <LayoutDashboard size={19} />

            Dashboard

          </button>


          <button
            type="button"
            className="sidebar-item"
          >

            <Users size={19} />

            Patients

          </button>


          <button
            type="button"
            className="sidebar-item"
            onClick={() =>
              navigate("/nfc")
            }
          >

            <Wifi size={19} />

            NFC Scanner

          </button>


          <button
            type="button"
            className="sidebar-item"
          >

            <CalendarDays size={19} />

            Appointments

          </button>


          <button
            type="button"
            className="sidebar-item"
          >

            <FileText size={19} />

            Medical Records

          </button>


          <button
            type="button"
            className="sidebar-item"
          >

            <CreditCard size={19} />

            Payments

          </button>

        </div>


        <div className="sidebar-bottom">


          <button
            type="button"
            className="sidebar-item"
          >

            <Settings size={19} />

            Settings

          </button>


          <button
            type="button"
            className="sidebar-item logout"
            onClick={() => {

              localStorage.removeItem(
                CURRENT_ROLE_KEY
              );

              navigate("/login");

            }}
          >

            <LogOut size={19} />

            Sign out

          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="dashboard-main">


        {/* ===================================================
            TOP BAR
        ==================================================== */}

        <header className="topbar">


          <div>

            <span className="eyebrow">

              {roleLabel} WORKSPACE

            </span>


            <h1>
              MedCard Dashboard
            </h1>

          </div>


          <div className="topbar-actions">


            <button
              type="button"
              className="icon-button"
              aria-label="Search"
            >

              <Search size={19} />

            </button>


            <button
              type="button"
              className="icon-button"
              aria-label="Notifications"
            >

              <Bell size={19} />

            </button>


            <div className="user-profile">


              <div className="avatar">

                {currentRole
                  .charAt(0)
                  .toUpperCase()}

              </div>


              <div>

                <strong>
                  {currentRole}
                </strong>


                <small>
                  Current workspace
                </small>

              </div>

            </div>

          </div>

        </header>


        {/* =====================================================
            DASHBOARD CONTENT
        ====================================================== */}

        <section className="dashboard-content">


          {/* =================================================
              PAGE INTRO
          ================================================== */}

          <div className="welcome-row">


            <div>

              <span className="eyebrow">

                {currentRole ===
                "Reception"
                  ? "PATIENT IDENTIFICATION"
                  : `${roleLabel} WORKSPACE`}

              </span>


              <h2>

                {currentRole ===
                "Reception"
                  ? "Reception Dashboard"
                  : `${currentRole} Dashboard`}

              </h2>


              <p>

                {currentRole ===
                "Reception"
                  ? "Identify patients using the connected MedCard reader."
                  : `Manage your ${currentRole.toLowerCase()} workflow through the MedCard platform.`}

              </p>

            </div>


            <div className="system-status">

              <span className="status-dot" />

              System operational

            </div>

          </div>


          {/* =================================================
    EXISTING PATIENT IDENTIFICATION PANEL
================================================== */}

<PatientIdentificationPanel />


{/* =================================================
    RECEPTION — REGISTER NEW PATIENT
================================================== */}

{currentRole === "Reception" && (

  <section className="reception-registration-action">

    <div className="reception-registration-content">

      <div className="reception-registration-icon">

        <UserRoundPlus
          size={22}
        />

      </div>


      <div>

        <span className="eyebrow">
          NEW PATIENT
        </span>


        <h3>
          Register a new patient
        </h3>


        <p>
          Register a patient and automatically
          link a new MedCard using the NFC reader.
        </p>

      </div>

    </div>


    <button
      type="button"
      className="reception-registration-button"
      onClick={() =>
        navigate("/register-patient")
      }
    >

      <UserRoundPlus
        size={18}
      />

      Register New Patient

    </button>

  </section>

)}


{/* =================================================
    NFC ACTIVITY
================================================== */}




          

          {showWaitingExperience && (

            <section className="dashboard-panels nfc-empty-activity">


              <div className="panel full-width-panel">


                <div className="panel-header">


                  <div>

                    <span className="eyebrow">

                      NFC ACTIVITY

                    </span>


                    <h3>

                      Recent card activity

                    </h3>

                  </div>

                </div>


                <div className="empty-state">


                  <div className="empty-state-icon">

                    <Wifi size={27} />

                  </div>


                  <strong>

                    No card activity yet

                  </strong>


                  <p>

                    NFC identification events will
                    appear here after a MedCard is
                    tapped on the reader.

                  </p>

                </div>

              </div>

            </section>

          )}

        </section>

      </main>

    </div>

  );
}


export default DashboardPage;