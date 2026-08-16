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
  Radio,
  CreditCard as CardIcon,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import PatientIdentificationPanel from "../components/nfc/PatientIdentificationPanel";
import { socket } from "../services/socket";


type NfcDashboardState =
  | "waiting"
  | "identified"
  | "not-registered"
  | "not-allowed"
  | "error";


function DashboardPage() {
  const navigate = useNavigate();

  const [nfcState, setNfcState] =
    useState<NfcDashboardState>("waiting");


  /*
  |--------------------------------------------------------------------------
  | NFC REAL-TIME STATE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handlePatientIdentified = () => {
      setNfcState("identified");
    };


    const handleIdentificationFailed = (response: {
      success: boolean;
      code?: string;
    }) => {
      if (response.code === "CARD_NOT_REGISTERED") {
        setNfcState("not-registered");
        return;
      }

      if (response.code === "CARD_NOT_ALLOWED") {
        setNfcState("not-allowed");
        return;
      }

      setNfcState("error");
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
  |
  | The large NFC visual and empty activity panel are shown
  | ONLY while the system is waiting for a card.
  |
  */

  const showWaitingExperience =
    nfcState === "waiting";


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
            onClick={() => navigate("/nfc")}
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
            onClick={() => navigate("/login")}
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

        {/* TOP BAR */}

        <header className="topbar">

          <div>

            <span className="eyebrow">
              RECEPTION WORKSPACE
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
                R
              </div>

              <div>

                <strong>
                  Reception
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

          {/* PAGE INTRO */}

          <div className="welcome-row">

            <div>

              <span className="eyebrow">
                PATIENT IDENTIFICATION
              </span>

              <h2>
                Reception Dashboard
              </h2>

              <p>
                Identify patients using the connected
                MedCard reader.
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
              NFC TAP VISUAL
              ONLY VISIBLE BEFORE A CARD IS TAPPED
          ================================================== */}

          
              
           

          {/* =================================================
              EMPTY ACTIVITY
              ONLY VISIBLE BEFORE FIRST CARD TAP
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