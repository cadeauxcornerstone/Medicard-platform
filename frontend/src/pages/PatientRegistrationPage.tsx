import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  UserRoundPlus,
  LoaderCircle,
  AlertCircle,
  Wifi,
} from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";
import AppLayout from "../components/layout/AppLayout";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://medicard-platform.onrender.com";
const PENDING_CARD_KEY = "medcard_pending_card_uid";

type Gender = "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
type CardStatus = "WAITING" | "CHECKING" | "AVAILABLE" | "DUPLICATE" | "ERROR";

interface PatientForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email: string;
}

export default function PatientRegistrationPage() {
  const navigate = useNavigate();

  const [cardUid, setCardUid] = useState("");
  const [cardStatus, setCardStatus] = useState<CardStatus>("WAITING");
  const [cardMessage, setCardMessage] = useState("Place MedCard on reader");
  const [form, setForm] = useState<PatientForm>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "UNKNOWN",
    phone: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const checkCardAvailability = async (uid: string) => {
    const normalizedUid = uid.trim();
    if (!normalizedUid) {
      setCardStatus("ERROR");
      setCardMessage("Empty card ID returned");
      return false;
    }

    setCardStatus("CHECKING");
    setCardMessage("Checking card availability...");
    setErrorMessage("");

    try {
      const response = await axios.get(`${API_URL}/cards/${encodeURIComponent(normalizedUid)}`);
      if (response.status >= 200 && response.status < 300) {
        setCardStatus("DUPLICATE");
        setCardMessage("Card already registered");
        setErrorMessage("This card is already assigned to a patient");
        return false;
      }
      return false;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setCardStatus("AVAILABLE");
        setCardMessage("Card available for registration");
        setErrorMessage("");
        return true;
      }
      setCardStatus("ERROR");
      setCardMessage("Unable to verify card");
      setErrorMessage(error?.response?.data?.message || "Card verification failed");
      return false;
    }
  };

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    const handleConnect = () => {
      const pendingUid = sessionStorage.getItem(PENDING_CARD_KEY);
      if (pendingUid) {
        setCardUid(pendingUid);
        void checkCardAvailability(pendingUid);
      }
    };

    const handleConnectError = () => {
      setCardStatus("ERROR");
      setCardMessage("Unable to connect to reader service");
    };

    const handlePatientIdentified = (event: any) => {
      const uid = event?.data?.card?.cardUid || "";
      if (!uid) return;
      setCardUid(uid);
      setCardStatus("DUPLICATE");
      setCardMessage("Card already registered");
      setErrorMessage("This card is already assigned to a patient");
      sessionStorage.removeItem(PENDING_CARD_KEY);
    };

    const handleIdentificationFailed = (event: any) => {
      if (event.code !== "CARD_NOT_REGISTERED") return;
      const uid = event.cardUid || event.data?.cardUid || "";
      if (!uid) {
        setCardStatus("ERROR");
        setCardMessage("No card ID provided");
        return;
      }
      sessionStorage.setItem(PENDING_CARD_KEY, uid);
      setCardUid(uid);
      void checkCardAvailability(uid);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("patient:identified", handlePatientIdentified);
    socket.on("card:identification-failed", handleIdentificationFailed);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("patient:identified", handlePatientIdentified);
      socket.off("card:identification-failed", handleIdentificationFailed);
      socket.disconnect();
    };
  }, []);

  const updateField = (field: keyof PatientForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleResetCard = () => {
    sessionStorage.removeItem(PENDING_CARD_KEY);
    setCardUid("");
    setCardStatus("WAITING");
    setCardMessage("Place MedCard on reader");
    setErrorMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!cardUid) {
      setErrorMessage("Please scan a MedCard first");
      return;
    }

    if (cardStatus !== "AVAILABLE") {
      setErrorMessage("Card is not available for registration");
      return;
    }

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErrorMessage("First and last name are required");
      return;
    }

    setSubmitting(true);

    try {
      const patientResponse = await axios.post(`${API_URL}/patients`, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
      });

      const patient = patientResponse.data?.data;
      if (!patient?.id) throw new Error("No patient ID returned");

      await axios.post(`${API_URL}/cards`, {
        cardUid,
        patientId: patient.id,
      });

      sessionStorage.removeItem(PENDING_CARD_KEY);
      setSuccess(true);

      setTimeout(() => {
        navigate(`/patients/${encodeURIComponent(patient.id)}`, { replace: true });
      }, 900);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || error?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <AppLayout pageTitle="Patient Registration">
        <div className="bg-white border border-border rounded-lg p-6 text-center">
          <CheckCircle2 size={48} className="text-teal mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy mb-2">Registration Complete</h2>
          <p className="text-body-text">Card {cardUid} linked successfully</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-body-text">
            <LoaderCircle size={16} className="animate-spin" />
            Opening patient file...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      pageTitle="Patient Registration"
      actionButton={{
        label: "Back",
        onClick: () => navigate("/dashboard"),
        icon: <ArrowLeft size={15} />,
      }}
    >
      <div className="space-y-4">
        {/* Card Scanner */}
        <div className={`bg-white border rounded-lg p-3 ${
          cardStatus === "DUPLICATE" ? "border-red-300" :
          cardStatus === "AVAILABLE" ? "border-green-300" :
          "border-border"
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-teal/30 flex items-center justify-center bg-pale-cyan">
                {cardStatus === "CHECKING" ? (
                  <LoaderCircle size={16} className="text-teal animate-spin" />
                ) : cardStatus === "DUPLICATE" ? (
                  <AlertCircle size={16} className="text-red-500" />
                ) : cardStatus === "AVAILABLE" ? (
                  <CheckCircle2 size={16} className="text-green-500" />
                ) : (
                  <Wifi size={16} className="text-teal" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">
                  {cardStatus === "WAITING" ? "Tap MedCard" :
                   cardStatus === "CHECKING" ? "Verifying..." :
                   cardStatus === "AVAILABLE" ? "Card Ready" :
                   cardStatus === "DUPLICATE" ? "Card Registered" :
                   "Error"}
                </p>
                <p className="text-xs text-body-text">{cardMessage}</p>
              </div>
            </div>

            {cardUid && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-section-tint rounded text-xs">
                <CreditCard size={12} />
                <span className="font-mono">{cardUid}</span>
              </div>
            )}

            {cardStatus === "DUPLICATE" && (
              <button
                type="button"
                onClick={handleResetCard}
                className="text-xs text-teal hover:underline"
              >
                Scan another
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg p-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">First name</label>
              <input
                type="text"
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Last name</label>
              <input
                type="text"
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Date of birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => updateField("dateOfBirth", e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-teal"
              >
                <option value="UNKNOWN">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Phone</label>
              <input
                type="tel"
                placeholder="+250 7XX XXX XXX"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Email</label>
              <input
                type="email"
                placeholder="patient@example.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-section-tint rounded-lg text-xs text-body-text">
            <CreditCard size={12} />
            <span>Card: {cardUid || "Waiting for card..."}</span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm font-semibold text-navy border border-border rounded-lg hover:bg-section-tint transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || cardStatus !== "AVAILABLE"}
              className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-navy rounded-lg hover:bg-mid-blue transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={14} className="animate-spin mr-2" />
                  Registering...
                </>
              ) : (
                <>
                  <UserRoundPlus size={14} className="mr-2" />
                  Register
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
