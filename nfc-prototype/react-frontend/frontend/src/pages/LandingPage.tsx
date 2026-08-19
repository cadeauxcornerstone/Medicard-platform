import {
  Activity,
  ArrowRight,
  CreditCard,
  FileText,
  FlaskConical,
  HeartPulse,
  Menu,
  ShieldCheck,
  Stethoscope,
  WalletCards,
  Wifi,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const goToFacilityPortal = () => {
    navigate("/facility-login");
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="medcard-landing">

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <header className="landing-nav">

        <div className="landing-nav-inner">

          <button
            type="button"
            className="landing-brand"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >

            <span className="landing-brand-mark">
              <Activity
                size={21}
                strokeWidth={2.6}
              />
            </span>

            <span className="landing-brand-name">
              Med<span>Card</span>
            </span>

          </button>


          <nav className="landing-nav-links">
            <a href="#problem">Problem</a>
            <a href="#solution">Solution</a>
            <a href="#services">Services</a>
            <a href="#payment">Payments</a>
            <a
              href="#patients"
              onClick={(e) => {
                e.preventDefault();
                navigate("/patients");
              }}
            >
              Patient Registry
            </a>
            <a href="#contact">Contact</a>
          </nav>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="landing-secondary-button"
              style={{ minHeight: "37px", padding: "0 12px" }}
              onClick={() => navigate("/dashboard")}
            >
              Live Dashboard
            </button>

            <button
              type="button"
              className="landing-nav-cta"
              onClick={goToFacilityPortal}
            >
              Facility Portal
              <ArrowRight size={14} />
            </button>
          </div>


          <button
            type="button"
            className="landing-mobile-menu"
            onClick={() =>
              setMenuOpen(
                (value) => !value
              )
            }
            aria-label="Toggle navigation"
          >

            {menuOpen ? (
              <X size={21} />
            ) : (
              <Menu size={21} />
            )}

          </button>

        </div>


        {menuOpen && (

          <div className="landing-mobile-nav">

            <a
              href="#problem"
              onClick={closeMenu}
            >
              Problem
            </a>

            <a
              href="#solution"
              onClick={closeMenu}
            >
              Solution
            </a>

            <a
              href="#services"
              onClick={closeMenu}
            >
              Services
            </a>

            <a
              href="#payment"
              onClick={closeMenu}
            >
              Payments
            </a>

            <a
              href="#contact"
              onClick={closeMenu}
            >
              Contact
            </a>

            <button
              type="button"
              onClick={() => {
                closeMenu();
                goToFacilityPortal();
              }}
            >
              Authorized Facility Login
              <ArrowRight size={15} />
            </button>

          </div>

        )}

      </header>


      {/* =====================================================
          HERO
      ====================================================== */}

      <main>

        <section className="landing-hero">

          <div className="landing-hero-grid">

            <div className="landing-hero-copy">

              <div className="landing-eyebrow">

                <span className="landing-eyebrow-dot" />

                RWANDA DIGITAL HEALTH INFRASTRUCTURE

              </div>


              <h1>
                One patient.
                <br />
                One identity.
                <br />
                <span>Every facility.</span>
              </h1>


              <p className="landing-hero-description">
                MedCard connects patient identity,
                medical records and healthcare
                payments into one secure experience
                across participating facilities.
              </p>


              <div className="landing-hero-actions" style={{ flexWrap: "wrap", gap: "10px" }}>
                <button
                  type="button"
                  className="landing-primary-button"
                  onClick={() => navigate("/dashboard")}
                >
                  Launch Interactive Demo
                  <ArrowRight size={17} />
                </button>

                <button
                  type="button"
                  className="landing-secondary-button"
                  style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}
                  onClick={() => navigate("/nfc")}
                >
                  <Wifi size={15} />
                  <span>Scan MedCard</span>
                </button>

                <button
                  type="button"
                  className="landing-secondary-button"
                  onClick={goToFacilityPortal}
                >
                  Facility Login
                </button>
              </div>


              <div className="landing-hero-trust">

                <div>

                  <ShieldCheck size={15} />

                  Secure identity

                </div>

                <div>

                  <FileText size={15} />

                  Connected records

                </div>

                <div>

                  <WalletCards size={15} />

                  Digital payments

                </div>

              </div>

            </div>


            {/* =================================================
                HERO PRODUCT VISUAL
            ================================================== */}

            <div className="landing-hero-visual">

              <div className="landing-orbit orbit-one" />
              <div className="landing-orbit orbit-two" />


              <div className="landing-card-scene">

                <div className="landing-card-shadow" />


                <div className="landing-medcard">

                  <div className="landing-card-top">

                    <span className="landing-card-chip">

                      <span />
                      <span />
                      <span />

                    </span>

                    <span className="landing-card-contactless">
                      ))))
                    </span>

                  </div>


                  <div className="landing-card-logo">
                    Med<span>Card</span>
                  </div>


                  <div className="landing-card-label">
                    DIGITAL HEALTH IDENTITY
                  </div>


                  <div className="landing-card-bottom">

                    <div>

                      <small>
                        PATIENT ID
                      </small>

                      <strong>
                        MC •••• ••••
                      </strong>

                    </div>

                    <Activity
                      size={25}
                      strokeWidth={2}
                    />

                  </div>

                </div>


                <div className="landing-floating-record">

                  <div className="landing-floating-icon">
                    <FileText size={17} />
                  </div>

                  <div>

                    <strong>
                      Medical record
                    </strong>

                    <span>
                      Available across facilities
                    </span>

                  </div>

                  <ShieldCheck
                    size={16}
                    className="landing-floating-check"
                  />

                </div>


                <div className="landing-floating-payment">

                  <WalletCards size={17} />

                  <div>

                    <strong>
                      Payment wallet
                    </strong>

                    <span>
                      Secure healthcare payment
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            PROBLEM
        ====================================================== */}

        <section
          id="problem"
          className="landing-section landing-problem"
        >

          <div className="landing-section-inner">

            <div className="landing-section-label">
              THE PROBLEM
            </div>

            <div className="landing-two-column">

              <div>

                <h2>
                  Healthcare information
                  should follow the patient.
                </h2>

              </div>


              <div>

                <p className="landing-section-lead">
                  Patients often move between hospitals,
                  clinics, laboratories and pharmacies
                  without one connected identity.
                </p>

                <p>
                  This can lead to repeated paperwork,
                  fragmented medical history, repeated
                  tests and unnecessary costs.
                </p>

                <p>
                  Payment can be fragmented too,
                  requiring patients to navigate separate
                  processes for consultation, laboratory
                  services, pharmacy and other care.
                </p>

              </div>

            </div>


            <div className="landing-problem-grid">

              <article>

                <div className="landing-problem-icon">
                  <FileText size={20} />
                </div>

                <h3>
                  Fragmented records
                </h3>

                <p>
                  Patient information can remain
                  separated across different facilities
                  and systems.
                </p>

              </article>


              <article>

                <div className="landing-problem-icon">
                  <FlaskConical size={20} />
                </div>

                <h3>
                  Repeated services
                </h3>

                <p>
                  Missing history can contribute to
                  unnecessary repetition of tests
                  and procedures.
                </p>

              </article>


              <article>

                <div className="landing-problem-icon">
                  <CreditCard size={20} />
                </div>

                <h3>
                  Fragmented payment
                </h3>

                <p>
                  Healthcare payments can involve
                  multiple disconnected steps.
                </p>

              </article>

            </div>

          </div>

        </section>


        {/* =====================================================
            SOLUTION
        ====================================================== */}

        <section
          id="solution"
          className="landing-section landing-solution"
        >

          <div className="landing-section-inner">

            <div className="landing-section-label">
              THE SOLUTION
            </div>


            <div className="landing-solution-heading">

              <h2>
                One MedCard connects
                the healthcare journey.
              </h2>

              <p>
                A smart patient identity that helps
                participating facilities access the
                right information and enables a simpler
                payment experience.
              </p>

            </div>


            <div className="landing-solution-flow">

              <div className="landing-flow-item">

                <div className="landing-flow-number">
                  01
                </div>

                <div className="landing-flow-icon">
                  <Activity size={21} />
                </div>

                <h3>
                  Identify
                </h3>

                <p>
                  Patient identity is securely
                  established using the MedCard.
                </p>

              </div>


              <div className="landing-flow-line" />


              <div className="landing-flow-item">

                <div className="landing-flow-number">
                  02
                </div>

                <div className="landing-flow-icon">
                  <FileText size={21} />
                </div>

                <h3>
                  Connect
                </h3>

                <p>
                  Authorized facility workflows
                  connect patient information.
                </p>

              </div>


              <div className="landing-flow-line" />


              <div className="landing-flow-item">

                <div className="landing-flow-number">
                  03
                </div>

                <div className="landing-flow-icon">
                  <WalletCards size={21} />
                </div>

                <h3>
                  Pay
                </h3>

                <p>
                  Eligible healthcare charges can
                  be settled through a digital wallet.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            SERVICES
        ====================================================== */}

        <section
          id="services"
          className="landing-section"
        >

          <div className="landing-section-inner">

            <div className="landing-section-label">
              PLATFORM
            </div>

            <div className="landing-section-title-row">

              <div>

                <h2>
                  Built around the
                  healthcare journey.
                </h2>

              </div>

              <p>
                MedCard brings key healthcare
                interactions into one connected
                platform.
              </p>

            </div>


            <div className="landing-services-grid">

              <article className="landing-service-card">

                <div className="landing-service-icon">
                  <HeartPulse size={21} />
                </div>

                <span>
                  01
                </span>

                <h3>
                  Patient Identity
                </h3>

                <p>
                  A single digital identity helps
                  facilities identify patients
                  consistently.
                </p>

              </article>


              <article className="landing-service-card">

                <div className="landing-service-icon">
                  <FileText size={21} />
                </div>

                <span>
                  02
                </span>

                <h3>
                  Medical Records
                </h3>

                <p>
                  Access relevant patient information
                  through authorized clinical workflows.
                </p>

              </article>


              <article className="landing-service-card">

                <div className="landing-service-icon">
                  <FlaskConical size={21} />
                </div>

                <span>
                  03
                </span>

                <h3>
                  Laboratory
                </h3>

                <p>
                  Laboratory requests and results
                  become part of the connected
                  patient journey.
                </p>

              </article>


              <article className="landing-service-card">

                <div className="landing-service-icon">
                  <Stethoscope size={21} />
                </div>

                <span>
                  04
                </span>

                <h3>
                  Clinical Care
                </h3>

                <p>
                  Support clinical teams with
                  structured patient workflows.
                </p>

              </article>


              <article
                id="payment"
                className="landing-service-card landing-service-payment"
              >

                <div className="landing-service-icon">
                  <WalletCards size={21} />
                </div>

                <span>
                  05
                </span>

                <h3>
                  Healthcare Payments
                </h3>

                <p>
                  A digital wallet helps patients
                  manage eligible healthcare
                  payments through MedCard.
                </p>

                <div className="landing-payment-badge">
                  PAYMENT
                </div>

              </article>


              <article className="landing-service-card">

                <div className="landing-service-icon">
                  <ShieldCheck size={21} />
                </div>

                <span>
                  06
                </span>

                <h3>
                  Secure Access
                </h3>

                <p>
                  Facility and staff workflows are
                  designed around controlled access
                  to healthcare information.
                </p>

              </article>

            </div>

          </div>

        </section>


        {/* =====================================================
            PAYMENT EMPHASIS
        ====================================================== */}

        <section className="landing-payment-section">

          <div className="landing-section-inner">

            <div className="landing-payment-panel">

              <div className="landing-payment-copy">

                <span className="landing-section-label">
                  A BETTER WAY TO PAY
                </span>

                <h2>
                  Healthcare payment
                  should be part of
                  the patient journey.
                </h2>

                <p>
                  MedCard combines patient identity
                  with a healthcare payment wallet,
                  helping reduce disconnected payment
                  processes between the patient and
                  participating facilities.
                </p>


                <div className="landing-payment-points">

                  <div>

                    <CheckIcon />

                    <span>
                      Pay eligible healthcare charges
                    </span>

                  </div>

                  <div>

                    <CheckIcon />

                    <span>
                      Track payment transactions
                    </span>

                  </div>

                  <div>

                    <CheckIcon />

                    <span>
                      Keep identity and payment connected
                    </span>

                  </div>

                </div>

              </div>


              <div className="landing-wallet-visual">

                <div className="landing-wallet-card">

                  <div className="wallet-top">

                    <span>
                      MedCard Wallet
                    </span>

                    <WalletCards size={20} />

                  </div>

                  <small>
                    AVAILABLE BALANCE
                  </small>

                  <strong>
                    RWF 125,000
                  </strong>

                  <div className="wallet-bottom">

                    <span>
                      Patient Wallet
                    </span>

                    <span>
                      ●●●● 2048
                    </span>

                  </div>

                </div>


                <div className="landing-payment-receipt">

                  <div className="receipt-check">
                    <CheckIcon />
                  </div>

                  <div>

                    <strong>
                      Payment completed
                    </strong>

                    <span>
                      Healthcare service
                    </span>

                  </div>

                  <b>
                    RWF 8,500
                  </b>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FACILITY CTA
        ====================================================== */}

        <section className="landing-facility-cta">

          <div className="landing-section-inner">

            <div className="landing-cta-card">

              <div>

                <span className="landing-section-label">
                  FOR HEALTHCARE FACILITIES
                </span>

                <h2>
                  Ready to connect your
                  facility to MedCard?
                </h2>

                <p>
                  Enter the authorized facility portal
                  to access the MedCard clinical
                  environment.
                </p>

              </div>


              <button
                type="button"
                onClick={goToFacilityPortal}
                className="landing-primary-button landing-cta-button"
              >

                Authorized Facility Login

                <ArrowRight size={17} />

              </button>

            </div>

          </div>

        </section>


        {/* =====================================================
            CONTACT
        ====================================================== */}

        <section
          id="contact"
          className="landing-contact"
        >

          <div className="landing-section-inner">

            <div className="landing-contact-grid">

              <div>

                <span className="landing-section-label">
                  GET IN TOUCH
                </span>

                <h2>
                  Let's build a more
                  connected healthcare
                  experience.
                </h2>

                <p>
                  Whether you're a healthcare facility,
                  health organization, insurer or
                  technology partner, we'd like to
                  hear from you.
                </p>

              </div>


              <div className="landing-contact-details">

                <div>

                  <span>
                    Email
                  </span>

                  <strong>
                    medcard2026@gmail.com
                  </strong>

                </div>

                <div>

                  <span>
                    Location
                  </span>

                  <strong>
                    Kigali, Rwanda
                  </strong>

                </div>

                <div>

                  <span>
                    Platform
                  </span>

                  <strong>
                    MedCard Digital Health Platform
                  </strong>

                </div>

              </div>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="landing-footer">

        <div className="landing-footer-inner">

          <div className="landing-footer-brand">

            <span className="landing-brand-mark">

              <Activity
                size={18}
                strokeWidth={2.6}
              />

            </span>

            <span className="landing-brand-name">
              Med<span>Card</span>
            </span>

          </div>


          <div className="landing-footer-links">

            <a href="#problem">
              Problem
            </a>

            <a href="#solution">
              Solution
            </a>

            <a href="#services">
              Services
            </a>

            <a href="#contact">
              Contact
            </a>

          </div>


          <div className="landing-footer-copy">

            © 2026 MedCard · Rwanda

          </div>

        </div>

      </footer>

    </div>
  );
}


/* =========================================================
   SMALL INTERNAL ICON
   ========================================================= */

function CheckIcon() {
  return (
    <span className="landing-check-icon">
      <CheckMark />
    </span>
  );
}

function CheckMark() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.3 6.1L4.7 8.4L9.8 3.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default LandingPage;