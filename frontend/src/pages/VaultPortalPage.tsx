import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  HeartPulse,
  LoaderCircle,
  LockKeyhole,
  Plus,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";
const AUTH_TOKEN_KEY = "medcard_auth_token";
const USER_DATA_KEY = "medcard_user_data";

type HealthRecord = {
  id: string;
  allergen?: string;
  reaction?: string | null;
  severity?: string | null;
  name?: string;
  description?: string | null;
  createdAt: string;
};

type VaultProfile = {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  dateOfBirth: string | null;
  gender: string;
  phone: string | null;
  email: string | null;
  nationalId: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  insuranceProvider: string | null;
  allergies: HealthRecord[];
  medicalConditions: HealthRecord[];
  medicalDocuments: Array<{
    id: string;
    title: string;
    description: string | null;
    type: string;
    mimeType: string | null;
    createdAt: string;
  }>;
  patientInsurances: Array<{
    id: string;
    membershipNumber: string;
    status: string;
    plan: { name: string; provider: { name: string } };
  }>;
  dependents?: VaultProfile[];
};

type VaultSubscription = {
  plan: "BASIC" | "PREMIUM";
  status: string;
  endDate: string | null;
  amount: number;
};

type DashboardData = {
  patient: VaultProfile;
  subscription: VaultSubscription | null;
};

type EditableProfile = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  nationalId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  insuranceProvider: string;
};

const emptyDependent = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "UNKNOWN",
  nationalId: "",
  insuranceProvider: "",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    window.location.assign("/patient-vault/login");
    throw new Error("Please sign in to access your Patient Vault.");
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "The request could not be completed.");
  }
  return data as T;
}

