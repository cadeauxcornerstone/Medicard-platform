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

import { socket } from "../services/socket";


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


/*
|--------------------------------------------------------------------------
| PAYMENT INTENT
|--------------------------------------------------------------------------
|
| This represents the payment request created by the facility.
|
| IMPORTANT:
|
| Creating this object does NOT debit the wallet.
|
| The wallet is only touched after the patient's
| second NFC tap.
|
*/

interface PaymentIntent {
  id: string;
  chargeId: string;
  patientId: string;
  facilityId: string;
  createdById?: string | null;
  amount: number | string;
  currency: string;
  status:
    | "READY_FOR_TAP"
    | "CARD_DETECTED"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "EXPIRED"
    | "CANCELLED"
    | string;
  reference: string;
  expiresAt: string;
  paymentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}


interface PaymentResponse {
  payment?: Payment;

  charge?: Charge;

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

  paymentIntent?: PaymentIntent;

  result?: any;
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
  | The patient has already tapped their card during
  | identification.
  |
  | Therefore the patient does NOT need to tap again
  | merely to open this workspace.
  |
  | The second tap is ONLY for payment.
  |
  |--------------------------------------------------------------------------
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


  /*
  |--------------------------------------------------------------------------
  | SECOND NFC TAP STATE
  |--------------------------------------------------------------------------
  |
  | paymentIntent:
  |     The active payment request.
  |
  | waitingForSecondTap:
  |     The facility has requested payment and we are
  |     waiting for the patient's physical NFC tap.
  |
  | secondTapCardUid:
  |     UID received from the NFC reader.
  |
  |--------------------------------------------------------------------------
  */

  const [paymentIntent, setPaymentIntent] =
    useState<PaymentIntent | null>(null);


  const [waitingForSecondTap, setWaitingForSecondTap] =
    useState(false);


  const [secondTapCardUid, setSecondTapCardUid] =
    useState<string | null>(null);


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
        | LOAD CHARGE BALANCES
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
        | LOAD PAYMENT HISTORIES
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
        | AUTOMATICALLY SELECT FIRST OUTSTANDING CHARGE
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
  | SECOND NFC TAP
  |--------------------------------------------------------------------------
  |
  | THIS IS THE IMPORTANT PART.
  |
  | The first NFC tap identified the patient.
  |
  | The second NFC tap happens only after the
  | facility creates a READY_FOR_TAP payment intent.
  |
  | The NFC bridge emits patient:identified.
  |
  | We extract the card UID from that event and send it
  | to the payment-intent process endpoint.
  |
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (
      !waitingForSecondTap ||
      !paymentIntent
    ) {
      return;
    }


    const handleSecondTap = async (
      event: any
    ) => {

      const cardUid =
        event?.data?.card?.cardUid ||
        event?.cardUid ||
        event?.data?.cardUid;


      if (
        !cardUid ||
        secondTapCardUid
      ) {
        return;
      }


      try {

        setSecondTapCardUid(
          cardUid
        );

        setProcessingPayment(true);

        setError("");

        setSuccessMessage(
          "MedCard detected. Processing payment..."
        );


        /*
        |--------------------------------------------------------------------------
        | PROCESS SECOND TAP
        |--------------------------------------------------------------------------
        */

        const result =
          await request<any>(
            `/payment-intents/${paymentIntent.id}/process`,
            {
              method: "POST",

              body: JSON.stringify({
                cardUid,
              }),
            }
          );


        /*
        |--------------------------------------------------------------------------
        | PAYMENT SUCCESS
        |--------------------------------------------------------------------------
        */

        setWaitingForSecondTap(false);

        setPaymentIntent(null);

        setSecondTapCardUid(null);


        /*
        | The backend returns the actual payment
        | inside the result.
        */

        const paymentResponse: PaymentResponse =
          result?.payment
            ? result
            : {
                payment:
                  result?.result?.payment ||
                  result?.payment,

                wallet:
                  result?.result?.wallet,

                calculation:
                  result?.result?.calculation,

                alreadyProcessed:
                  result?.alreadyProcessed,

                paymentIntent:
                  result?.paymentIntent,

                result,
              };


        setLastPayment(
          paymentResponse
        );


        setSuccessMessage(
          result?.alreadyProcessed
            ? "This payment was already completed."
            : "Payment completed successfully."
        );


        setPaymentReference("");

        setPaymentNotes("");


        /*
        |--------------------------------------------------------------------------
        | REFRESH WALLET + CHARGES
        |--------------------------------------------------------------------------
        */

        await loadData(true);


      } catch (paymentError: any) {

        setSecondTapCardUid(null);


        const message =
          paymentError?.message ||
          "Payment could not be completed.";


        /*
        |--------------------------------------------------------------------------
        | EXPIRED PAYMENT INTENT
        |--------------------------------------------------------------------------
        */

        if (
          message
            .toLowerCase()
            .includes("expired")
        ) {

          setWaitingForSecondTap(false);

          setPaymentIntent(null);

        }


        setError(message);


      } finally {

        setProcessingPayment(false);

      }

    };


