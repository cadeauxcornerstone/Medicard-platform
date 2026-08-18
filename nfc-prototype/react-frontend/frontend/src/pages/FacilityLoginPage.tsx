import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  LockKeyhole,
  MapPin,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

const FACILITY_KEY = "medcard_current_facility";

type FacilityType = "Hospital" | "Clinic";

function FacilityLoginPage() {
  const navigate = useNavigate();

  const [facilityType, setFacilityType] =
    useState<FacilityType>("Hospital");

  const [facilityName, setFacilityName] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isVerifying, setIsVerifying] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | RETURN TO MEDCARD HOME
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    navigate("/");
  };

  /*
  |--------------------------------------------------------------------------
  | FACILITY ACCESS
  |--------------------------------------------------------------------------
  |
  | This is intentionally DEMO authentication.
  |
  | We do not contact the backend or validate real credentials.
  |
  | The purpose is to demonstrate that MedCard can establish
  | a facility context before staff select their clinical role.
  |
  */

  const handleFacilityLogin = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");

    if (!facilityName.trim()) {
      setError(
        "Please enter the facility name."
      );

      return;
    }

    if (!location.trim()) {
      setError(
        "Please enter the facility location."
      );

      return;
    }

    if (!email.trim()) {
      setError(
        "Please enter the authorized facility email."
      );

      return;
    }

    if (!password.trim()) {
      setError(
        "Please enter the facility password."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE DEMO FACILITY CONTEXT
    |--------------------------------------------------------------------------
    */

    const facility = {
      type: facilityType,
      name: facilityName.trim(),
      location: location.trim(),
      email: email.trim(),
    };

    localStorage.setItem(
      FACILITY_KEY,
      JSON.stringify(facility)
    );

    /*
    |--------------------------------------------------------------------------
    | SIMULATED VERIFICATION
    |--------------------------------------------------------------------------
    */

    setIsVerifying(true);

    setTimeout(() => {
      navigate("/login");
    }, 900);
  };

  /*
  |--------------------------------------------------------------------------
  | VERIFICATION SCREEN
  |--------------------------------------------------------------------------
  */

  if (isVerifying) {
    return (
      <div className="facility-login-page">

        <div className="facility-login-background" />

        <main className="facility-login-container">

          <section className="facility-verification-card">

            <div className="facility-verification-logo">

              <div className="facility-brand-mark">
                <Activity
                  size={25}
                  strokeWidth={2.5}
                />
              </div>

            </div>

            <div className="facility-verification-check">
              <Check size={28} />
            </div>

            <span className="facility-verification-eyebrow">
              FACILITY ACCESS
            </span>

            <h1>
              Verifying facility access
            </h1>

            <p>
              Establishing your authorized facility
              session before opening the clinical
              workspace.
            </p>

            <div className="facility-verification-steps">

              <div className="facility-verification-step complete">

                <span className="step-icon">
                  <Check size={13} />
                </span>

                <span>
                  Facility identified
                </span>

              </div>

              <div className="facility-verification-step complete">

                <span className="step-icon">
                  <Check size={13} />
                </span>

                <span>
                  Facility access confirmed
                </span>

              </div>

              <div className="facility-verification-step active">

                <span className="step-loader" />

                <span>
                  Opening secure workspace
                </span>

              </div>

            </div>

          </section>

        </main>

      </div>
    );
  }

  return (
    <div className="facility-login-page">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="facility-login-background" />

      <div className="facility-login-glow facility-glow-one" />
      <div className="facility-login-glow facility-glow-two" />


      {/* =====================================================
          BACK TO HOME
      ====================================================== */}

      <button
        type="button"
        className="facility-portal-back"
        onClick={handleBack}
      >
        <ArrowLeft size={15} />

        <span>
          MedCard home
        </span>
      </button>


      <main className="facility-login-container">

        {/* ===================================================
            LOGIN CARD
        ==================================================== */}

        <section className="facility-login-card">

          {/* =================================================
              TOP BAR
          ================================================== */}

          <div className="facility-login-top">

            <div className="facility-login-brand">

              <div className="facility-brand-mark">

                <Activity
                  size={22}
                  strokeWidth={2.5}
                />

              </div>

              <div>

                <div className="facility-brand-word">
                  Med<span>Card</span>
                </div>

                <div className="facility-login-kicker">
                  Healthcare facility portal
                </div>

              </div>

            </div>


            <span className="facility-secure-pill">

              <LockKeyhole size={12} />

              Authorized access

            </span>

          </div>


          {/* =================================================
              FACILITY HEADER
          ================================================== */}

          <div className="facility-access-head">

            <div>

              <span className="facility-access-eyebrow">
                FACILITY ACCESS
              </span>

              <h1>
                Enter your facility
              </h1>

              <p>
                Sign in for an authorized hospital
                or clinic.
              </p>

            </div>


            <div className="facility-shield">

              <ShieldCheck size={25} />

            </div>

          </div>


          {/* =================================================
              AUTHORIZED FACILITY WARNING
          ================================================== */}

          <div className="facility-portal-warning">

            <div className="facility-warning-icon">

              <ShieldCheck size={17} />

            </div>

            <div>

              <strong>
                Authorized facility only
              </strong>

              <span>
                Access is restricted to approved
                healthcare facilities.
              </span>

            </div>

          </div>


          {/* =================================================
              FORM
          ================================================== */}

          <form
            className="facility-form"
            onSubmit={handleFacilityLogin}
          >

            {/* =================================================
                FACILITY TYPE + NAME
            ================================================== */}

            <div className="facility-field-row">

              <div className="facility-field">

                <label htmlFor="facility-type">
                  Facility type
                </label>

                <div className="facility-select-wrap">

                  <Building2 size={16} />

                  <select
                    id="facility-type"
                    value={facilityType}
                    onChange={(event) =>
                      setFacilityType(
                        event.target.value as FacilityType
                      )
                    }
                  >

                    <option value="Hospital">
                      Hospital
                    </option>

                    <option value="Clinic">
                      Clinic
                    </option>

                  </select>

                  <ChevronDown
                    size={15}
                    className="facility-select-arrow"
                  />

                </div>

              </div>


              <div className="facility-field">

                <label htmlFor="facility-name">
                  Facility name
                </label>

                <div className="facility-input-wrap">

                  <Building2 size={16} />

                  <input
                    id="facility-name"
                    type="text"
                    placeholder="Enter hospital or clinic name"
                    value={facilityName}
                    onChange={(event) =>
                      setFacilityName(
                        event.target.value
                      )
                    }
                    autoComplete="organization"
                  />

                </div>

              </div>

            </div>


            {/* =================================================
                LOCATION
            ================================================== */}

            <div className="facility-field">

              <label htmlFor="facility-location">
                Location
              </label>

              <div className="facility-input-wrap">

                <MapPin size={16} />

                <input
                  id="facility-location"
                  type="text"
                  placeholder="City / District"
                  value={location}
                  onChange={(event) =>
                    setLocation(
                      event.target.value
                    )
                  }
                  autoComplete="address-level2"
                />

              </div>

            </div>


            {/* =================================================
                EMAIL
            ================================================== */}

            <div className="facility-field">

              <label htmlFor="facility-email">
                Authorized email
              </label>

              <div className="facility-input-wrap">

                <Mail size={16} />

                <input
                  id="facility-email"
                  type="email"
                  placeholder="Enter facility email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  autoComplete="username"
                />

              </div>

            </div>


            {/* =================================================
                PASSWORD
            ================================================== */}

            <div className="facility-field">

              <label htmlFor="facility-password">
                Password
              </label>

              <div className="facility-input-wrap">

                <LockKeyhole size={16} />

                <input
                  id="facility-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="facility-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}

                </button>

              </div>

            </div>


            {/* =================================================
                DEMO ACCOUNT HINT
            ================================================== */}

            <div className="facility-account-hint">

              <span className="facility-hint-dot" />

              <span>
                Facility access is simulated in
                this prototype.
              </span>

            </div>


            {/* =================================================
                ERROR
            ================================================== */}

            {error && (

              <div className="facility-form-error">

                <ShieldCheck size={15} />

                <span>
                  {error}
                </span>

              </div>

            )}


            {/* =================================================
                SECURITY NOTE
            ================================================== */}

            <div className="facility-security-note">

              <ShieldCheck size={15} />

              <span>
                Your facility session is protected.
                Clinical staff access is selected
                in the next step.
              </span>

            </div>


            {/* =================================================
                SUBMIT
            ================================================== */}

            <button
              type="submit"
              className="facility-login-button"
            >

              <span>
                Enter Authorized Facility Portal
              </span>

              <ArrowRight size={17} />

            </button>

          </form>


          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="facility-login-footer">

            <span>
              MedCard Health Systems
            </span>

            <span className="footer-dot">
              •
            </span>

            <span>
              Secure healthcare access
            </span>

          </div>

        </section>


        {/* ===================================================
            TRUST MESSAGE
        ==================================================== */}

        <div className="facility-trust-message">

          <ShieldCheck size={14} />

          <span>
            Digital healthcare infrastructure for
            participating facilities
          </span>

        </div>

      </main>

    </div>
  );
}

export default FacilityLoginPage;