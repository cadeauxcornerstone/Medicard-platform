import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";
const AUTH_TOKEN_KEY = "medcard_auth_token";
const USER_DATA_KEY = "medcard_user_data";

export default function PatientVaultLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/patient/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to sign in. Check your email and password.");
      }

      localStorage.setItem(AUTH_TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.data.patient));
      localStorage.setItem("medcard_authenticated", "true");

      const subscriptionResponse = await fetch(
        `${API_URL}/registration/subscription/${encodeURIComponent(data.data.patient.id)}`,
        { headers: { Authorization: `Bearer ${data.data.token}` } },
      );

      if (subscriptionResponse.ok) {
        navigate("/vault-portal", { replace: true });
        return;
      }

      if (subscriptionResponse.status === 404) {
        navigate("/patient-vault", { replace: true });
        return;
      }

      const subscriptionData = await subscriptionResponse.json();
      throw new Error(subscriptionData.message || "Could not check your vault plan.");
    } catch (caughtError) {
      setError(caughtError instanceof Error
        ? caughtError.message
        : "Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-section-tint py-8 md:py-16">
      <div className="max-w-xl mx-auto px-4">
        <Link
          to="/patient-vault"
          className="text-sm text-body-text hover:text-navy mb-6 inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          Back to Patient Vault
        </Link>

        <div className="bg-white border border-border rounded-2xl p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={24} className="text-teal" />
            </div>
            <h1 className="text-2xl font-bold text-navy mb-2">Patient Vault Sign In</h1>
            <p className="text-sm text-body-text">Sign in to access your account and health vault.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="patient-email" className="block text-sm font-semibold text-navy mb-2">
                Email
              </label>
              <input
                id="patient-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl text-navy focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="patient-password" className="block text-sm font-semibold text-navy mb-2">
                Password
              </label>
              <input
                id="patient-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl text-navy focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div role="alert" className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 h-12 text-base font-semibold text-white bg-teal rounded-xl hover:bg-teal/90 transition-colors disabled:opacity-50"
            >
              {isLoading && <LoaderCircle size={18} className="animate-spin" />}
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-body-text mt-6">
            New to Patient Vault?{" "}
            <Link to="/patient-vault" className="font-semibold text-teal hover:text-navy">
              Choose a plan
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