    /*
    |--------------------------------------------------------------------------
    | LISTEN FOR NFC IDENTIFICATION
    |--------------------------------------------------------------------------
    */

    socket.on(
      "patient:identified",
      handleSecondTap
    );


    return () => {

      socket.off(
        "patient:identified",
        handleSecondTap
      );

    };

  }, [
    waitingForSecondTap,
    paymentIntent,
    secondTapCardUid,
    request,
    loadData,
  ]);

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


  /*
  |--------------------------------------------------------------------------
  | PAYMENT INTENT ACTIVE
  |--------------------------------------------------------------------------
  */

  const paymentIntentActive =
    Boolean(
      paymentIntent &&
      paymentIntent.status ===
        "READY_FOR_TAP"
    );


  /*
  |--------------------------------------------------------------------------
  | CAN CREATE PAYMENT INTENT
  |--------------------------------------------------------------------------
  */

  const canPreparePayment =
    Boolean(
      selectedCharge &&
      paymentMethod === "MEDCARD" &&
      numericPaymentAmount > 0 &&
      !paymentExceedsWallet &&
      !paymentExceedsCharge &&
      !processingPayment &&
      !paymentIntentActive
    );


  /*
  |--------------------------------------------------------------------------
  | CREATE PAYMENT INTENT
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | This function does NOT debit the wallet.
  |
  | It creates:
  |
  | READY_FOR_TAP
  |
  | Then the patient physically taps the MedCard.
  |
  |--------------------------------------------------------------------------
  */

  const handlePayment =
    async () => {

      if (
        !selectedCharge ||
        !canPreparePayment
      ) {
        return;
      }


      try {

        setProcessingPayment(true);

        setError("");

        setSuccessMessage("");

        setLastPayment(null);


        /*
        |--------------------------------------------------------------------------
        | CREATE PAYMENT INTENT
        |--------------------------------------------------------------------------
        */

        const result =
          await request<PaymentIntent>(
            `/payment-intents`,
            {
              method: "POST",

              body: JSON.stringify({

                chargeId:
                  selectedCharge.id,

                patientId,

                /*
                |----------------------------------------------------------------
                | Prototype facility
                |----------------------------------------------------------------
                |
                | Your backend currently accepts facilityId from
                | the request body when authentication is not yet
                | providing req.user.facilityId.
                |
                */

                facilityId:
                  "9e268cfd-1e17-47cf-aadb-be42c58ad79f",

              }),
            }
          );


        /*
        |--------------------------------------------------------------------------
        | PAYMENT INTENT CREATED
        |--------------------------------------------------------------------------
        */

        setPaymentIntent(
          result
        );


        /*
        |--------------------------------------------------------------------------
        | WAIT FOR SECOND NFC TAP
        |--------------------------------------------------------------------------
        */

        setWaitingForSecondTap(
          true
        );


        setSecondTapCardUid(
          null
        );


        setSuccessMessage(
          "Payment request ready. Ask the patient to tap their MedCard."
        );


      } catch (paymentError: any) {

        setError(
          paymentError?.message ||
          "Unable to prepare the payment."
        );

      } finally {

        setProcessingPayment(
          false
        );

      }

    };


  /*
  |--------------------------------------------------------------------------
  | CANCEL ACTIVE PAYMENT INTENT
  |--------------------------------------------------------------------------
  |
  | This is useful if the patient does not want to pay,
  | the wrong charge was selected, or the facility wants
  | to create another payment request.
  |
  |--------------------------------------------------------------------------
  */

  const handleCancelPaymentIntent =
    async () => {

      if (!paymentIntent) {
        return;
      }


      try {

        setProcessingPayment(true);

        setError("");


        await request<PaymentIntent>(
          `/payment-intents/${paymentIntent.id}/cancel`,
          {
            method: "POST",
          }
        );


        setPaymentIntent(
          null
        );


        setWaitingForSecondTap(
          false
        );


        setSecondTapCardUid(
          null
        );


        setSuccessMessage(
          "Payment request cancelled."
        );


      } catch (cancelError: any) {

        setError(
          cancelError?.message ||
          "Unable to cancel the payment request."
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
              refreshing ||
              waitingForSecondTap
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


        /*
        |--------------------------------------------------------------------------
        | SECOND TAP PAYMENT BANNER
        |--------------------------------------------------------------------------
        */

        {waitingForSecondTap &&
          paymentIntent && (

          <section className="payment-second-tap-card">

            <div className="payment-second-tap-icon">

              {processingPayment ? (

                <LoaderCircle
                  size={28}
                  className="payment-spin"
                />

              ) : (

                <CreditCard
                  size={28}
                />

              )}

            </div>


            <div className="payment-second-tap-content">

              <span className="payment-section-label">

                PATIENT ACTION REQUIRED

              </span>


              <h2>

                {processingPayment
                  ? "Processing MedCard..."
                  : "Ask patient to tap MedCard"}

              </h2>


              <p>

                Payment of{" "}

                <strong>
                  {formatRwf(
                    paymentIntent.amount
                  )}
                </strong>{" "}

                is ready.

                Place the patient's
                MedCard on the NFC reader
                to authorize the payment.

              </p>


              {secondTapCardUid && (

                <small>

                  Card detected:{" "}

                  <strong>
                    {secondTapCardUid}
                  </strong>

                </small>

              )}


              <div className="payment-second-tap-meta">

                <span>

                  Reference:

                  {" "}

                  {paymentIntent.reference}

                </span>


                <span>

                  Expires:

                  {" "}

                  {formatDateTime(
                    paymentIntent.expiresAt
                  )}

                </span>

              </div>

            </div>


            <button
              type="button"
              className="payment-cancel-intent-button"
              onClick={
                handleCancelPaymentIntent
              }
              disabled={
                processingPayment
              }
            >

              <XCircle
                size={17}
              />

              Cancel

            </button>

          </section>

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

                {/* 
        |--------------------------------------------------------------------------
        | PAYMENT OVERVIEW
        |--------------------------------------------------------------------------
        */}

        <section className="payment-overview-grid">

          <div className="payment-overview-card">

            <div className="payment-overview-icon">

              <Banknote
                size={21}
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


          <div className="payment-overview-card">

            <div className="payment-overview-icon">

              <ShieldCheck
                size={21}
              />

            </div>


            <div>

              <span>
                Insurance
              </span>


              <strong>
                {formatRwf(
                  totals.insurance
                )}
              </strong>

            </div>

          </div>


          <div className="payment-overview-card">

            <div className="payment-overview-icon">

              <CreditCard
                size={21}
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


          <div className="payment-overview-card payment-overview-card-highlight">

            <div className="payment-overview-icon">

              <Wallet
                size={21}
              />

            </div>


            <div>

              <span>
                Remaining balance
              </span>


              <strong>
                {formatRwf(
                  totals.remaining
                )}
              </strong>

            </div>

          </div>

        </section>


        {/* 
        |--------------------------------------------------------------------------
        | MAIN PAYMENT GRID
        |--------------------------------------------------------------------------
        */}

        <section className="payment-workspace-grid">

          {/* 
          |--------------------------------------------------------------------------
          | LEFT — CHARGES
          |--------------------------------------------------------------------------
          */}

          <div className="payment-charges-panel">

            <div className="payment-panel-header">

              <div>

                <span className="payment-section-label">
                  CHARGES
                </span>


                <h2>
                  Services to pay
                </h2>

              </div>


              <span className="payment-count-badge">

                {charges.length}

              </span>

            </div>


            <div className="payment-tabs">

              <button
                type="button"
                className={
                  activeTab === "charges"
                    ? "payment-tab payment-tab-active"
                    : "payment-tab"
                }
                onClick={() =>
                  setActiveTab(
                    "charges"
                  )
                }
              >

                <CreditCard
                  size={16}
                />

                Charges

              </button>


              <button
                type="button"
                className={
                  activeTab === "transactions"
                    ? "payment-tab payment-tab-active"
                    : "payment-tab"
                }
                onClick={() =>
                  setActiveTab(
                    "transactions"
                  )
                }
              >

                <History
                  size={16}
                />

                Wallet history

              </button>

            </div>


            {activeTab === "charges" ? (

              <div className="payment-charge-list">

                {loading ? (

                  <div className="payment-loading-state">

                    <LoaderCircle
                      size={25}
                      className="payment-spin"
                    />

                    <span>
                      Loading charges...
                    </span>

                  </div>

                ) : charges.length === 0 ? (

                  <div className="payment-empty-state-small">

                    <CheckCircle2
                      size={28}
                    />

                    <strong>
                      No charges found
                    </strong>

                    <span>
                      This encounter has no
                      outstanding healthcare
                      charges.
                    </span>

                  </div>

                ) : (

                  charges.map(
                    (charge) => {

                      const balance =
                        balances[
                          charge.id
                        ];


                      const remaining =
                        balance
                          ? balance.remainingBalance
                          : toNumber(
                              charge.patientAmount
                            );


                      const selected =
                        charge.id ===
                        selectedChargeId;


                      return (

                        <button
                          type="button"
                          key={charge.id}
                          className={
                            selected
                              ? "payment-charge-item payment-charge-item-selected"
                              : "payment-charge-item"
                          }
                          onClick={() => {

                            if (
                              waitingForSecondTap
                            ) {
                              return;
                            }


                            setSelectedChargeId(
                              charge.id
                            );


                            setLastPayment(
                              null
                            );


                            setError(
                              ""
                            );


                            setSuccessMessage(
                              ""
                            );

                          }}
                        >

                          <div className="payment-charge-main">

                            <div className="payment-charge-icon">

                              <CreditCard
                                size={19}
                              />

                            </div>


                            <div className="payment-charge-info">

                              <strong>

                                {getChargeLabel(
                                  charge
                                )}

                              </strong>


                              <span>

                                {charge.quantity || 1}
                                {" × "}
                                {formatRwf(
                                  charge.unitPrice
                                )}

                              </span>


                              <small>

                                {formatDateTime(
                                  charge.createdAt
                                )}

                              </small>

                            </div>

                          </div>


                          <div className="payment-charge-right">

                            <strong>
                              {formatRwf(
                                charge.patientAmount
                              )}
                            </strong>


                            <span
                              className={
                                getChargeStatusClass(
                                  charge.status
                                )
                              }
                            >

                              {remaining <= 0
                                ? "Paid"
                                : getStatusLabel(
                                    charge.status
                                  )}

                            </span>

                          </div>


                          {selected && (

                            <ChevronRight
                              size={18}
                              className="payment-charge-selected-icon"
                            />

                          )}

                        </button>

                      );

                    }
                  )

                )}

              </div>

            ) : (

              <div className="payment-transaction-list">

                {transactions.length === 0 ? (

                  <div className="payment-empty-state-small">

                    <History
                      size={28}
                    />

                    <strong>
                      No wallet transactions
                    </strong>

                    <span>
                      Wallet activity will
                      appear here.
                    </span>

                  </div>

                ) : (

                  transactions.map(
                    (transaction) => (

                      <div
                        key={
                          transaction.id
                        }
                        className="payment-transaction-item"
                      >

                        <div className="payment-transaction-icon">

                          {transaction.type ===
                          "CREDIT" ? (

                            <ArrowUpRight
                              size={18}
                            />

                          ) : (

                            <CreditCard
                              size={18}
                            />

                          )}

                        </div>


                        <div className="payment-transaction-info">

                          <strong>

                            {transaction.description ||
                              transaction.type}

                          </strong>


                          <span>

                            {transaction.reference ||
                              "No reference"}

                          </span>


                          <small>

                            {formatDateTime(
                              transaction.createdAt
                            )}

                          </small>

                        </div>


                        <div className="payment-transaction-amount">

                          <strong>

                            {transaction.type ===
                            "CREDIT"
                              ? "+"
                              : "-"}

                            {formatRwf(
                              transaction.amount
                            )}

                          </strong>


                          <small>

                            Balance:{" "}

                            {formatRwf(
                              transaction.balanceAfter
                            )}

                          </small>

                        </div>

                      </div>

                    )
                  )

                )}

              </div>

            )}

          </div>


          {/* 
          |--------------------------------------------------------------------------
          | RIGHT — CHECKOUT
          |--------------------------------------------------------------------------
          */}

          <div className="payment-checkout-panel">

            <div className="payment-panel-header">

              <div>

                <span className="payment-section-label">
                  CHECKOUT
                </span>


                <h2>
                  Complete payment
                </h2>

              </div>


              <LockKeyhole
                size={19}
              />

            </div>


            {selectedCharge ? (

              <div className="payment-selected-content">

                {/* SELECTED SERVICE */}

                <div className="payment-selected-charge">

                  <div>

                    <span>
                      Selected service
                    </span>


                    <strong>

                      {getChargeLabel(
                        selectedCharge
                      )}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Patient balance
                    </span>


                    <strong>

                      {formatRwf(
                        selectedBalance
                          ?.remainingBalance ??
                        selectedCharge.patientAmount
                      )}

                    </strong>

                  </div>

                </div>


                {/* PAYMENT METHOD */}

                <div className="payment-field-group">

                  <label>
                    Payment method
                  </label>


                  <div className="payment-method-grid">

                    <button
                      type="button"
                      className={
                        paymentMethod === "MEDCARD"
                          ? "payment-method-button payment-method-active"
                          : "payment-method-button"
                      }
                      onClick={() => {

                        if (
                          waitingForSecondTap
                        ) {
                          return;
                        }

                        setPaymentMethod(
                          "MEDCARD"
                        );

                        setError("");

                        setSuccessMessage("");

                      }}
                      disabled={
                        waitingForSecondTap
                      }
                    >

                      <CreditCard
                        size={19}
                      />


                      <span>

                        <strong>
                          MedCard Wallet
                        </strong>

                        <small>
                          Tap to pay
                        </small>

                      </span>

                    </button>


                    <button
                      type="button"
                      className={
                        paymentMethod === "MOBILE_MONEY"
                          ? "payment-method-button payment-method-active"
                          : "payment-method-button"
                      }
                      onClick={() => {

                        if (
                          waitingForSecondTap
                        ) {
                          return;
                        }

                        setPaymentMethod(
                          "MOBILE_MONEY"
                        );

                        setError("");

                        setSuccessMessage("");

                      }}
                      disabled={
                        waitingForSecondTap
                      }
                    >

                      <Smartphone
                        size={19}
                      />


                      <span>

                        <strong>
                          Mobile Money
                        </strong>

                        <small>
                          MTN / Airtel
                        </small>

                      </span>

                    </button>


                    <button
                      type="button"
                      className={
                        paymentMethod === "BANK_CARD"
                          ? "payment-method-button payment-method-active"
                          : "payment-method-button"
                      }
                      onClick={() => {

                        if (
                          waitingForSecondTap
                        ) {
                          return;
                        }

                        setPaymentMethod(
                          "BANK_CARD"
                        );

                        setError("");

                        setSuccessMessage("");

                      }}
                      disabled={
                        waitingForSecondTap
                      }
                    >

                      <CreditCard
                        size={19}
                      />


                      <span>

                        <strong>
                          Bank Card
                        </strong>

                        <small>
                          POS payment
                        </small>

                      </span>

                    </button>


                    <button
                      type="button"
                      className={
                        paymentMethod === "CASH"
                          ? "payment-method-button payment-method-active"
                          : "payment-method-button"
                      }
                      onClick={() => {

                        if (
                          waitingForSecondTap
                        ) {
                          return;
                        }

                        setPaymentMethod(
                          "CASH"
                        );

                        setError("");

                        setSuccessMessage("");

                      }}
                      disabled={
                        waitingForSecondTap
                      }
                    >

                      <Banknote
                        size={19}
                      />


                      <span>

                        <strong>
                          Cash
                        </strong>

                        <small>
                          Record cash payment
                        </small>

                      </span>

                    </button>

                  </div>

                </div>


                {/* AMOUNT */}

                <div className="payment-field-group">

                  <label htmlFor="payment-amount">

                    Amount to pay

                  </label>


                  <div className="payment-amount-input">

                    <span>
                      RWF
                    </span>


                    <input
                      id="payment-amount"
                      type="number"
                      min="1"
                      step="1"
                      value={
                        paymentAmount
                      }
                      onChange={(event) =>
                        setPaymentAmount(
                          event.target.value
                        )
                      }
                      disabled={
                        processingPayment ||
                        waitingForSecondTap
                      }
                    />

                  </div>


                  {paymentExceedsCharge && (

                    <small className="payment-field-error">

                      Amount exceeds the
                      remaining charge balance.

                    </small>

                  )}

                </div>


                {/* MEDCARD WALLET INFORMATION */}

                {paymentMethod ===
                  "MEDCARD" && (

                  <div className="payment-wallet-card">

                    <div className="payment-wallet-card-header">

                      <div className="payment-wallet-icon">

                        <Wallet
                          size={20}
                        />

                      </div>


                      <div>

                        <span>
                          MedCard Wallet
                        </span>


                        <strong>
                          {formatRwf(
                            wallet?.balance
                          )}
                        </strong>

                      </div>

                    </div>


                    <div className="payment-wallet-row">

                      <span>
                        Payment amount
                      </span>


                      <strong>
                        {formatRwf(
                          numericPaymentAmount
                        )}
                      </strong>

                    </div>


                    <div className="payment-wallet-row">

                      <span>
                        Balance after payment
                      </span>


                      <strong>

                        {formatRwf(
                          Math.max(
                            0,
                            walletBalance -
                              numericPaymentAmount
                          )
                        )}

                      </strong>

                    </div>


                    {paymentExceedsWallet && (

                      <div className="payment-wallet-warning">

                        <XCircle
                          size={17}
                        />

                        <span>

                          Insufficient wallet
                          balance.

                          Available:{" "}

                          {formatRwf(
                            walletBalance
                          )}

                        </span>

                      </div>

                    )}

                  </div>

                )}


                {/* 
                |--------------------------------------------------------------------------
                | REFERENCE
                |--------------------------------------------------------------------------
                */}

                <div className="payment-field-group">

                  <label htmlFor="payment-reference">

                    Reference
                    <span>
                      Optional
                    </span>

                  </label>


                  <input
                    id="payment-reference"
                    type="text"
                    placeholder="Payment reference"
                    value={
                      paymentReference
                    }
                    onChange={(event) =>
                      setPaymentReference(
                        event.target.value
                      )
                    }
                    disabled={
                      processingPayment ||
                      waitingForSecondTap
                    }
                  />

                </div>


                {/* NOTES */}

                <div className="payment-field-group">

                  <label htmlFor="payment-notes">

                    Notes
                    <span>
                      Optional
                    </span>

                  </label>


                  <textarea
                    id="payment-notes"
                    rows={3}
                    placeholder="Add a payment note..."
                    value={
                      paymentNotes
                    }
                    onChange={(event) =>
                      setPaymentNotes(
                        event.target.value
                      )
                    }
                    disabled={
                      processingPayment ||
                      waitingForSecondTap
                    }
                  />

                </div>


                {/* 
                |--------------------------------------------------------------------------
                | SECOND TAP INSTRUCTIONS
                |--------------------------------------------------------------------------
                */}

                {paymentMethod ===
                  "MEDCARD" &&
                  !waitingForSecondTap && (

                  <div className="payment-medcard-instruction">

                    <div className="payment-medcard-instruction-icon">

                      <CreditCard
                        size={22}
                      />

                    </div>


                    <div>

                      <strong>
                        Two-tap MedCard payment
                      </strong>


                      <p>

                        First tap identifies
                        the patient.

                        After you prepare
                        the payment, the
                        patient taps again
                        to authorize the
                        wallet payment.

                      </p>

                    </div>

                  </div>

                )}


                {/* 
                |--------------------------------------------------------------------------
                | ACTIVE SECOND TAP
                |--------------------------------------------------------------------------
                */}

                {paymentMethod === 
                  "MEDCARD" &&
                  waitingForSecondTap &&
                  paymentIntent && (

                  <div className="payment-active-tap-panel">

                    <div className="payment-active-tap-animation">

                      {processingPayment ? (

                        <LoaderCircle
                          size={30}
                          className="payment-spin"
                        />

                      ) : (

                        <CreditCard
                          size={30}
                        />

                      )}

                    </div>


                    <div>

                      <strong>

                        {processingPayment
                          ? "Processing payment..."
                          : "Waiting for MedCard tap"}

                      </strong>


                      <span>

                        {processingPayment
                          ? "Please keep the card on the NFC reader."
                          : "Ask the patient to tap their MedCard on the reader."}

                      </span>


                      <small>

                        {formatRwf(
                          paymentIntent.amount
                        )}

                        {" • "}

                        {paymentIntent.reference}

                      </small>

                    </div>

                  </div>

                )}


                {/* 
                |--------------------------------------------------------------------------
                | PAYMENT ACTION
                |--------------------------------------------------------------------------
                */}

                <div className="payment-action-area">

                  {paymentMethod ===
                    "MEDCARD" ? (

                    <button
                      type="button"
                      className="payment-primary-button payment-submit-button"
                      onClick={
                        handlePayment
                      }
                      disabled={
                        !canPreparePayment ||
                        waitingForSecondTap
                      }
                    >

                      {processingPayment ? (

                        <>

                          <LoaderCircle
                            size={19}
                            className="payment-spin"
                          />

                          Preparing...

                        </>

                      ) : waitingForSecondTap ? (

                        <>

                          <Smartphone
                            size={19}
                          />

                          Waiting for tap...

                        </>

                      ) : (

                        <>

                          <CreditCard
                            size={19}
                          />

                          Prepare MedCard Payment

                        </>

                      )}

                    </button>

                  ) : (

                    <button
                      type="button"
                      className="payment-primary-button payment-submit-button"
                      onClick={
                        handlePayment
                      }
                      disabled={
                        !selectedCharge ||
                        numericPaymentAmount <= 0 ||
                        paymentExceedsCharge ||
                        processingPayment
                      }
                    >

                      {processingPayment ? (

                        <>

                          <LoaderCircle
                            size={19}
                            className="payment-spin"
                          />

                          Processing...

                        </>

                      ) : (

                        <>

                          <CheckCircle2
                            size={19}
                          />

                          Complete Payment

                        </>

                      )}

                    </button>

                  )}


                  <div className="payment-secure-note">

                    <LockKeyhole
                      size={15}
                    />

                    <span>

                      Payments are securely
                      recorded in the MedCard
                      financial ledger.

                    </span>

                  </div>

                </div>
                
                </div>

              ) : (

              <div className="payment-no-charge">

                <CreditCard
                  size={32}
                />


                <strong>
                  Select a charge
                </strong>


                <span>

                  Select a healthcare service
                  from the list to prepare
                  payment.

                </span>

              </div>

            )}

          </div>

        </section>

                {/* 
        |--------------------------------------------------------------------------
        | PAYMENT RESULT / RECEIPT
        |--------------------------------------------------------------------------
        */}

        {lastPayment?.payment && (

          <section className="payment-receipt-card">

            <div className="payment-receipt-header">

              <div>

                <span className="payment-section-label">
                  PAYMENT COMPLETED
                </span>


                <h2>
                  Payment receipt
                </h2>

              </div>


              <CheckCircle2
                size={25}
                className="payment-receipt-success-icon"
              />

            </div>


            <div className="payment-receipt-summary">

              <div className="payment-receipt-amount">

                <span>
                  Amount paid
                </span>


                <strong>
                  {formatRwf(
                    lastPayment.payment.amount
                  )}
                </strong>

              </div>


              <div className="payment-receipt-status">

                <span>
                  Status
                </span>


                <strong>
                  {lastPayment.payment.status}
                </strong>

              </div>

            </div>


            <div className="payment-receipt-details">

              <div>

                <span>
                  Payment ID
                </span>


                <strong>
                  {lastPayment.payment.id}
                </strong>

              </div>


              <div>

                <span>
                  Charge
                </span>


                <strong>
                  {lastPayment.payment.chargeId}
                </strong>

              </div>


              <div>

                <span>
                  Method
                </span>


                <strong>
                  {lastPayment.payment.method}
                </strong>

              </div>


              <div>

                <span>
                  Reference
                </span>


                <strong>

                  {lastPayment.payment.reference ||
                    "—"}

                </strong>

              </div>


              <div>

                <span>
                  Paid at
                </span>


                <strong>

                  {formatDateTime(
                    lastPayment.payment.paidAt ||
                      lastPayment.payment.createdAt
                  )}

                </strong>

              </div>

            </div>


            {lastPayment.wallet && (

              <div className="payment-receipt-wallet">

                <div>

                  <span>
                    Wallet before
                  </span>


                  <strong>
                    {formatRwf(
                      lastPayment.wallet
                        .balanceBefore
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Amount debited
                  </span>


                  <strong>
                    {formatRwf(
                      lastPayment.wallet
                        .amountDebited
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Wallet after
                  </span>


                  <strong>
                    {formatRwf(
                      lastPayment.wallet
                        .balanceAfter
                    )}
                  </strong>

                </div>

              </div>

            )}


            {lastPayment.calculation && (

              <div className="payment-receipt-calculation">

                <div>

                  <span>
                    Patient responsibility
                  </span>


                  <strong>
                    {formatRwf(
                      lastPayment.calculation
                        .patientAmount
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Previously paid
                  </span>


                  <strong>
                    {formatRwf(
                      lastPayment.calculation
                        .previouslyPaid
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    This payment
                  </span>


                  <strong>
                    {formatRwf(
                      lastPayment.calculation
                        .paymentAmount
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Remaining
                  </span>


                  <strong>
                    {formatRwf(
                      lastPayment.calculation
                        .remainingBalance
                    )}
                  </strong>

                </div>

              </div>

            )}

          </section>

        )}


        {/* 
        |--------------------------------------------------------------------------
        | WALLET SUMMARY
        |--------------------------------------------------------------------------
        */}

        <section className="payment-wallet-summary">

          <div className="payment-wallet-summary-header">

            <div>

              <span className="payment-section-label">
                MEDCARD WALLET
              </span>


              <h2>
                Wallet overview
              </h2>

            </div>


            <Wallet
              size={21}
            />

          </div>


          <div className="payment-wallet-summary-grid">

            <div className="payment-wallet-summary-item">

              <span>
                Available balance
              </span>


              <strong>
                {formatRwf(
                  wallet?.balance
                )}
              </strong>

            </div>


            <div className="payment-wallet-summary-item">

              <span>
                Currency
              </span>


              <strong>
                {wallet?.currency ||
                  "RWF"}
              </strong>

            </div>


            <div className="payment-wallet-summary-item">

              <span>
                Status
              </span>


              <strong>

                {wallet?.status ||
                  "UNKNOWN"}

              </strong>

            </div>


            <div className="payment-wallet-summary-item">

              <span>
                Transactions
              </span>


              <strong>
                {transactions.length}
              </strong>

            </div>

          </div>

        </section>


        {/* 
        |--------------------------------------------------------------------------
        | RECENT WALLET TRANSACTIONS
        |--------------------------------------------------------------------------
        */}

        <section className="payment-history-card">

          <div className="payment-panel-header">

            <div>

              <span className="payment-section-label">
                RECENT ACTIVITY
              </span>


              <h2>
                Wallet transactions
              </h2>

            </div>


            <button
              type="button"
              className="payment-small-action-button"
              onClick={() =>
                setActiveTab(
                  "transactions"
                )
              }
            >

              View all

              <ChevronRight
                size={16}
              />

            </button>

          </div>


          {transactions.length === 0 ? (

            <div className="payment-empty-state-small">

              <History
                size={28}
              />


              <strong>
                No transactions yet
              </strong>


              <span>
                Wallet activity will
                appear after the first
                transaction.
              </span>

            </div>

          ) : (

            <div className="payment-history-list">

              {transactions
                .slice(0, 5)
                .map(
                  (transaction) => (

                    <div
                      key={
                        transaction.id
                      }
                      className="payment-history-row"
                    >

                      <div className="payment-history-row-icon">

                        {transaction.type ===
                        "CREDIT" ? (

                          <ArrowUpRight
                            size={17}
                          />

                        ) : transaction.type ===
                          "REFUND" ? (

                          <RefreshCw
                            size={17}
                          />

                        ) : (

                          <CreditCard
                            size={17}
                          />

                        )}

                      </div>


                      <div className="payment-history-row-info">

                        <strong>

                          {transaction.description ||
                            transaction.type}

                        </strong>


                        <span>

                          {formatDateTime(
                            transaction.createdAt
                          )}

                        </span>

                      </div>


                      <div className="payment-history-row-amount">

                        <strong>

                          {transaction.type ===
                          "CREDIT"
                            ? "+"
                            : transaction.type ===
                              "REFUND"
                              ? "+"
                              : "-"}

                          {formatRwf(
                            transaction.amount
                          )}

                        </strong>


                        <small>

                          {formatRwf(
                            transaction.balanceAfter
                          )}

                        </small>

                      </div>

                    </div>

                  )
                )}

            </div>

          )}

        </section>


        {/* 
        |--------------------------------------------------------------------------
        | PAYMENT SECURITY INFORMATION
        |--------------------------------------------------------------------------
        */

        <section className="payment-security-card">

          <div className="payment-security-icon">

            <ShieldCheck
              size={23}
            />

          </div>


          <div>

            <strong>
              Secure MedCard payment
            </strong>


            <p>

              The NFC card does not contain
              the patient's wallet balance.
              The card UID is used to identify
              the registered patient card,
              while the MedCard backend
              performs the wallet transaction
              securely.

            </p>


            <div className="payment-security-points">

              <span>

                <CheckCircle2
                  size={15}
                />

                Card ownership verified

              </span>


              <span>

                <CheckCircle2
                  size={15}
                />

                Wallet balance checked

              </span>


              <span>

                <CheckCircle2
                  size={15}
                />

                Payment recorded

              </span>


              <span>

                <CheckCircle2
                  size={15}
                />

                Audit trail preserved

              </span>

            </div>

          </div>

        </section>


        }

        <div className="payment-footer-actions">

          <button
            type="button"
            className="payment-secondary-button"
            onClick={() =>
              navigate(-1)
            }
          >

            <ArrowLeft
              size={17}
            />

            Back to patient

          </button>


          <button
            type="button"
            className="payment-secondary-button"
            onClick={() =>
              loadData(true)
            }
            disabled={
              refreshing ||
              waitingForSecondTap
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

            Refresh payment data

          </button>

        </div>

      </main>

    </div>

  );

}


export default PaymentWorkspacePage;