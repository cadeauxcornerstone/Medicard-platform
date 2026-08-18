import {
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ChevronRight,
  
  CreditCard,
  History,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wallet,
  XCircle,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_URL = "http://localhost:5000/api/v1";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface PatientContext {
  id: string;
  patientNumber?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  phone?: string | null;
}

interface Charge {
  id: string;
  patientId: string;
  encounterId: string;
  serviceId?: string;
  servicePriceId?: string;
  quantity: number;
  unitPrice: number | string;
  subtotal: number | string;
  insuranceAmount: number | string;
  patientAmount: number | string;
  currency: string;
  status: string;
  description?: string | null;
  createdAt: string;
  updatedAt?: string;
  service?: {
    id?: string;
    name?: string;
    code?: string;
  };
}

interface Wallet {
  id: string;
  patientId: string;
  balance: number | string;
  currency?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface WalletTransaction {
  id: string;
  walletId: string;
  type: string;
  amount: number | string;
  balanceBefore: number | string;
  balanceAfter: number | string;
  reference?: string | null;
  description?: string | null;
  createdAt: string;
}

interface Payment {
  id: string;
  chargeId: string;
  patientId: string;
  amount: number | string;
  currency: string;
  method: string;
  status: string;
  reference?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

interface ChargeBalance {
  chargeId: string;
  patientAmount: number;
  totalPaid: number;
  remainingBalance: number;
  status: string;
  currency: string;
}

interface PaymentResponse {
  payment: Payment;
  charge: Charge;
  wallet?: {
    balanceBefore: number;
    amountDebited: number;
    balanceAfter: number;
  };
  calculation?: {
    patientAmount: number;
    previouslyPaid: number;
    paymentAmount: number;
    remainingBalance: number;
  };
  alreadyProcessed?: boolean;
}

/*
|--------------------------------------------------------------------------
| LOCATION STATE
|--------------------------------------------------------------------------
*/

interface PaymentLocationState {
  patient?: PatientContext;
  patientId?: string;
  encounterId?: string;
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const toNumber = (
  value: number | string | null | undefined
) => {
  const number = Number(value ?? 0);

  return Number.isFinite(number)
    ? number
    : 0;
};

const formatRwf = (
  value: number | string | null | undefined
) => {
  return `${toNumber(value).toLocaleString("en-RW")} RWF`;
};

const formatDateTime = (
  value: string | null | undefined
) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getInitials = (
  firstName = "",
  lastName = ""
) => {
  return `${firstName[0] || ""}${lastName[0] || ""}`
    .toUpperCase();
};

const getChargeLabel = (
  charge: Charge
) => {
  return (
    charge.description ||
    charge.service?.name ||
    "Healthcare service"
  );
};

const getStatusLabel = (
  status: string
) => {
  switch (status) {
    case "PAID":
      return "Paid";

    case "PARTIALLY_PAID":
      return "Partially paid";

    case "INSURANCE_CALCULATED":
      return "Insurance calculated";

    case "PENDING":
      return "Pending";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        );
  }
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

function PaymentWorkspacePage() {
  const navigate = useNavigate();

  const location =
    useLocation();

  const [searchParams] =
    useSearchParams();

  const locationState =
    (location.state || {}) as PaymentLocationState;

  /*
  |--------------------------------------------------------------------------
  | PATIENT / ENCOUNTER CONTEXT
  |--------------------------------------------------------------------------
  |
  | Priority:
  |
  | 1. navigation state
  | 2. URL query parameters
  |
  | This means the patient does NOT need to tap the NFC card again.
  |
  */

  const patientId =
    locationState.patientId ||
    locationState.patient?.id ||
    searchParams.get("patientId") ||
    "";

  const encounterId =
    locationState.encounterId ||
    searchParams.get("encounterId") ||
    "";

  const [patient, setPatient] =
    useState<PatientContext | null>(
      locationState.patient || null
    );

  const [charges, setCharges] =
    useState<Charge[]>([]);

  const [wallet, setWallet] =
    useState<Wallet | null>(null);

  const [transactions, setTransactions] =
    useState<WalletTransaction[]>([]);

  const [, setPayments] =
    useState<Record<string, Payment[]>>(
      {}
    );

  const [balances, setBalances] =
    useState<Record<string, ChargeBalance>>(
      {}
    );

  const [selectedChargeId, setSelectedChargeId] =
    useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState("MEDCARD");

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentReference, setPaymentReference] =
    useState("");

  const [paymentNotes, setPaymentNotes] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [processingPayment, setProcessingPayment] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [lastPayment, setLastPayment] =
    useState<PaymentResponse | null>(null);

  const [activeTab, setActiveTab] =
    useState<"charges" | "transactions">(
      "charges"
    );

  /*
  |--------------------------------------------------------------------------
  | LOAD JSON HELPER
  |--------------------------------------------------------------------------
  */

  const request = useCallback(
    async <T,>(
      endpoint: string,
      options?: RequestInit
    ): Promise<T> => {
      const response =
        await fetch(
          `${API_URL}${endpoint}`,
          {
            ...options,

            headers: {
              "Content-Type":
                "application/json",

              ...(options?.headers || {}),
            },
          }
        );

      let body: any = null;

      try {
        body = await response.json();
      } catch {
        body = null;
      }

      if (!response.ok) {
        throw new Error(
          body?.message ||
            `Request failed with status ${response.status}`
        );
      }

      return body?.data as T;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD PATIENT
  |--------------------------------------------------------------------------
  */

  const loadPatient = useCallback(
    async () => {
      if (!patientId || patient) {
        return;
      }

      try {
        const data =
          await request<any>(
            `/patients/${patientId}`
          );

        const resolved =
          data?.patient ||
          data;

        if (resolved?.id) {
          setPatient(resolved);
        }
      } catch {
        /*
         * Patient context may already be supplied
         * by the Patient Workspace.
         */
      }
    },
    [
      patientId,
      patient,
      request,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD PAYMENT DATA
  |--------------------------------------------------------------------------
  */

  const loadData = useCallback(
    async (
      showRefresh = false
    ) => {
      if (!patientId || !encounterId) {
        setLoading(false);
        setError(
          "Payment context is missing. Open payment from the active patient workspace."
        );
        return;
      }

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [
          chargesData,
          walletData,
          transactionData,
        ] = await Promise.all([
          request<Charge[]>(
            `/encounters/${encounterId}/charges`
          ),

          request<Wallet>(
            `/patients/${patientId}/wallet`
          ),

          request<WalletTransaction[]>(
            `/patients/${patientId}/wallet/transactions`
          ),
        ]);

        const resolvedCharges =
          Array.isArray(chargesData)
            ? chargesData
            : [];

        setCharges(
          resolvedCharges
        );

        setWallet(
          walletData || null
        );

        setTransactions(
          Array.isArray(transactionData)
            ? transactionData
            : []
        );

        /*
        |--------------------------------------------------------------------------
        | Load charge balances
        |--------------------------------------------------------------------------
        */

        const balanceEntries =
          await Promise.all(
            resolvedCharges.map(
              async (charge) => {
                try {
                  const balance =
                    await request<ChargeBalance>(
                      `/charges/${charge.id}/balance`
                    );

                  return [
                    charge.id,
                    balance,
                  ] as const;
                } catch {
                  return [
                    charge.id,
                    {
                      chargeId:
                        charge.id,

                      patientAmount:
                        toNumber(
                          charge.patientAmount
                        ),

                      totalPaid: 0,

                      remainingBalance:
                        toNumber(
                          charge.patientAmount
                        ),

                      status:
                        charge.status,

                      currency:
                        charge.currency ||
                        "RWF",
                    },
                  ] as const;
                }
              }
            )
          );

        setBalances(
          Object.fromEntries(
            balanceEntries
          )
        );

        /*
        |--------------------------------------------------------------------------
        | Load payment histories
        |--------------------------------------------------------------------------
        */

        const paymentEntries =
          await Promise.all(
            resolvedCharges.map(
              async (charge) => {
                try {
                  const data =
                    await request<Payment[]>(
                      `/charges/${charge.id}/payments`
                    );

                  return [
                    charge.id,
                    Array.isArray(data)
                      ? data
                      : [],
                  ] as const;
                } catch {
                  return [
                    charge.id,
                    [],
                  ] as const;
                }
              }
            )
          );

        setPayments(
          Object.fromEntries(
            paymentEntries
          )
        );

        /*
        |--------------------------------------------------------------------------
        | Automatically select first outstanding charge
        |--------------------------------------------------------------------------
        */

        setSelectedChargeId(
          (current) => {
            if (
              current &&
              resolvedCharges.some(
                (charge) =>
                  charge.id === current
              )
            ) {
              return current;
            }

            const outstanding =
              resolvedCharges.find(
                (charge) => {
                  const balance =
                    balances[charge.id];

                  if (balance) {
                    return (
                      balance.remainingBalance >
                      0
                    );
                  }

                  return (
                    toNumber(
                      charge.patientAmount
                    ) > 0 &&
                    charge.status !==
                      "PAID"
                  );
                }
              );

            return (
              outstanding?.id ||
              resolvedCharges[0]?.id ||
              null
            );
          }
        );
      } catch (loadError: any) {
        setError(
          loadError?.message ||
            "Unable to load payment information."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      patientId,
      encounterId,
      request,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /*
  |--------------------------------------------------------------------------
  | SELECTED CHARGE
  |--------------------------------------------------------------------------
  */

  const selectedCharge =
    useMemo(
      () =>
        charges.find(
          (charge) =>
            charge.id ===
            selectedChargeId
        ) || null,
      [
        charges,
        selectedChargeId,
      ]
    );

  const selectedBalance =
    selectedCharge
      ? balances[
          selectedCharge.id
        ]
      : null;

  /*
  |--------------------------------------------------------------------------
  | TOTALS
  |--------------------------------------------------------------------------
  */

  const totals =
    useMemo(() => {
      return charges.reduce(
        (result, charge) => {
          result.total +=
            toNumber(
              charge.subtotal
            );

          result.insurance +=
            toNumber(
              charge.insuranceAmount
            );

          result.patient +=
            toNumber(
              charge.patientAmount
            );

          const balance =
            balances[charge.id];

          if (balance) {
            result.paid +=
              balance.totalPaid;

            result.remaining +=
              balance.remainingBalance;
          } else if (
            charge.status !== "PAID"
          ) {
            result.remaining +=
              toNumber(
                charge.patientAmount
              );
          }

          return result;
        },
        {
          total: 0,
          insurance: 0,
          patient: 0,
          paid: 0,
          remaining: 0,
        }
      );
    }, [
      charges,
      balances,
    ]);

  /*
  |--------------------------------------------------------------------------
  | PAYMENT AMOUNT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!selectedCharge) {
      setPaymentAmount("");
      return;
    }

    const balance =
      balances[
        selectedCharge.id
      ];

    const amount =
      balance?.remainingBalance ??
      toNumber(
        selectedCharge.patientAmount
      );

    if (amount > 0) {
      setPaymentAmount(
        String(amount)
      );
    } else {
      setPaymentAmount("");
    }
  }, [
    selectedCharge,
    balances,
  ]);

  /*
  |--------------------------------------------------------------------------
  | PAYMENT VALIDATION
  |--------------------------------------------------------------------------
  */

  const numericPaymentAmount =
    Number(paymentAmount);

  const walletBalance =
    toNumber(
      wallet?.balance
    );

  const paymentExceedsWallet =
    paymentMethod ===
      "MEDCARD" &&
    numericPaymentAmount >
      walletBalance;

  const paymentExceedsCharge =
    selectedBalance
      ? numericPaymentAmount >
        selectedBalance.remainingBalance
      : selectedCharge
        ? numericPaymentAmount >
          toNumber(
            selectedCharge.patientAmount
          )
        : false;

  const canPay =
    Boolean(
      selectedCharge &&
      numericPaymentAmount > 0 &&
      !paymentExceedsWallet &&
      !paymentExceedsCharge &&
      !processingPayment
    );

  /*
  |--------------------------------------------------------------------------
  | CREATE PAYMENT
  |--------------------------------------------------------------------------
  */

  const handlePayment =
    async () => {
      if (
        !selectedCharge ||
        !canPay
      ) {
        return;
      }

      try {
        setProcessingPayment(true);
        setError("");
        setSuccessMessage("");
        setLastPayment(null);

        const reference =
          paymentReference.trim() ||
          `MC-${Date.now()}`;

        const result =
          await request<PaymentResponse>(
            `/charges/${selectedCharge.id}/payments`,
            {
              method: "POST",

              body: JSON.stringify({
                patientId,

                amount:
                  numericPaymentAmount,

                method:
                  paymentMethod,

                reference,

                notes:
                  paymentNotes.trim() ||
                  "MedCard payment",
              }),
            }
          );

        setLastPayment(
          result
        );

        setSuccessMessage(
          result.alreadyProcessed
            ? "This payment reference was already processed."
            : "Payment completed successfully."
        );

        setPaymentReference("");
        setPaymentNotes("");

        await loadData(
          true
        );
      } catch (paymentError: any) {
        setError(
          paymentError?.message ||
            "Payment could not be completed."
        );
      } finally {
        setProcessingPayment(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | STATUS CLASS
  |--------------------------------------------------------------------------
  */

  const getChargeStatusClass =
    (status: string) => {
      switch (status) {
        case "PAID":
          return "payment-status-paid";

        case "PARTIALLY_PAID":
          return "payment-status-partial";

        case "CANCELLED":
          return "payment-status-cancelled";

        default:
          return "payment-status-pending";
      }
    };

  /*
  |--------------------------------------------------------------------------
  | MISSING CONTEXT
  |--------------------------------------------------------------------------
  */

  if (!patientId || !encounterId) {
    return (
      <div className="payment-page">
        <header className="payment-page-header">
          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate(-1)
            }
          >
            <ArrowLeft
              size={18}
            />
            Back
          </button>

          <div className="payment-brand">
            <div className="payment-brand-mark">
              <CreditCard
                size={20}
              />
            </div>

            <div>
              <strong>
                Med<span>Card</span>
              </strong>

              <small>
                Secure healthcare payments
              </small>
            </div>
          </div>
        </header>

        <main className="payment-empty-state">
          <div className="payment-empty-icon">
            <CreditCard
              size={32}
            />
          </div>

          <h1>
            Payment context unavailable
          </h1>

          <p>
            Open the payment workspace
            from an active patient
            encounter. You do not need
            to scan the MedCard again.
          </p>

          <button
            type="button"
            className="payment-primary-button"
            onClick={() =>
              navigate(-1)
            }
          >
            <ArrowLeft
              size={18}
            />
            Return to patient
          </button>
        </main>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="payment-page">

      {/* HEADER */}

      <header className="payment-page-header">

        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate(-1)
          }
        >
          <ArrowLeft
            size={18}
          />

          Back to patient
        </button>

        <div className="payment-brand">

          <div className="payment-brand-mark">
            <CreditCard
              size={20}
            />
          </div>

          <div>
            <strong>
              Med<span>Card</span>
            </strong>

            <small>
              Secure healthcare payments
            </small>
          </div>

        </div>

        <div className="payment-header-security">
          <ShieldCheck
            size={16}
          />

          Secure transaction
        </div>

      </header>


      {/* MAIN */}

      <main className="payment-content">

        {/* PAGE INTRO */}

        <section className="payment-intro">

          <div>

            <span className="payment-eyebrow">
              PAYMENT WORKSPACE
            </span>

            <h1>
              Healthcare checkout
            </h1>

            <p>
              Review insurance coverage,
              confirm the patient's
              responsibility and complete
              payment securely.
            </p>

          </div>

          <button
            type="button"
            className="payment-refresh-button"
            onClick={() =>
              loadData(true)
            }
            disabled={
              refreshing
            }
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "payment-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </section>


        {/* ERROR */}

        {error && (
          <div className="payment-alert payment-alert-error">

            <XCircle
              size={19}
            />

            <div>
              <strong>
                Payment action failed
              </strong>

              <span>
                {error}
              </span>
            </div>

          </div>
        )}


        {/* SUCCESS */}

        {successMessage && (
          <div className="payment-alert payment-alert-success">

            <CheckCircle2
              size={20}
            />

            <div>
              <strong>
                {successMessage}
              </strong>

              {lastPayment?.payment && (
                <span>
                  Reference:{" "}
                  {lastPayment.payment.reference ||
                    lastPayment.payment.id}
                </span>
              )}
            </div>

          </div>
        )}


        {/* PATIENT SUMMARY */}

        <section className="payment-patient-card">

          <div className="payment-patient-avatar">

            {getInitials(
              patient?.firstName ||
                "Patient",
              patient?.lastName ||
                ""
            )}

          </div>

          <div className="payment-patient-info">

            <span>
              CURRENT PATIENT
            </span>

            <strong>
              {patient?.firstName ||
                "Patient"}{" "}
              {patient?.lastName ||
                ""}
            </strong>

            <small>
              {patient?.patientNumber ||
                patientId}
            </small>

          </div>

          <div className="payment-patient-meta">

            <div>
              <span>
                Encounter
              </span>

              <strong>
                {encounterId.slice(
                  0,
                  8
                )}
                ...
              </strong>
            </div>

            <div>
              <span>
                Insurance
              </span>

              <strong className="payment-insurance-active">
                Active
              </strong>
            </div>

          </div>

          <div className="payment-nfc-note">

            <CheckCircle2
              size={16}
            />

            <span>
              Patient already identified
            </span>

          </div>

        </section>


        {/* FINANCIAL OVERVIEW */}

        <section className="payment-stat-grid">

          <div className="payment-stat-card">

            <div className="payment-stat-icon">
              <Banknote
                size={19}
              />
            </div>

            <div>
              <span>
                Total services
              </span>

              <strong>
                {formatRwf(
                  totals.total
                )}
              </strong>
            </div>

          </div>


          <div className="payment-stat-card">

            <div className="payment-stat-icon">
              <ShieldCheck
                size={19}
              />
            </div>

            <div>
              <span>
                Insurance covered
              </span>

              <strong>
                {formatRwf(
                  totals.insurance
                )}
              </strong>
            </div>

          </div>


          <div className="payment-stat-card">

            <div className="payment-stat-icon">
              <CreditCard
                size={19}
              />
            </div>

            <div>
              <span>
                Patient responsibility
              </span>

              <strong>
                {formatRwf(
                  totals.patient
                )}
              </strong>
            </div>

          </div>


          <div className="payment-stat-card payment-stat-highlight">

            <div className="payment-stat-icon">
              <Wallet
                size={19}
              />
            </div>

            <div>
              <span>
                Outstanding
              </span>

              <strong>
                {formatRwf(
                  totals.remaining
                )}
              </strong>
            </div>

          </div>

        </section>


        {/* TABS */}

        <div className="payment-tabs">

          <button
            type="button"
            className={
              activeTab === "charges"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "charges"
              )
            }
          >
            <CreditCard
              size={17}
            />

            Charges

            <span>
              {charges.length}
            </span>
          </button>

          <button
            type="button"
            className={
              activeTab ===
              "transactions"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "transactions"
              )
            }
          >
            <History
              size={17}
            />

            Wallet activity

            <span>
              {transactions.length}
            </span>
          </button>

        </div>


        {loading ? (

          <div className="payment-loading">

            <LoaderCircle
              size={28}
              className="payment-spin"
            />

            <strong>
              Loading payment information...
            </strong>

            <span>
              Retrieving charges,
              insurance and wallet
              information.
            </span>

          </div>

        ) : activeTab ===
          "charges" ? (

          <div className="payment-workspace-grid">

            {/* CHARGES */}

            <section className="payment-panel">

              <div className="payment-panel-header">

                <div>

                  <span className="payment-section-label">
                    ENCOUNTER CHARGES
                  </span>

                  <h2>
                    Services to settle
                  </h2>

                </div>

                <span className="payment-panel-count">
                  {charges.length}{" "}
                  {charges.length === 1
                    ? "service"
                    : "services"}
                </span>

              </div>


              {charges.length === 0 ? (

                <div className="payment-no-data">

                  <CheckCircle2
                    size={30}
                  />

                  <strong>
                    No charges found
                  </strong>

                  <span>
                    There are no billable
                    services for this
                    encounter yet.
                  </span>

                </div>

              ) : (

                <div className="payment-charge-list">

                  {charges.map(
                    (charge) => {

                      const balance =
                        balances[
                          charge.id
                        ];

                      const remaining =
                        balance?.remainingBalance ??
                        toNumber(
                          charge.patientAmount
                        );

                      const selected =
                        charge.id ===
                        selectedChargeId;

                      return (

                        <button
                          key={
                            charge.id
                          }
                          type="button"
                          className={
                            selected
                              ? "payment-charge-card selected"
                              : "payment-charge-card"
                          }
                          onClick={() =>
                            setSelectedChargeId(
                              charge.id
                            )
                          }
                        >

                          <div className="payment-charge-leading">

                            <div className="payment-charge-icon">

                              <CreditCard
                                size={19}
                              />

                            </div>

                          </div>


                          <div className="payment-charge-main">

                            <div className="payment-charge-title-row">

                              <strong>
                                {getChargeLabel(
                                  charge
                                )}
                              </strong>

                              <span
                                className={`payment-status ${getChargeStatusClass(
                                  charge.status
                                )}`}
                              >
                                {getStatusLabel(
                                  charge.status
                                )}
                              </span>

                            </div>


                            <div className="payment-charge-details">

                              <span>
                                Total{" "}
                                {formatRwf(
                                  charge.subtotal
                                )}
                              </span>

                              <span>
                                Insurance{" "}
                                {formatRwf(
                                  charge.insuranceAmount
                                )}
                              </span>

                              <span>
                                Patient{" "}
                                {formatRwf(
                                  charge.patientAmount
                                )}
                              </span>

                            </div>


                            <div className="payment-charge-bottom">

                              <span>
                                Remaining
                              </span>

                              <strong>
                                {formatRwf(
                                  remaining
                                )}
                              </strong>

                            </div>

                          </div>


                          <ChevronRight
                            size={19}
                            className="payment-charge-arrow"
                          />

                        </button>

                      );
                    }
                  )}

                </div>

              )}

            </section>


            {/* CHECKOUT */}

            <section className="payment-checkout-panel">

              <div className="payment-checkout-header">

                <div className="payment-checkout-icon">

                  <Wallet
                    size={22}
                  />

                </div>

                <div>

                  <span>
                    CHECKOUT
                  </span>

                  <h2>
                    Complete payment
                  </h2>

                </div>

              </div>


              {selectedCharge ? (

                <>

                  {/* SELECTED SERVICE */}

                  <div className="payment-selected-service">

                    <span>
                      SELECTED SERVICE
                    </span>

                    <strong>
                      {getChargeLabel(
                        selectedCharge
                      )}
                    </strong>

                    <small>
                      {formatDateTime(
                        selectedCharge.createdAt
                      )}
                    </small>

                  </div>


                  {/* BREAKDOWN */}

                  <div className="payment-breakdown">

                    <div>
                      <span>
                        Service total
                      </span>

                      <strong>
                        {formatRwf(
                          selectedCharge.subtotal
                        )}
                      </strong>
                    </div>

                    <div className="payment-breakdown-insurance">

                      <span>
                        Insurance coverage
                      </span>

                      <strong>
                        −{" "}
                        {formatRwf(
                          selectedCharge.insuranceAmount
                        )}
                      </strong>

                    </div>

                    <div className="payment-breakdown-total">

                      <span>
                        Patient responsibility
                      </span>

                      <strong>
                        {formatRwf(
                          selectedBalance?.remainingBalance ??
                            selectedCharge.patientAmount
                        )}
                      </strong>

                    </div>

                  </div>


                  {/* WALLET */}

                  <div className="payment-wallet-card">

                    <div className="payment-wallet-top">

                      <div className="payment-wallet-icon">

                        <Wallet
                          size={18}
                        />

                      </div>

                      <div>

                        <span>
                          MEDCARD WALLET
                        </span>

                        <strong>
                          {formatRwf(
                            wallet?.balance
                          )}
                        </strong>

                      </div>

                    </div>

                    <div className="payment-wallet-status">

                      {wallet?.status ===
                      "ACTIVE" ? (
                        <>
                          <CheckCircle2
                            size={14}
                          />

                          Wallet active
                        </>
                      ) : (
                        <>
                          <XCircle
                            size={14}
                          />

                          Wallet{" "}
                          {wallet?.status ||
                            "unavailable"}
                        </>
                      )}

                    </div>

                  </div>


                  {/* PAYMENT METHOD */}

                  <div className="payment-form-section">

                    <label>
                      Payment method
                    </label>

                    <div className="payment-method-grid">

                      <button
                        type="button"
                        className={
                          paymentMethod ===
                          "MEDCARD"
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          setPaymentMethod(
                            "MEDCARD"
                          )
                        }
                      >
                        <Wallet
                          size={19}
                        />

                        <span>
                          MedCard Wallet
                        </span>

                        <small>
                          Instant
                        </small>

                      </button>


                      <button
                        type="button"
                        className={
                          paymentMethod ===
                          "MOBILE_MONEY"
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          setPaymentMethod(
                            "MOBILE_MONEY"
                          )
                        }
                      >
                        <Smartphone
                          size={19}
                        />

                        <span>
                          Mobile Money
                        </span>

                        <small>
                          MTN / Airtel
                        </small>

                      </button>


                      <button
                        type="button"
                        className={
                          paymentMethod ===
                          "CARD"
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          setPaymentMethod(
                            "CARD"
                          )
                        }
                      >
                        <CreditCard
                          size={19}
                        />

                        <span>
                          Bank Card
                        </span>

                        <small>
                          Card payment
                        </small>

                      </button>


                      <button
                        type="button"
                        className={
                          paymentMethod ===
                          "CASH"
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          setPaymentMethod(
                            "CASH"
                          )
                        }
                      >
                        <Banknote
                          size={19}
                        />

                        <span>
                          Cash
                        </span>

                        <small>
                          At facility
                        </small>

                      </button>

                    </div>

                  </div>


                  {/* AMOUNT */}

                  <div className="payment-form-section">

                    <label htmlFor="paymentAmount">
                      Amount to pay
                    </label>

                    <div className="payment-amount-input">

                      <input
                        id="paymentAmount"
                        type="number"
                        min="1"
                        step="1"
                        value={
                          paymentAmount
                        }
                        onChange={(event) =>
                          setPaymentAmount(
                            event.target
                              .value
                          )
                        }
                      />

                      <span>
                        RWF
                      </span>

                    </div>


                    {paymentExceedsCharge && (
                      <small className="payment-field-error">
                        Amount exceeds the
                        outstanding charge
                        balance.
                      </small>
                    )}

                    {paymentExceedsWallet && (
                      <small className="payment-field-error">
                        Insufficient MedCard
                        wallet balance.
                      </small>
                    )}

                  </div>


                  {/* OPTIONAL REFERENCE */}

                  <div className="payment-form-section">

                    <label htmlFor="paymentReference">
                      Reference{" "}
                      <span>
                        optional
                      </span>
                    </label>

                    <input
                      id="paymentReference"
                      className="payment-text-input"
                      type="text"
                      placeholder="Auto-generated if empty"
                      value={
                        paymentReference
                      }
                      onChange={(event) =>
                        setPaymentReference(
                          event.target
                            .value
                        )
                      }
                    />

                  </div>


                  {/* NOTES */}

                  <div className="payment-form-section">

                    <label htmlFor="paymentNotes">
                      Payment note{" "}
                      <span>
                        optional
                      </span>
                    </label>

                    <textarea
                      id="paymentNotes"
                      className="payment-textarea"
                      rows={2}
                      placeholder="Add a note for this transaction..."
                      value={
                        paymentNotes
                      }
                      onChange={(event) =>
                        setPaymentNotes(
                          event.target
                            .value
                        )
                      }
                    />

                  </div>


                  {/* PAY BUTTON */}

                  <button
                    type="button"
                    className="payment-primary-button payment-submit-button"
                    onClick={
                      handlePayment
                    }
                    disabled={
                      !canPay
                    }
                  >

                    {processingPayment ? (
                      <>
                        <LoaderCircle
                          size={19}
                          className="payment-spin"
                        />

                        Processing payment...
                      </>
                    ) : (
                      <>
                        <LockKeyhole
                          size={18}
                        />

                        Pay{" "}
                        {formatRwf(
                          numericPaymentAmount
                        )}
                      </>
                    )}

                  </button>


                  <div className="payment-secure-note">

                    <ShieldCheck
                      size={15}
                    />

                    <span>
                      Your transaction is
                      securely recorded in
                      the MedCard payment
                      ledger.
                    </span>

                  </div>

                </>

              ) : (

                <div className="payment-select-message">

                  <CreditCard
                    size={30}
                  />

                  <strong>
                    Select a charge
                  </strong>

                  <span>
                    Choose a service from
                    the list to begin
                    checkout.
                  </span>

                </div>

              )}

            </section>

          </div>

        ) : (

          /* TRANSACTIONS */

          <section className="payment-panel">

            <div className="payment-panel-header">

              <div>

                <span className="payment-section-label">
                  WALLET ACTIVITY
                </span>

                <h2>
                  Recent transactions
                </h2>

              </div>

              <div className="payment-wallet-header-balance">

                <Wallet
                  size={17}
                />

                {formatRwf(
                  wallet?.balance
                )}

              </div>

            </div>


            {transactions.length ===
            0 ? (

              <div className="payment-no-data">

                <History
                  size={30}
                />

                <strong>
                  No wallet transactions
                </strong>

                <span>
                  Wallet activity will
                  appear here after
                  payments or top-ups.
                </span>

              </div>

            ) : (

              <div className="payment-transaction-list">

                {transactions.map(
                  (transaction) => {

                    const isCredit =
                      transaction.type ===
                        "CREDIT" ||
                      transaction.type ===
                        "REFUND" ||
                      transaction.type ===
                        "TOP_UP";

                    return (

                      <div
                        key={
                          transaction.id
                        }
                        className="payment-transaction-row"
                      >

                        <div
                          className={
                            isCredit
                              ? "payment-transaction-icon credit"
                              : "payment-transaction-icon debit"
                          }
                        >

                          <ArrowUpRight
                            size={17}
                          />

                        </div>


                        <div className="payment-transaction-main">

                          <strong>
                            {transaction.description ||
                              transaction.type}
                          </strong>

                          <span>
                            {formatDateTime(
                              transaction.createdAt
                            )}
                          </span>

                          {transaction.reference && (
                            <small>
                              Ref:{" "}
                              {
                                transaction.reference
                              }
                            </small>
                          )}

                        </div>


                        <div className="payment-transaction-amount">

                          <strong
                            className={
                              isCredit
                                ? "credit"
                                : "debit"
                            }
                          >
                            {isCredit
                              ? "+"
                              : "−"}
                            {formatRwf(
                              transaction.amount
                            )}
                          </strong>

                          <span>
                            Balance{" "}
                            {formatRwf(
                              transaction.balanceAfter
                            )}
                          </span>

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            )}

          </section>

        )}


        {/* LAST PAYMENT RECEIPT */}

        {lastPayment?.payment && (

          <section className="payment-receipt-card">

            <div className="payment-receipt-success">

              <CheckCircle2
                size={27}
              />

            </div>

            <div className="payment-receipt-main">

              <span>
                PAYMENT COMPLETED
              </span>

              <h2>
                {formatRwf(
                  lastPayment.payment.amount
                )}
              </h2>

              <p>
                {lastPayment.payment.method ===
                "MEDCARD"
                  ? "Paid from MedCard Wallet"
                  : `Paid via ${lastPayment.payment.method}`}
              </p>

            </div>

            <div className="payment-receipt-details">

              <div>
                <span>
                  Reference
                </span>

                <strong>
                  {lastPayment.payment.reference ||
                    lastPayment.payment.id}
                </strong>
              </div>

              <div>
                <span>
                  Date
                </span>

                <strong>
                  {formatDateTime(
                    lastPayment.payment.paidAt ||
                      lastPayment.payment.createdAt
                  )}
                </strong>
              </div>

              {lastPayment.wallet && (
                <div>
                  <span>
                    Wallet balance
                  </span>

                  <strong>
                    {formatRwf(
                      lastPayment.wallet.balanceAfter
                    )}
                  </strong>
                </div>
              )}

            </div>

          </section>

        )}


        {/* FOOTER SECURITY */}

        <footer className="payment-footer">

          <div>

            <ShieldCheck
              size={17}
            />

            <span>
              MedCard payment records are
              securely linked to the
              patient's healthcare encounter.
            </span>

          </div>

          <span>
            Transaction processing
            powered by MedCard
          </span>

        </footer>

      </main>

    </div>
  );
}

export default PaymentWorkspacePage;