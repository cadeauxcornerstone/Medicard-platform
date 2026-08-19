import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Stethoscope,
  HeartPulse,
  UserRound,
  FlaskConical,
  Pill,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

export type Role =
  | "Reception"
  | "Doctor"
  | "Nurse"
  | "Laboratory"
  | "Pharmacy"
  | "Cashier";

const CURRENT_ROLE_KEY = "medcard_current_role";

const roles: {
  name: Role;
  icon: typeof UserRound;
}[] = [
  { name: "Reception", icon: UserRound },
  { name: "Doctor", icon: Stethoscope },
  { name: "Nurse", icon: HeartPulse },
  { name: "Laboratory", icon: FlaskConical },
  { name: "Pharmacy", icon: Pill },
  { name: "Cashier", icon: CreditCard },
];

function LoginPage() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<Role>("Reception");
  const [username, setUsername] = useState("staff.reception@kfh.rw");
  const [password, setPassword] = useState("••••••••••••");

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setUsername(`staff.${role.toLowerCase()}@kfh.rw`);
  };

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    localStorage.setItem(CURRENT_ROLE_KEY, selectedRole);
    navigate("/dashboard");
  };

  return (
    <div className="login-page">
      <div className="login-background" />

      {/* Top back navigation */}
      <header className="login-top-nav">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={16} />
          <span>Back to Landing</span>
        </button>

        <button
          type="button"
          className="text-button"
          onClick={() => navigate("/facility-login")}
        >
          Facility Authentication →
        </button>
      </header>

      <main className="login-container">
        {/* BRAND */}
        <section className="login-brand">
          <div
            className="brand-mark cursor-pointer"
            onClick={() => navigate("/")}
          >
            <Activity size={26} strokeWidth={2.5} />
          </div>

          <div>
            <h1>
              Med<span>Card</span>
            </h1>
            <p>Rwanda Digital Health Grid</p>
          </div>
        </section>

        {/* LOGIN CARD */}
        <section className="login-card">
          <div className="login-header">
            <div className="security-icon">
              <ShieldCheck size={24} />
            </div>

            <div>
              <h2>Welcome to MedCard</h2>
              <p>Select your staff workspace role to access clinical tools.</p>
            </div>
          </div>

          {/* ROLE SELECTION */}
          <div className="role-section">
            <label>Select Clinical Workspace Role</label>

            <div className="role-grid">
              {roles.map((role) => {
                const Icon = role.icon;
                const selected = selectedRole === role.name;

                return (
                  <button
                    key={role.name}
                    type="button"
                    className={`role-button ${selected ? "selected" : ""}`}
                    onClick={() => handleRoleSelect(role.name)}
                  >
                    <Icon size={19} />
                    <span>{role.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin} className="login-form">
            <div className="field">
              <label htmlFor="username">Clinical Workstation Username / Email</label>
              <input
                id="username"
                type="text"
                placeholder="e.g. staff.doctor@kfh.rw"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div className="field">
              <div className="field-label-row">
                <label htmlFor="password">Security PIN / Password</label>
                <button
                  type="button"
                  className="forgot-button"
                  onClick={() => alert("Demo Mode: Click Sign In directly!")}
                >
                  Demo auto-filled
                </button>
              </div>

              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="security-note">
              <ShieldCheck size={16} />
              <span>
                Encrypted via Rwanda MoH E-Health Standards. Smart MedCard
                contactless token authentication active.
              </span>
            </div>

            <button className="login-button" type="submit">
              Sign in as {selectedRole} →
            </button>
          </form>

          {/* FOOTER */}
          <div className="login-footer">
            <span>MedCard Health Systems</span>
            <span>•</span>
            <span>King Faisal Hospital Kigali</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LoginPage;