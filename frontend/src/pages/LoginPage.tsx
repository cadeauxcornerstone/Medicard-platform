import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  HeartPulse,
  UserRound,
  FlaskConical,
  Pill,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  LoaderCircle,
} from "lucide-react";

export type Role =
  | "Reception"
  | "Doctor"
  | "Nurse"
  | "Laboratory"
  | "Pharmacy"
  | "Cashier";

const CURRENT_ROLE_KEY = "medcard_current_role";
const AUTH_TOKEN_KEY = "medcard_auth_token";
const USER_DATA_KEY = "medcard_user_data";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";

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
  const [username, setUsername] = useState("reception@kfh.rw");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setUsername(`${role.toLowerCase()}@kfh.rw`);
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/staff/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Login failed");
        setIsLoading(false);
        return;
      }

      // Store auth data
      localStorage.setItem(AUTH_TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.data.user));
      localStorage.setItem(CURRENT_ROLE_KEY, data.data.user.role);
      localStorage.setItem("medcard_authenticated", "true");

      navigate("/dashboard");
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-section-tint">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20 py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-body-text hover:text-navy transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Landing</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/facility-login")}
            className="text-sm font-semibold text-teal hover:text-navy transition-colors"
          >
            Facility Authentication →
          </button>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-[32px] shadow-card p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <img
                src="/medcard-logo.svg"
                alt="MedCard"
                className="h-12 w-auto cursor-pointer"
                onClick={() => navigate("/")}
              />
              <div>
                <h1 className="text-navy font-bold text-xl">MedCard</h1>
                <p className="text-body-text text-sm">Patient and clinical services</p>
              </div>
            </div>

            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={24} className="text-teal" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-navy mb-1">Welcome to MedCard</h2>
                <p className="text-body-text text-sm">Select your staff workspace role to access clinical tools.</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-navy mb-3">Select Clinical Workspace Role</label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const selected = selectedRole === role.name;

                  return (
                    <button
                      key={role.name}
                      type="button"
                      onClick={() => handleRoleSelect(role.name)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selected
                          ? "border-teal bg-pale-cyan"
                          : "border-border hover:border-teal"
                      }`}
                    >
                      <Icon size={20} className={selected ? "text-teal" : "text-body-text"} />
                      <span className={`text-sm font-semibold ${selected ? "text-teal" : "text-body-text"}`}>
                        {role.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-navy mb-2">
                  Clinical Workstation Username / Email
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="e.g. staff.doctor@kfh.rw"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-navy">
                    Security PIN / Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <ShieldCheck size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-3 bg-pale-cyan rounded-xl">
                <ShieldCheck size={16} className="text-teal" />
                <span className="text-sm text-body-text">
                  Encrypted via Rwanda MoH E-Health Standards. Smart MedCard contactless token authentication active.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center h-14 px-6 text-base font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle size={20} className="animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  `Sign in as ${selectedRole} →`
                )}
              </button>
            </form>

            <div className="flex items-center gap-2 pt-6 border-t border-border text-center justify-center text-body-text text-sm">
              <span>MedCard Health Systems</span>
              <span>•</span>
              <span>King Faisal Hospital Kigali</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
