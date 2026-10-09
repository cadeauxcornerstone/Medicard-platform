import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, X, ArrowRight, Lock, CheckCircle2, LoaderCircle, ShieldCheck, RefreshCw } from "lucide-react";
import { landingConfig } from "../data/landing";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";
const AUTH_TOKEN_KEY = "medcard_auth_token";
const USER_DATA_KEY = "medcard_user_data";

type Step = "plans" | "account" | "verify" | "payment" | "confirm";

export default function PatientVaultPage() {
  const [step, setStep] = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"momo" | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [paymentAttemptId, setPaymentAttemptId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const loginPatient = async (loginEmail: string, loginPassword: string) => {
    const response = await fetch(`${API_URL}/auth/patient/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: loginEmail,
        password: loginPassword,
      }),
    });

    const loginData = await response.json();
    if (!response.ok || !loginData.success) {
      throw new Error(loginData.message || "Unable to sign in to your patient vault.");
    }

    localStorage.setItem(AUTH_TOKEN_KEY, loginData.data.token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(loginData.data.patient));
    localStorage.setItem("medcard_authenticated", "true");
  };

  const redirectToVault = () => {
    setShowToast(true);
    setTimeout(() => {
      window.location.href = "/vault-portal";
    }, 1500);
  };

  // Countdown timer for resend button
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    } else if (resendCountdown === 0) {
      setResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [resendCountdown]);

  const handleResendCode = async () => {
    setResendDisabled(true);
    setResendCountdown(60); // 60 seconds countdown
    setError("");
    setNotice("");
    
    try {
      const response = await fetch(`${API_URL}/registration/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          firstName: email.trim().split("@")[0] || "Patient",
          lastName: "User",
          plan: selectedPlan === "Premium Vault" ? "PREMIUM" : "BASIC",
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.alreadyVerified) {
          setPatientId(data.patientId);
          setError("");
          if (data.hasActiveSubscription) {
            await loginPatient(email.trim().toLowerCase(), password);
            redirectToVault();
            return;
          }
          setStep("payment");
          setNotice("This email is already verified, so no new verification email was sent. Continue to payment.");
          return;
        }
        setNotice("A new verification code was sent to your email.");
      } else {
        setError(data.message || "Failed to resend code");
        setResendDisabled(false);
        setResendCountdown(0);
      }
    } catch (err) {
      console.error("Resend code error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect to server. Please try again.");
      setResendDisabled(false);
      setResendCountdown(0);
    }
  };

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    setPaymentAttemptId(null);
    setPaymentStatus(null);
    setStep("account");
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // Validate inputs
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }
    if (!normalizedPhone || normalizedPhone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number");
      setIsLoading(false);
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/registration/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          phone: normalizedPhone,
          password,
          firstName: normalizedEmail.split("@")[0] || "Patient",
          lastName: "User",
          plan: selectedPlan === "Premium Vault" ? "PREMIUM" : "BASIC",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (response.status === 409) {
          setError("This email is already registered. Enter the password for that account to continue, or use a different email.");
        } else {
          setError(data.message || "Registration failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      setEmail(normalizedEmail);
      setPhone(normalizedPhone);
      if (data.alreadyVerified) {
        setPatientId(data.patientId);
        if (data.hasActiveSubscription) {
          await loginPatient(normalizedEmail, password);
          redirectToVault();
          return;
        }
        setStep("payment");
        setNotice("This email is already verified, so no new verification email was sent. Continue to payment.");
        setIsLoading(false);
        return;
      }

      // Don't set patientId yet - it will be set after verification
      setStep("verify");
      setIsLoading(false);
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to connect to server. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setNotice("");

    // Validate verification code
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter the 6-digit verification code");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/registration/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Invalid verification code. Please check your email and try again.");
        setIsLoading(false);
        return;
      }

      // Store patientId from verification response
      if (data.patientId) {
        setPatientId(data.patientId);
      }

      setStep("payment");
      setIsLoading(false);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Failed to connect to server. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  const handlePaymentSelect = () => {
    setPaymentMethod("momo");
    setPaymentAttemptId(null);
    setPaymentStatus(null);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError("");

    if (!patientId || !paymentMethod) {
      setError("Session expired. Please start over.");
      setIsLoading(false);
      return;
    }

    try {
      let activePaymentId = paymentAttemptId;
      if (!activePaymentId) {
        const initiationResponse = await fetch(`${API_URL}/registration/payment/initiate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientId,
            plan: selectedPlan === "Premium Vault" ? "PREMIUM" : "BASIC",
            paymentMethod: "MOBILE_MONEY",
            phone,
          }),
        });
        const initiationData = await initiationResponse.json();
        if (!initiationResponse.ok || !initiationData.success) {
          throw new Error(initiationData.message || "Could not start your payment.");
        }

        activePaymentId = initiationData.paymentId;
        setPaymentAttemptId(activePaymentId);
        setPaymentStatus(initiationData.status);
        if (initiationData.phone) setPhone(initiationData.phone);
        if (!activePaymentId) {
          throw new Error("Payment started, but no payment ID was returned. Please try again.");
        }
      }

      for (let attempt = 0; attempt < 36; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 5000));
        }
        const statusResponse = await fetch(
          `${API_URL}/registration/payment/${encodeURIComponent(activePaymentId)}/status`
        );
        const statusData = await statusResponse.json();
        if (!statusResponse.ok || !statusData.success) {
          throw new Error(statusData.message || "Could not check payment status.");
        }

        setPaymentStatus(statusData.status);
        if (statusData.status === "FAILED") {
          setPaymentAttemptId(null);
          throw new Error("The payment was declined or timed out. Please try again.");
        }
        if (statusData.status === "SUCCESS") {
          await loginPatient(email.trim().toLowerCase(), password);
          setIsLoading(false);
          setShowToast(true);
          setTimeout(() => {
            window.location.href = "/vault-portal";
          }, 2000);
          return;
        }
      }

      setError("Payment is still pending. Approve the prompt on your phone, then check again.");
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect to server. Please check your connection and try again.");
    }
    setIsLoading(false);
  };

  const goBack = () => {
    if (step === "payment") setStep("verify");
    else if (step === "verify") setStep("account");
    else if (step === "confirm") setStep("payment");
    else if (step === "account") setStep("plans");
  };

  return (
    <div className="min-h-screen bg-section-tint py-8 md:py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => window.location.href = "/"}
            className="text-sm text-body-text hover:text-navy inline-flex items-center gap-1"
          >
            <ArrowRight size={14} className="rotate-180" />
            Back to Home
          </button>
          <Link
            to="/patient-vault/login"
            className="text-sm font-semibold text-teal hover:text-navy"
          >
            Already have an account? Sign in
          </Link>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-4 right-4 z-50 bg-white border border-border rounded-xl shadow-lg p-4 flex items-center gap-3 animate-[slideIn_0.3s_ease-out]">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-navy text-sm">Vault ready!</p>
              <p className="text-body-text text-xs">Redirecting to vault portal...</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-border rounded-2xl p-6 md:p-8">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "plans" ? "bg-teal text-white" : "bg-teal text-white"
            }`}>1</div>
            <div className={`h-0.5 w-8 ${step === "plans" ? "bg-border" : "bg-teal"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "account" || step === "verify" || step === "payment" || step === "confirm" ? "bg-teal text-white" : "bg-border text-body-text"
            }`}>2</div>
            <div className={`h-0.5 w-8 ${step === "verify" || step === "payment" || step === "confirm" ? "bg-teal" : "bg-border"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "verify" || step === "payment" || step === "confirm" ? "bg-teal text-white" : "bg-border text-body-text"
            }`}>3</div>
            <div className={`h-0.5 w-8 ${step === "payment" || step === "confirm" ? "bg-teal" : "bg-border"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "payment" || step === "confirm" ? "bg-teal text-white" : "bg-border text-body-text"
            }`}>4</div>
            <div className={`h-0.5 w-8 ${step === "confirm" ? "bg-teal" : "bg-border"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "confirm" ? "bg-teal text-white" : "bg-border text-body-text"
            }`}>5</div>
          </div>

          {notice && (
            <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm" role="status">
              {notice}
            </div>
          )}

          {step === "plans" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-navy mb-2">
                  {landingConfig.patientVault.headlinePart1}
                </h1>
                <p className="text-teal italic font-serif text-xl md:text-2xl">
                  {landingConfig.patientVault.headlinePart2}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {landingConfig.patientVault.pricing.map((plan: any) => (
                  <div
                    key={plan.name}
                    onClick={() => handleSelectPlan(plan.name)}
                    className={`relative p-6 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                      plan.featured
                        ? "bg-navy text-white border-2 border-teal"
                        : "bg-white border border-border hover:border-teal"
                    }`}
                  >
                    {plan.featured && (
                      <div className="absolute top-0 right-0 bg-teal text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                        POPULAR
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    {plan.subtitle && (
                      <p className={`mb-3 text-sm ${plan.featured ? "text-soft-text-on-navy" : "text-body-text"}`}>
                        {plan.subtitle}
                      </p>
                    )}
                    <div className="mb-4">
                      <span className="text-4xl font-bold leading-none">
                        {plan.price}
                      </span>
                      <span className={plan.featured ? "text-soft-text-on-navy" : "text-muted-text"}>
                        {" "}{plan.period}
                      </span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {plan.features.slice(0, 4).map((feature: any, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          {feature.active ? (
                            <Check size={16} className={plan.featured ? "text-teal flex-shrink-0" : "text-teal flex-shrink-0"} />
                          ) : (
                            <X size={16} className="text-muted-text flex-shrink-0" />
                          )}
                          <span className={plan.featured ? "text-white" : feature.active ? "text-navy" : "text-muted-text"}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                      <span>Choose Plan</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === "account" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-navy mb-1">Create Your Account</h2>
                <p className="text-body-text text-sm">Choose {selectedPlan} Plan</p>
              </div>

              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Phone</label>
                    <input
                      type="tel"
                      placeholder="+250 7XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-teal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-teal"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <ShieldCheck size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-navy border border-border rounded-lg hover:bg-section-tint transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-navy rounded-lg hover:bg-mid-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle size={16} className="animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </button>
                </div>
                <p className="text-center text-sm text-body-text">
                  Already registered?{" "}
                  <Link to="/patient-vault/login" className="font-semibold text-teal hover:text-navy">
                    Sign in to your Patient Vault
                  </Link>
                </p>
              </form>
            </>
          )}

          {step === "verify" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-navy mb-1">Verify Your Email</h2>
                <p className="text-body-text text-sm">Enter the 6-digit code sent to {email}</p>
                <p className="text-xs text-muted-text mt-1">Code expires in 10 minutes</p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Verification Code</label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-teal text-center tracking-widest text-2xl"
                  />
                  <div className="mt-2 text-center">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendDisabled}
                      className="text-xs text-teal hover:text-navy disabled:text-muted-text disabled:cursor-not-allowed flex items-center gap-1 mx-auto"
                    >
                      {resendDisabled ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Resend in {resendCountdown}s
                        </>
                      ) : (
                        "Resend code"
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <ShieldCheck size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-navy border border-border rounded-lg hover:bg-section-tint transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-teal rounded-lg hover:bg-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle size={16} className="animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === "payment" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-navy mb-1">Pay with Mobile Money</h2>
                <p className="text-body-text text-sm">Powered by XentriPay</p>
              </div>

              <div className="mb-6 rounded-xl border border-border bg-section-tint p-5 text-center">
                <p className="font-semibold text-navy">Payment prompt goes to {phone}</p>
                <p className="mt-2 text-sm text-body-text">
                  XentriPay routes Mobile Money using the phone number you provided. Approve the prompt on that phone to activate your plan.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-pale-cyan rounded-lg text-xs text-teal mb-6">
                <Lock size={12} />
                <span>Secure payment powered by XentriPay</span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handlePaymentSelect()}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-navy border border-border rounded-lg hover:bg-section-tint transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "confirm" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-navy mb-1">Confirm Payment</h2>
                <p className="text-body-text text-sm">Review your subscription</p>
              </div>

              <div className="bg-section-tint rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-body-text">Plan</span>
                  <span className="font-semibold text-navy">{selectedPlan}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-body-text">Payment Method</span>
                  <span className="font-semibold text-navy">Mobile Money</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-body-text">Payment phone</span>
                  <span className="font-semibold text-navy">{phone}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold text-navy">Total</span>
                  <span className="font-bold text-navy">
                    {selectedPlan === "Premium Vault" ? "150 RWF" : "100 RWF"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-pale-cyan rounded-lg text-xs text-teal mb-6">
                <Lock size={12} />
                <span>XentriPay will send a Mobile Money approval prompt to {phone}.</span>
              </div>

              {paymentStatus && (
                <div className="px-4 py-3 bg-pale-cyan rounded-xl text-sm text-navy mb-6" role="status">
                  {paymentStatus === "PENDING" || paymentStatus === "INITIATING"
                    ? "Waiting for you to approve the payment on your phone..."
                    : `Payment status: ${paymentStatus.toLowerCase()}`}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">
                  <ShieldCheck size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-navy border border-border rounded-lg hover:bg-section-tint transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-teal rounded-lg hover:bg-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    paymentAttemptId ? "Check Payment Status" : "Send Payment Prompt"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
