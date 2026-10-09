import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, LockKeyhole, MapPin, Mail, ShieldCheck, Eye, EyeOff, LoaderCircle } from "lucide-react";

const FACILITY_KEY = "medcard_current_facility";
const AUTH_TOKEN_KEY = "medcard_auth_token";
const USER_DATA_KEY = "medcard_user_data";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";

type FacilityType = "Hospital" | "Clinic";

function FacilityLoginPage() {
  const navigate = useNavigate();

  const [facilityType, setFacilityType] = useState<FacilityType>("Hospital");
  const [facilityName, setFacilityName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("admin@kfh.rw");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBack = () => {
    // Clear any existing auth
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem("medcard_authenticated");
    localStorage.removeItem(FACILITY_KEY);
    navigate("/");
  };

  const handleFacilityLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter the authorized facility email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter the facility password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/facility/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          facilityName: facilityName.trim(),
          location: location.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Facility login failed");
        setIsLoading(false);
        return;
      }

      // Store auth data
      localStorage.setItem(AUTH_TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.data.user));
      localStorage.setItem(FACILITY_KEY, JSON.stringify(data.data.facility));
      localStorage.setItem("medcard_authenticated", "true");

      setIsVerifying(true);

      setTimeout(() => {
        navigate("/login");
      }, 900);
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-section-tint flex items-center justify-center">
        <div className="max-w-md w-full px-5 text-center">
          <img
            src="/medcard-logo.svg"
            alt="MedCard"
            className="h-16 w-auto mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-navy mb-2">Verifying facility access</h1>
          <p className="text-body-text mb-8">
            Establishing your authorized facility session before opening the clinical workspace.
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal" />
            <div className="w-3 h-3 rounded-full bg-teal" />
            <div className="w-3 h-3 rounded-full bg-teal animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-section-tint">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20 py-12 md:py-16">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-body-text hover:text-navy transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span>MedCard home</span>
        </button>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-[32px] shadow-card p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <img
                src="/medcard-logo.svg"
                alt="MedCard"
                className="h-12 w-auto"
              />
              <div>
                <div className="text-navy font-bold text-xl">MedCard</div>
                <div className="text-body-text text-sm">Healthcare facility portal</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-pale-cyan rounded-full mb-8 w-fit">
              <LockKeyhole size={16} className="text-teal" />
              <span className="text-sm font-semibold text-teal">Authorized access</span>
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold text-teal mb-2">FACILITY ACCESS</p>
              <h1 className="text-2xl font-bold text-navy mb-2">Enter your facility</h1>
              <p className="text-body-text">Sign in for an authorized hospital or clinic.</p>
            </div>

            <div className="bg-section-tint rounded-xl p-4 mb-8 flex items-start gap-3">
              <ShieldCheck size={20} className="text-teal flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-navy">Authorized facility only</strong>
                <p className="text-body-text text-sm">Access is restricted to approved healthcare facilities.</p>
              </div>
            </div>

            <form onSubmit={handleFacilityLogin} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="facility-type" className="block text-sm font-semibold text-navy mb-2">
                    Facility type
                  </label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-text" />
                    <select
                      id="facility-type"
                      value={facilityType}
                      onChange={(event) => setFacilityType(event.target.value as FacilityType)}
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl appearance-none bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
                    >
                      <option value="Hospital">Hospital</option>
                      <option value="Clinic">Clinic</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="facility-name" className="block text-sm font-semibold text-navy mb-2">
                    Facility name
                  </label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-text" />
                    <input
                      id="facility-name"
                      type="text"
                      placeholder="Enter hospital or clinic name"
                      value={facilityName}
                      onChange={(event) => setFacilityName(event.target.value)}
                      autoComplete="organization"
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="facility-location" className="block text-sm font-semibold text-navy mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-text" />
                  <input
                    id="facility-location"
                    type="text"
                    placeholder="City / District"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    autoComplete="address-level2"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="facility-email" className="block text-sm font-semibold text-navy mb-2">
                  Authorized email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-text" />
                  <input
                    id="facility-email"
                    type="email"
                    placeholder="Enter facility email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="facility-password" className="block text-sm font-semibold text-navy mb-2">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-text" />
                  <input
                    id="facility-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="w-full pl-10 pr-12 py-3 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-body-text hover:text-teal"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <ShieldCheck size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center h-14 px-6 text-base font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle size={20} className="animate-spin mr-2" />
                    Verifying facility...
                  </>
                ) : (
                  <>
                    Enter Authorized Facility Portal
                    <ArrowRight size={18} className="ml-2" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-2 pt-6 border-t border-border">
              <ShieldCheck size={16} className="text-teal" />
              <span className="text-sm text-body-text">Your facility session is protected. Clinical staff access is selected in the next step.</span>
            </div>
          </div>

          <div className="text-center mt-8 text-body-text text-sm">
            <span>MedCard Health Systems</span>
            <span className="mx-2">•</span>
            <span>Secure healthcare access</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacilityLoginPage;
