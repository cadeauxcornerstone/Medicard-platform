import { useState } from "react";
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
} from "lucide-react";

type Role =
  | "Reception"
  | "Doctor"
  | "Nurse"
  | "Laboratory"
  | "Pharmacy"
  | "Cashier";

const roles = [
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    // Authentication will be connected to the Express backend later.
    navigate("/dashboard");
  };

  return (
    <div className="login-page">
      <div className="login-background" />

      <main className="login-container">
        <section className="login-brand">
          <div className="brand-mark">
            <Activity size={26} strokeWidth={2.5} />
          </div>

          <div>
            <h1>Med<span>Card</span></h1>
            <p>Digital Health Identity Platform</p>
          </div>
        </section>

        <section className="login-card">
          <div className="login-header">
            <div className="security-icon">
              <ShieldCheck size={24} />
            </div>

            <div>
              <h2>Welcome back</h2>
              <p>Sign in to access the MedCard platform.</p>
            </div>
          </div>

          <div className="role-section">
            <label>Sign in as</label>

            <div className="role-grid">
              {roles.map((role) => {
                const Icon = role.icon;
                const selected = selectedRole === role.name;

                return (
                  <button
                    key={role.name}
                    type="button"
                    className={`role-button ${
                      selected ? "selected" : ""
                    }`}
                    onClick={() =>
                      setSelectedRole(role.name as Role)
                    }
                  >
                    <Icon size={19} />
                    <span>{role.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="field">
              <label htmlFor="username">Username or email</label>

              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
              />
            </div>

            <div className="field">
              <div className="field-label-row">
                <label htmlFor="password">Password</label>
                <button type="button" className="forgot-button">
                  Forgot password?
                </button>
              </div>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
              />
            </div>

            <div className="security-note">
              <ShieldCheck size={16} />
              <span>
                Your connection is secured and your healthcare
                data remains protected.
              </span>
            </div>

            <button className="login-button" type="submit">
              Sign in as {selectedRole}
            </button>
          </form>

          <div className="login-footer">
            <span>MedCard Health Systems</span>
            <span>•</span>
            <span>Secure clinical access</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LoginPage;