export default function VaultPortalPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profileForm, setProfileForm] = useState<EditableProfile | null>(null);
  const [dependentForm, setDependentForm] = useState(emptyDependent);
  const [allergy, setAllergy] = useState({ allergen: "", reaction: "", severity: "" });
  const [condition, setCondition] = useState({ name: "", description: "" });
  const [paymentPhone, setPaymentPhone] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingDependent, setIsAddingDependent] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const loadDashboard = useCallback(async () => {
    const result = await request<{ success: boolean; data: DashboardData }>("/vault/me");
    if (!result.data.subscription) {
      window.location.assign("/patient-vault");
      throw new Error("Choose a plan to continue to your Patient Vault.");
    }
    setDashboard(result.data);
    setSelectedProfileId((current) => current || result.data.patient.id);
    setPaymentPhone((current) => current || result.data.patient.phone || "");
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(result.data.patient));
  }, []);

  useEffect(() => {
    loadDashboard()
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load your vault.");
        if (!localStorage.getItem(AUTH_TOKEN_KEY)) window.location.assign("/patient-vault/login");
      })
      .finally(() => setIsLoading(false));
  }, [loadDashboard]);

  const selectedProfile = useMemo(() => {
    if (!dashboard) return null;
    if (dashboard.patient.id === selectedProfileId) return dashboard.patient;
    return dashboard.patient.dependents?.find((dependent) => dependent.id === selectedProfileId) || null;
  }, [dashboard, selectedProfileId]);

  useEffect(() => {
    if (!selectedProfile) return;
    setProfileForm({
      firstName: selectedProfile.firstName,
      lastName: selectedProfile.lastName,
      dateOfBirth: selectedProfile.dateOfBirth?.slice(0, 10) || "",
      gender: selectedProfile.gender,
      phone: selectedProfile.phone || "",
      nationalId: selectedProfile.nationalId || "",
      emergencyContactName: selectedProfile.emergencyContactName || "",
      emergencyContactPhone: selectedProfile.emergencyContactPhone || "",
      insuranceProvider: selectedProfile.insuranceProvider || "",
    });
  }, [selectedProfile]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProfile || !profileForm) return;
    setError("");
    setNotice("");
    setIsSaving(true);
    try {
      await request(`/vault/profiles/${encodeURIComponent(selectedProfile.id)}`, {
        method: "PATCH",
        body: JSON.stringify(profileForm),
      });
      await loadDashboard();
      setNotice("Profile details saved.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const addDependent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsAddingDependent(true);
    try {
      await request("/vault/dependents", {
        method: "POST",
        body: JSON.stringify(dependentForm),
      });
      setDependentForm(emptyDependent);
      await loadDashboard();
      setNotice("Dependent profile created and linked to your account.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not add dependent.");
    } finally {
      setIsAddingDependent(false);
    }
  };

  const addHealthRecord = async (kind: "allergies" | "conditions", event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProfile) return;
    setError("");
    setNotice("");
    const isAllergy = kind === "allergies";
    const body = isAllergy ? allergy : condition;
    try {
      await request(`/vault/profiles/${encodeURIComponent(selectedProfile.id)}/${kind}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (isAllergy) setAllergy({ allergen: "", reaction: "", severity: "" });
      else setCondition({ name: "", description: "" });
      await loadDashboard();
      setNotice(isAllergy ? "Allergy added." : "Medical condition added.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save health record.");
    }
  };

  const removeHealthRecord = async (kind: "allergies" | "conditions", id: string) => {
    if (!selectedProfile) return;
    setError("");
    setNotice("");
    try {
      await request(`/vault/profiles/${encodeURIComponent(selectedProfile.id)}/health/${kind}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await loadDashboard();
      setNotice("Health record removed.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not remove health record.");
    }
  };

  const upgradePlan = async () => {
    setError("");
    setNotice("");
    setIsPaying(true);
    try {
      const initiated = await request<{
        paymentId: string;
        status: string;
        message?: string;
      }>("/vault/payment/initiate", {
        method: "POST",
        body: JSON.stringify({
          plan: "PREMIUM",
          paymentMethod: "MOBILE_MONEY",
          phone: paymentPhone,
        }),
      });
      setNotice(initiated.message || "Approve the Mobile Money request on your phone.");

      for (let attempt = 0; attempt < 36; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 5000));
        const status = await request<{ status: string }>(
          `/vault/payment/${encodeURIComponent(initiated.paymentId)}/status`,
        );
        if (status.status === "SUCCESS") {
          await loadDashboard();
          setNotice("Payment confirmed. Your Premium plan is active.");
          return;
        }
        if (status.status === "FAILED") {
          setNotice("The payment was not completed by the provider. You can try again.");
          return;
        }
      }
      setNotice("Payment is still pending. You can check your plan again shortly.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to process plan payment.");
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-section-tint flex items-center justify-center">
        <LoaderCircle className="animate-spin text-teal" size={36} aria-label="Loading vault" />
      </div>
    );
  }

  if (!dashboard || !selectedProfile || !profileForm) {
    return (
      <main className="min-h-screen bg-section-tint px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-white p-6 text-center">
          <h1 className="text-xl font-bold text-navy">Patient Vault unavailable</h1>
          <p className="mt-2 text-sm text-body-text">{error || "We could not load your account."}</p>
          <button onClick={() => window.location.assign("/patient-vault/login")} className="mt-5 rounded-lg bg-teal px-4 py-2 font-semibold text-white">
            Sign in again
          </button>
        </div>
      </main>
    );
  }

  const subscription = dashboard.subscription;
  const isPremium = subscription?.plan === "PREMIUM";
  const isDependent = selectedProfile.id !== dashboard.patient.id;

  return (
    <main className="min-h-screen bg-section-tint py-8 md:py-12">
      <div className="mx-auto max-w-6xl space-y-6 px-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Patient Vault</p>
            <h1 className="mt-1 text-3xl font-bold text-navy">Hello, {dashboard.patient.firstName}</h1>
            <p className="mt-1 text-sm text-body-text">Manage your profile and your family’s health details.</p>
          </div>
          <button onClick={() => window.location.assign("/")} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-section-tint">
            Back to home
          </button>
        </header>

        {(error || notice) && (
          <div role={error ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-teal/30 bg-pale-cyan text-navy"}`}>
            {error ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
            <span>{error || notice}</span>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-[1fr_2fr]">
          <div className="rounded-2xl bg-navy p-6 text-white">
            <div className="flex items-center gap-2 text-teal"><ShieldCheck size={20} /><span className="text-sm font-semibold">Your plan</span></div>
            <h2 className="mt-4 text-2xl font-bold">{subscription?.plan || "No active plan"}</h2>
            <p className="mt-2 text-sm text-white/75">
              {subscription
                ? `Active until ${formatDate(subscription.endDate)} · ${subscription.amount.toLocaleString()} RWF`
                : "Choose a plan to enable your Patient Vault subscription."}
            </p>
            {!isPremium && (
              <div className="mt-5 space-y-3">
                <label className="block text-xs font-semibold text-white/80" htmlFor="upgrade-phone">Mobile Money number for Premium upgrade</label>
                <input
                  id="upgrade-phone"
                  value={paymentPhone}
                  onChange={(event) => setPaymentPhone(event.target.value)}
                  placeholder="2507XXXXXXXX"
                  className="w-full rounded-lg border border-white/20 bg-white px-3 py-2 text-sm text-navy"
                />
                <button
                  type="button"
                  onClick={upgradePlan}
                  disabled={isPaying || !subscription || !paymentPhone.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPaying ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
                  {isPaying ? "Waiting for payment confirmation..." : "Upgrade to Premium · 150 RWF"}
                </button>
                <p className="text-xs text-white/70">Basic is 100 RWF; Premium is 150 RWF. The upgrade is applied only after XentriPay confirms payment.</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-pale-cyan text-teal"><UserRound size={22} /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-body-text">Selected profile</p>
                  <h2 className="text-lg font-bold text-navy">{selectedProfile.firstName} {selectedProfile.lastName}</h2>
                </div>
              </div>
              <span className="rounded-full bg-section-tint px-3 py-1 text-xs font-semibold text-navy">{isDependent ? "Dependent" : "Account owner"}</span>
            </div>
            <p className="mt-4 text-sm text-body-text">Patient number: <span className="font-semibold text-navy">{selectedProfile.patientNumber}</span></p>
            {dashboard.patient.dependents && dashboard.patient.dependents.length > 0 && (
              <label className="mt-4 block text-sm font-semibold text-navy" htmlFor="profile-select">
                Manage family profile
                <select
                  id="profile-select"
                  value={selectedProfileId}
                  onChange={(event) => setSelectedProfileId(event.target.value)}
                  className="mt-2 block w-full rounded-lg border border-border bg-white px-3 py-2 font-normal"
                >
                  <option value={dashboard.patient.id}>{dashboard.patient.firstName} {dashboard.patient.lastName} (Me)</option>
                  {dashboard.patient.dependents.map((dependent) => (
                    <option key={dependent.id} value={dependent.id}>{dependent.firstName} {dependent.lastName}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={saveProfile} className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-5 flex items-center gap-2"><UserRound className="text-teal" size={20} /><h2 className="text-lg font-bold text-navy">Profile and emergency details</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" value={profileForm.firstName} onChange={(value) => setProfileForm({ ...profileForm, firstName: value })} required />
              <Field label="Last name" value={profileForm.lastName} onChange={(value) => setProfileForm({ ...profileForm, lastName: value })} required />
              <Field label="Date of birth" type="date" value={profileForm.dateOfBirth} onChange={(value) => setProfileForm({ ...profileForm, dateOfBirth: value })} />
              <label className="text-sm font-semibold text-navy">Gender
                <select value={profileForm.gender} onChange={(event) => setProfileForm({ ...profileForm, gender: event.target.value })} className="mt-1 block w-full rounded-lg border border-border px-3 py-2 font-normal">
                  <option value="UNKNOWN">Prefer not to say</option><option value="FEMALE">Female</option><option value="MALE">Male</option><option value="OTHER">Other</option>
                </select>
              </label>
              <Field label="Phone" value={profileForm.phone} onChange={(value) => setProfileForm({ ...profileForm, phone: value })} />
              <Field label="National ID" value={profileForm.nationalId} onChange={(value) => setProfileForm({ ...profileForm, nationalId: value })} />
              <Field label="Emergency contact name" value={profileForm.emergencyContactName} onChange={(value) => setProfileForm({ ...profileForm, emergencyContactName: value })} />
              <Field label="Emergency contact phone" value={profileForm.emergencyContactPhone} onChange={(value) => setProfileForm({ ...profileForm, emergencyContactPhone: value })} />
              <div className="sm:col-span-2"><Field label="Insurance company" value={profileForm.insuranceProvider} onChange={(value) => setProfileForm({ ...profileForm, insuranceProvider: value })} /></div>
            </div>
            <button disabled={isSaving} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {isSaving && <LoaderCircle size={16} className="animate-spin" />}Save profile
            </button>
          </form>

          <div className="space-y-6">
            <HealthSection
              title="Allergies"
              items={selectedProfile.allergies}
              emptyText="No allergies recorded."
              onAdd={(event) => addHealthRecord("allergies", event)}
              onRemove={(id) => removeHealthRecord("allergies", id)}
              input={(
                <div className="grid gap-2 sm:grid-cols-3">
                  <input required aria-label="Allergen" placeholder="Allergen" value={allergy.allergen} onChange={(event) => setAllergy({ ...allergy, allergen: event.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm" />
                  <input aria-label="Reaction" placeholder="Reaction" value={allergy.reaction} onChange={(event) => setAllergy({ ...allergy, reaction: event.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm" />
                  <input aria-label="Severity" placeholder="Severity" value={allergy.severity} onChange={(event) => setAllergy({ ...allergy, severity: event.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm" />
                </div>
              )}
            />
            <HealthSection
              title="Chronic diseases and conditions"
              items={selectedProfile.medicalConditions}
              emptyText="No conditions recorded."
              onAdd={(event) => addHealthRecord("conditions", event)}
              onRemove={(id) => removeHealthRecord("conditions", id)}
              input={(
                <div className="grid gap-2 sm:grid-cols-2">
                  <input required aria-label="Condition name" placeholder="Condition name" value={condition.name} onChange={(event) => setCondition({ ...condition, name: event.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm" />
                  <input aria-label="Description" placeholder="Notes (optional)" value={condition.description} onChange={(event) => setCondition({ ...condition, description: event.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm" />
                </div>
              )}
            />
          </div>
        </section>

        {!isDependent && (
          <section className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-4 flex items-center gap-2"><UsersRound size={20} className="text-teal" /><h2 className="text-lg font-bold text-navy">Family profiles</h2></div>
            <p className="mb-4 text-sm text-body-text">Create and manage health profiles for children or dependents from your account. They do not have separate logins or cards.</p>
            <form onSubmit={addDependent} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input required aria-label="Dependent first name" placeholder="First name" value={dependentForm.firstName} onChange={(event) => setDependentForm({ ...dependentForm, firstName: event.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm" />
              <input required aria-label="Dependent last name" placeholder="Last name" value={dependentForm.lastName} onChange={(event) => setDependentForm({ ...dependentForm, lastName: event.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm" />
              <input aria-label="Dependent date of birth" type="date" value={dependentForm.dateOfBirth} onChange={(event) => setDependentForm({ ...dependentForm, dateOfBirth: event.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm" />
              <input aria-label="Dependent national ID" placeholder="National ID (optional)" value={dependentForm.nationalId} onChange={(event) => setDependentForm({ ...dependentForm, nationalId: event.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm" />
              <input aria-label="Dependent insurer" placeholder="Insurance company (optional)" value={dependentForm.insuranceProvider} onChange={(event) => setDependentForm({ ...dependentForm, insuranceProvider: event.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm" />
              <button disabled={isAddingDependent} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {isAddingDependent ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}Add dependent
              </button>
            </form>
            {dashboard.patient.dependents?.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dashboard.patient.dependents.map((dependent) => (
                  <button key={dependent.id} onClick={() => setSelectedProfileId(dependent.id)} className="flex items-center justify-between rounded-xl border border-border p-4 text-left hover:border-teal">
                    <span><span className="block font-semibold text-navy">{dependent.firstName} {dependent.lastName}</span><span className="text-xs text-body-text">DOB: {formatDate(dependent.dateOfBirth)}</span></span><UserRound size={18} className="text-teal" />
                  </button>
                ))}
              </div>
            ) : <p className="mt-4 text-sm text-body-text">No family profiles added yet.</p>}
          </section>
        )}

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-4 flex items-center gap-2"><FileText size={20} className="text-teal" /><h2 className="text-lg font-bold text-navy">Documents</h2></div>
            {selectedProfile.medicalDocuments.length ? (
              <ul className="space-y-3">
                {selectedProfile.medicalDocuments.map((document) => (
                  <li key={document.id} className="flex items-start justify-between gap-3 rounded-lg bg-section-tint p-3">
                    <div><p className="font-semibold text-navy">{document.title}</p><p className="text-xs text-body-text">{document.type} · {formatDate(document.createdAt)}</p>{document.description && <p className="mt-1 text-sm text-body-text">{document.description}</p>}</div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-body-text">No documents have been added by a care provider.</p>}
            <p className="mt-4 flex items-center gap-2 text-xs text-body-text"><LockKeyhole size={14} /> Patient document upload is not enabled yet; this list contains only actual records.</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-4 flex items-center gap-2"><HeartPulse size={20} className="text-teal" /><h2 className="text-lg font-bold text-navy">Insurance and access</h2></div>
            <p className="text-sm text-body-text">Insurance company: <strong className="text-navy">{selectedProfile.insuranceProvider || "Not provided"}</strong></p>
            {selectedProfile.patientInsurances.map((insurance) => (
              <p key={insurance.id} className="mt-2 rounded-lg bg-section-tint p-3 text-sm text-navy">
                {insurance.plan.provider.name} · {insurance.plan.name} · {insurance.status}
              </p>
            ))}
            <div className="mt-5 rounded-lg border border-teal/20 bg-pale-cyan p-4">
              <div className="flex items-center gap-2 font-semibold text-navy"><Clock3 size={17} className="text-teal" />Clinician access</div>
              <p className="mt-2 text-sm text-body-text">Clinicians can retrieve records only through the authenticated clinical system and its access permissions. An NFC card identifies the patient; it does not contain these health records.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-semibold text-navy">{label}
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full rounded-lg border border-border px-3 py-2 font-normal" />
    </label>
  );
}

function HealthSection({
  title,
  items,
  emptyText,
  input,
  onAdd,
  onRemove,
}: {
  title: string;
  items: HealthRecord[];
  emptyText: string;
  input: ReactNode;
  onAdd: (event: FormEvent<HTMLFormElement>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-navy">{title}</h2>
      {items.length ? <ul className="mb-4 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-section-tint px-3 py-2 text-sm">
            <span className="text-navy"><strong>{item.allergen || item.name}</strong>{item.reaction ? ` · ${item.reaction}` : ""}{item.severity ? ` · ${item.severity}` : ""}{item.description ? ` · ${item.description}` : ""}</span>
            <button type="button" onClick={() => onRemove(item.id)} className="shrink-0 text-xs font-semibold text-red-700 hover:underline">Remove</button>
          </li>
        ))}
      </ul> : <p className="mb-4 text-sm text-body-text">{emptyText}</p>}
      <form onSubmit={onAdd} className="space-y-3">
        {input}
        <button className="inline-flex items-center gap-2 rounded-lg border border-teal px-3 py-2 text-sm font-semibold text-teal hover:bg-pale-cyan"><Plus size={15} />Add record</button>
      </form>
    </section>
  );
}
