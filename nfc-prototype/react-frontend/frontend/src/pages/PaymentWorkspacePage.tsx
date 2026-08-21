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
  Wifi,
  XCircle,
} from "lucide-react";

import "./PatientWorkspacePage.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  DEMO_FACILITY_ID,
  getCharges,
  getPayments,
  getWallet,
} from "../services/api";

import { socket } from "../services/socket";




/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface Patient {
  id: string;
  patientNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  accessLevel?: string;
}

interface Encounter {
  id: string;
  type?: string;
  status?: string;
  startedAt?: string;
}

interface Service {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  category?: string;
}

interface Charge {
  id: string;

  patientId: string;

  encounterId: string;

  serviceId?: string;

  servicePriceId?: string | null;

  quantity?: number;

  unitPrice: number | string;

  subtotal?: number | string;

  insuranceAmount?: number | string;

  patientAmount: number | string;

  currency?: string;

  status?: string;

  description?: string | null;

  createdAt?: string;

  updatedAt?: string;

  service?: Service;

  patient?: Patient;

  encounter?: Encounter;
}

interface Payment {
  id: string;

  chargeId?: string;

  patientId?: string;

  amount: number | string;

  currency?: string;

  method?: string;

  reference?: string | null;

  notes?: string | null;

  status?: string;

  createdAt?: string;

  updatedAt?: string;
}

interface Wallet {
  id: string;

  patientId: string;

  balance: number | string;

  currency?: string;

  status?: string;
}

interface WalletTransaction {
  id: string;

  walletId?: string;

  type: string;

  amount: number | string;

  balanceBefore: number | string;

  balanceAfter: number | string;

  reference?: string | null;

  description?: string | null;

  createdAt?: string;
}

interface ChargeBalance {
  chargeId: string;

  chargeAmount?: number | string;

  totalPaid?: number | string;

  remainingBalance?: number | string;

  status?: string;
}

interface PaymentIntent {
  id: string;

  facilityId?: string;

  patientId?: string;

  encounterId?: string;

  chargeId?: string;

  amount: number | string;

  currency?: string;

  method?: string;

  status?: string;

  expiresAt?: string;

  createdAt?: string;

  updatedAt?: string;
}

interface PaymentResponse {
  payment?: Payment;

  wallet?: any;

  calculation?: any;

  alreadyProcessed?: boolean;

  paymentIntent?: PaymentIntent;

  charge?: Charge;

  result?: any;
}

interface ApiError {
  message?: string;

  statusCode?: number;

  response?: {
    data?: {
      message?: string;
    };
  };
}


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";


const toNumber = (
  value: unknown
): number => {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
};


const formatRwf = (
  value: unknown
): string => {
  return `${toNumber(
    value
  ).toLocaleString(
    "en-RW"
  )} RWF`;
};


const formatDateTime = (
  value?: string
): string => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-RW",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
    }
  );
};


const getInitials = (
  firstName?: string,
  lastName?: string
): string => {
  const first =
    firstName?.trim()?.[0] ||
    "";

  const last =
    lastName?.trim()?.[0] ||
    "";

  const result =
    `${first}${last}`.toUpperCase();

  return result || "P";
};


const getChargeLabel = (
  charge: Charge
): string => {
  if (
    charge.service?.name
  ) {
    return charge.service.name;
  }

  if (
    charge.description
  ) {
    return charge.description;
  }

  return "Healthcare service";
};


const getStatusLabel = (
  status?: string
): string => {
  if (!status) {
    return "Pending";
  }

  return status
    .replace(
      /_/g,
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};


/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function PaymentWorkspacePage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const params =
    useParams();

  /*
  |--------------------------------------------------------------------------
  | PATIENT / ENCOUNTER
  |--------------------------------------------------------------------------
  */

  const queryParams =
    useMemo(
      () =>
        new URLSearchParams(
          location.search
        ),
      [location.search]
    );

  const patientId =
    params.patientId ||
    queryParams.get(
      "patientId"
    ) ||
    "";

  const encounterId =
    queryParams.get(
      "encounterId"
    ) ||
    "";


  /*
  |--------------------------------------------------------------------------
  | PATIENT STATE
  |--------------------------------------------------------------------------
  */

  const [patient, setPatient] =
    useState<Patient | null>(
      null
    );

  const [encounter, setEncounter] =
    useState<Encounter | null>(
      null
    );


  /*
  |--------------------------------------------------------------------------
  | CHARGES
  |--------------------------------------------------------------------------
  */

  const [charges, setCharges] =
    useState<Charge[]>(
      []
    );

  const [balances, setBalances] =
    useState<
      Record<
        string,
        ChargeBalance
      >
    >({});


  /*
  |--------------------------------------------------------------------------
  | PAYMENTS
  |--------------------------------------------------------------------------
  */

  const [payments, setPayments] =
    useState<Payment[]>(
      []
    );


  /*
  |--------------------------------------------------------------------------
  | WALLET
  |--------------------------------------------------------------------------
  */

  const [wallet, setWallet] =
    useState<Wallet | null>(
      null
    );

  const [transactions, setTransactions] =
    useState<
      WalletTransaction[]
    >([]);


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState<
      "charges" |
      "transactions"
    >("charges");


  /*
  |--------------------------------------------------------------------------
  | SELECTED CHARGE
  |--------------------------------------------------------------------------
  */

  const [
    selectedChargeId,
    setSelectedChargeId,
  ] = useState<
    string | null
  >(null);


  /*
  |--------------------------------------------------------------------------
  | PAYMENT FORM
  |--------------------------------------------------------------------------
  */

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<
    "MEDCARD" |
    "CASH" |
    "MOBILE_MONEY"
  >("MEDCARD");

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState("");

  const [
    paymentReference,
    setPaymentReference,
  ] = useState("");

  const [
    paymentNotes,
    setPaymentNotes,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | PAYMENT PROCESSING
  |--------------------------------------------------------------------------
  */

  const [
    processingPayment,
    setProcessingPayment,
  ] = useState(false);

  const [
    waitingForSecondTap,
    setWaitingForSecondTap,
  ] = useState(false);

  const [
    secondTapCardUid,
    setSecondTapCardUid,
  ] = useState<
    string | null
  >(null);

  const [
    paymentIntent,
    setPaymentIntent,
  ] = useState<
    PaymentIntent | null
  >(null);

  const [
    lastPayment,
    setLastPayment,
  ] = useState<
    PaymentResponse | null
  >(null);


  /*
  |--------------------------------------------------------------------------
  | MESSAGES
  |--------------------------------------------------------------------------
  */

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | GENERIC API REQUEST
  |--------------------------------------------------------------------------
  */

  const request =
    useCallback(
      async <T,>(
        path: string,
        options: RequestInit = {}
      ): Promise<T> => {

        const response =
          await fetch(
            `${API_URL}${path}`,
            {
              ...options,

              headers: {
                "Content-Type":
                  "application/json",

                ...(options.headers ||
                  {}),
              },
            }
          );

        let data: any =
          null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {

          const message =
            data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`;

          const requestError =
            new Error(
              message
            ) as Error &
              ApiError;

          requestError.statusCode =
            response.status;

          requestError.response = {
            data,
          };

          throw requestError;
        }

        return (
          data?.data ??
          data
        ) as T;
      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD PATIENT
  |--------------------------------------------------------------------------
  */

  const loadPatient =
    useCallback(
      async () => {

        if (!patientId) {
          return;
        }

        try {

          const result =
            await request<any>(
              `/patients/${encodeURIComponent(
                patientId
              )}`
            );

          const patientData =
            result?.patient ||
            result?.data ||
            result;

          if (
            patientData
          ) {
            setPatient(
              patientData
            );
          }

        } catch {
          /*
           * Patient information is supplementary.
           * Charges/payment loading should continue.
           */
        }
      },
      [
        patientId,
        request,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD ENCOUNTER
  |--------------------------------------------------------------------------
  */

  const loadEncounter =
    useCallback(
      async () => {

        if (!encounterId) {
          return;
        }

        try {

          const result =
            await request<any>(
              `/encounters/${encodeURIComponent(
                encounterId
              )}`
            );

          const encounterData =
            result?.encounter ||
            result?.data ||
            result;

          if (
            encounterData
          ) {
            setEncounter(
              encounterData
            );
          }

        } catch {
          /*
           * Encounter information is supplementary.
           */
        }
      },
      [
        encounterId,
        request,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD CHARGES
  |--------------------------------------------------------------------------
  */

  const loadCharges =
    useCallback(
      async () => {

        if (!encounterId) {
          setCharges(
            []
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |
        | These are REAL backend charges.
        | No mock charges are created here.
        |--------------------------------------------------------------------------
        */

        const result =
          await getCharges(
            encounterId
          );

        const chargeList =
          Array.isArray(
            result
          )
            ? result
            : [];

        setCharges(
          chargeList
        );

        /*
        |--------------------------------------------------------------------------
        | Automatically select the first
        | outstanding charge if nothing
        | is currently selected.
        |--------------------------------------------------------------------------
        */

        setSelectedChargeId(
          (current) => {

            if (
              current &&
              chargeList.some(
                (
                  charge
                ) =>
                  charge.id ===
                  current
              )
            ) {
              return current;
            }

            const outstanding =
              chargeList.find(
                (
                  charge
                ) =>
                  charge.status !==
                  "PAID"
              );

            return (
              outstanding?.id ||
              null
            );
          }
        );

      },
      [
        encounterId,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD CHARGE BALANCES
  |--------------------------------------------------------------------------
  */

  const loadChargeBalances =
    useCallback(
      async (
        chargeList: Charge[]
      ) => {

        const balanceMap:
          Record<
            string,
            ChargeBalance
          > = {};

        await Promise.all(
          chargeList.map(
            async (
              charge
            ) => {

              try {

                const result =
                  await request<any>(
                    `/charges/${encodeURIComponent(
                      charge.id
                    )}/balance`
                  );

                const balance =
                  result?.balance ||
                  result?.data ||
                  result;

                if (
                  balance
                ) {

                  balanceMap[
                    charge.id
                  ] = {
                    chargeId:
                      charge.id,

                    chargeAmount:
                      balance.chargeAmount ??
                      charge.patientAmount,

                    totalPaid:
                      balance.totalPaid ??
                      0,

                    remainingBalance:
                      balance.remainingBalance ??
                      balance.remaining ??
                      charge.patientAmount,

                    status:
                      balance.status ??
                      charge.status,
                  };

                }

              } catch {
                /*
                 * If balance endpoint isn't available,
                 * derive the balance from the charge.
                 */
              }
            }
          )
        );

        setBalances(
          balanceMap
        );

      },
      [
        request,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD PAYMENTS
  |--------------------------------------------------------------------------
  */

  const loadPayments =
    useCallback(
      async (
        chargeList: Charge[]
      ) => {

        const allPayments:
          Payment[] = [];

        await Promise.all(
          chargeList.map(
            async (
              charge
            ) => {

              try {

                const result =
                  await getPayments(
                    charge.id
                  );

                if (
                  Array.isArray(
                    result
                  )
                ) {
                  allPayments.push(
                    ...result
                  );
                }

              } catch {
                /*
                 * Continue loading other charges.
                 */
              }
            }
          )
        );

        setPayments(
          allPayments
        );

      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD WALLET
  |--------------------------------------------------------------------------
  */

  const loadPatientWallet =
    useCallback(
      async () => {

        if (!patientId) {
          setWallet(
            null
          );

          return;
        }

        try {

          const result =
            await getWallet(
              patientId
            );

          setWallet(
            result
          );

        } catch {

          setWallet(
            null
          );

        }

      },
      [
        patientId,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD WALLET TRANSACTIONS
  |--------------------------------------------------------------------------
  */

  const loadWalletTransactions =
    useCallback(
      async () => {

        if (!patientId) {
          setTransactions(
            []
          );

          return;
        }

        try {

          const result =
            await request<any>(
              `/patients/${encodeURIComponent(
                patientId
              )}/wallet/transactions`
            );

          const transactionList =
            result?.transactions ||
            result?.data ||
            result;

          setTransactions(
            Array.isArray(
              transactionList
            )
              ? transactionList
              : []
          );

        } catch {

          setTransactions(
            []
          );

        }

      },
      [
        patientId,
        request,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD ALL DATA
  |--------------------------------------------------------------------------
  */

  const loadData =
    useCallback(
      async (
        silent = false
      ) => {

        if (!silent) {
          setLoading(
            true
          );
        } else {
          setRefreshing(
            true
          );
        }

        setError("");

        try {

          await Promise.all([
            loadPatient(),
            loadEncounter(),
          ]);

          await loadCharges();

          /*
          |--------------------------------------------------------------------------
          | Read charges again from backend so
          | balance/payment queries use the
          | latest real list.
          |--------------------------------------------------------------------------
          */

          let latestCharges:
            Charge[] = [];

          if (
            encounterId
          ) {

            try {

              const latest =
                await getCharges(
                  encounterId
                );

              latestCharges =
                Array.isArray(
                  latest
                )
                  ? latest
                  : [];

              setCharges(
                latestCharges
              );

            } catch {

              latestCharges =
                charges;
            }

          }

          await Promise.all([
            loadChargeBalances(
              latestCharges
            ),

            loadPayments(
              latestCharges
            ),

            loadPatientWallet(),

            loadWalletTransactions(),
          ]);

        } catch (
          loadError: any
        ) {

          setError(
            loadError?.message ||
              "Unable to load payment information."
          );

        } finally {

          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }

      },
      [
        encounterId,
        charges,
        loadPatient,
        loadEncounter,
        loadCharges,
        loadChargeBalances,
        loadPayments,
        loadPatientWallet,
        loadWalletTransactions,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {

      loadData();

    },
    [
      patientId,
      encounterId,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | SELECT FIRST OUTSTANDING CHARGE
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {

      if (
        !selectedChargeId &&
        charges.length > 0
      ) {

        const outstanding =
          charges.find(
            (
              charge
            ) =>
              charge.status !==
              "PAID"
          );

        if (
          outstanding
        ) {

          setSelectedChargeId(
            outstanding.id
          );

        }

      }

    },
    [
      charges,
      selectedChargeId,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | CALCULATE SELECTED CHARGE
  |--------------------------------------------------------------------------
  */

  const selectedCharge =
    useMemo(
      () =>
        charges.find(
          (
            charge
          ) =>
            charge.id ===
            selectedChargeId
        ) ||
        null,
      [
        charges,
        selectedChargeId,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | SELECTED CHARGE BALANCE
  |--------------------------------------------------------------------------
  */

  const selectedBalance =
    selectedCharge
      ? balances[
          selectedCharge.id
        ]
      : null;


  const outstandingAmount =
    selectedBalance
      ? toNumber(
          selectedBalance.remainingBalance
        )
      : selectedCharge
        ? Math.max(
            0,
            toNumber(
              selectedCharge.patientAmount
            )
          )
        : 0;


  /*
  |--------------------------------------------------------------------------
  | PAYMENT AMOUNT
  |--------------------------------------------------------------------------
  */

  const numericPaymentAmount =
    toNumber(
      paymentAmount
    );


  const paymentExceedsCharge =
    numericPaymentAmount >
    outstandingAmount;


  const walletBalance =
    toNumber(
      wallet?.balance
    );


  const paymentExceedsWallet =
    paymentMethod ===
      "MEDCARD" &&
    numericPaymentAmount >
      walletBalance;


  const canPay =
    !!selectedCharge &&
    outstandingAmount > 0 &&
    numericPaymentAmount > 0 &&
    !paymentExceedsCharge &&
    !paymentExceedsWallet &&
    !processingPayment &&
    !waitingForSecondTap;


  /*
  |--------------------------------------------------------------------------
  | AUTOMATIC PAYMENT AMOUNT
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {

      if (
        selectedCharge &&
        !waitingForSecondTap
      ) {

        const balance =
          balances[
            selectedCharge.id
          ];

        const remaining =
          balance
            ? toNumber(
                balance.remainingBalance
              )
            : selectedCharge.status ===
                "PAID"
              ? 0
              : toNumber(
                  selectedCharge.patientAmount
                );

        if (
          remaining > 0
        ) {

          setPaymentAmount(
            String(
              remaining
            )
          );

        }

      }

    },
    [
      selectedCharge,
      balances,
      waitingForSecondTap,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | TOTAL OUTSTANDING
  |--------------------------------------------------------------------------
  */

  const totalOutstanding =
    useMemo(
      () =>
        charges.reduce(
          (
            total,
            charge
          ) => {

            const balance =
              balances[
                charge.id
              ];

            if (
              balance
            ) {

              return (
                total +
                Math.max(
                  0,
                  toNumber(
                    balance.remainingBalance
                  )
                )
              );

            }

            if (
              charge.status ===
              "PAID"
            ) {
              return total;
            }

            return (
              total +
              Math.max(
                0,
                toNumber(
                  charge.patientAmount
                )
              )
            );

          },
          0
        ),
      [
        charges,
        balances,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | TOTAL CHARGED
  |--------------------------------------------------------------------------
  */

  const totalCharged =
    useMemo(
      () =>
        charges.reduce(
          (
            total,
            charge
          ) =>
            total +
            toNumber(
              charge.patientAmount
            ),
          0
        ),
      [
        charges,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | TOTAL PAID
  |--------------------------------------------------------------------------
  */

  const totalPaid =
    useMemo(
      () =>
        payments.reduce(
          (
            total,
            payment
          ) =>
            total +
            toNumber(
              payment.amount
            ),
          0
        ),
      [
        payments,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | CREATE REAL MEDCARD PAYMENT INTENT
  |--------------------------------------------------------------------------
  */

  const createMedCardPaymentIntent =
    async () => {

      if (
        !selectedCharge
      ) {

        setError(
          "Select a valid outstanding charge first."
        );

        return;
      }


      if (
        !patientId
      ) {

        setError(
          "Patient ID is required."
        );

        return;
      }


      if (
        !encounterId
      ) {

        setError(
          "Encounter ID is required."
        );

        return;
      }


      if (
        numericPaymentAmount <=
        0
      ) {

        setError(
          "Enter a valid payment amount."
        );

        return;
      }


      if (
        paymentExceedsCharge
      ) {

        setError(
          "Payment amount exceeds the outstanding charge balance."
        );

        return;
      }


      if (
        paymentExceedsWallet
      ) {

        setError(
          "Insufficient MedCard wallet balance."
        );

        return;
      }


      try {

        setProcessingPayment(
          true
        );

        setError("");

        setSuccessMessage("");

        /*
        |--------------------------------------------------------------------------
        | REAL BACKEND PAYMENT INTENT
        |--------------------------------------------------------------------------
        */

        const result =
          await request<any>(
            "/payment-intents",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  /*
                  |--------------------------------------------------------------------------
                  | IMPORTANT
                  |
                  | This is the existing facility ID
                  | already used by the application.
                  |--------------------------------------------------------------------------
                  */

                  facilityId:
                    DEMO_FACILITY_ID,

                  chargeId:
                    selectedCharge.id,

                  patientId,

                  encounterId,

                  amount:
                    numericPaymentAmount,

                  method:
                    "MEDCARD",

                  reference:
                    paymentReference.trim() ||
                    undefined,

                  notes:
                    paymentNotes.trim() ||
                    undefined,
                }),
            }
          );


        /*
        |--------------------------------------------------------------------------
        | BACKEND MAY WRAP PAYMENT INTENT
        |--------------------------------------------------------------------------
        */

        const intent =
          result?.paymentIntent ||
          result?.intent ||
          result?.data?.paymentIntent ||
          result?.data ||
          result;


        if (
          !intent?.id
        ) {

          throw new Error(
            "The backend did not return a valid payment intent."
          );

        }


        /*
        |--------------------------------------------------------------------------
        | STORE REAL INTENT
        |--------------------------------------------------------------------------
        */

        setPaymentIntent(
          intent as PaymentIntent
        );


        /*
        |--------------------------------------------------------------------------
        | NOW WAIT FOR SECOND NFC TAP
        |--------------------------------------------------------------------------
        */

        setSecondTapCardUid(
          null
        );

        setWaitingForSecondTap(
          true
        );

        setSuccessMessage(
          `Payment intent created. Tap the patient's MedCard to authorize ${formatRwf(
            numericPaymentAmount
          )}.`
        );

      } catch (
        intentError: any
      ) {

        setWaitingForSecondTap(
          false
        );

        setPaymentIntent(
          null
        );

        setSecondTapCardUid(
          null
        );

        setError(
          intentError?.response
            ?.data?.message ||
            intentError?.message ||
            "Unable to prepare MedCard payment."
        );

      } finally {

        setProcessingPayment(
          false
        );

      }

    };


  /*
  |--------------------------------------------------------------------------
  | CANCEL PAYMENT INTENT
  |--------------------------------------------------------------------------
  */

  const cancelSecondTap =
    async () => {

      if (
        paymentIntent?.id
      ) {

        try {

          await request<any>(
            `/payment-intents/${encodeURIComponent(
              paymentIntent.id
            )}/cancel`,
            {
              method:
                "POST",
            }
          );

        } catch {
          /*
           * Even if cancellation endpoint
           * fails, clear local waiting state.
           */
        }

      }


      setWaitingForSecondTap(
        false
      );

      setPaymentIntent(
        null
      );

      setSecondTapCardUid(
        null
      );

      setProcessingPayment(
        false
      );

      setSuccessMessage("");

      setError(
        "MedCard payment cancelled."
      );

    };


  /*
  |--------------------------------------------------------------------------
  | SECOND NFC TAP
  |--------------------------------------------------------------------------
  |
  | This does NOT create another payment.
  |
  | It sends the actual card UID to the
  | existing payment intent created above.
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {

      if (
        !waitingForSecondTap ||
        !paymentIntent?.id
      ) {
        return;
      }


      const handleSecondTap =
        async (
          event: any
        ) => {

          /*
          |--------------------------------------------------------------------------
          | Extract actual UID from socket event
          |--------------------------------------------------------------------------
          */

          const cardUid =
            event?.data?.card?.cardUid ||
            event?.data?.cardUid ||
            event?.cardUid ||
            event?.data?.data?.card?.cardUid;


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

            setProcessingPayment(
              true
            );

            setError("");

            setSuccessMessage(
              "MedCard detected. Processing payment..."
            );


            /*
            |--------------------------------------------------------------------------
            | PROCESS REAL PAYMENT
            |--------------------------------------------------------------------------
            */

            const result =
              await request<any>(
                `/payment-intents/${encodeURIComponent(
                  paymentIntent.id
                )}/process`,
                {
                  method:
                    "POST",

                  body:
                    JSON.stringify({
                      cardUid,
                    }),
                }
              );


            /*
            |--------------------------------------------------------------------------
            | PAYMENT SUCCESS
            |--------------------------------------------------------------------------
            */

            const paymentResponse:
              PaymentResponse =
              result?.payment
                ? result
                : {
                    payment:
                      result?.result
                        ?.payment ||
                      result?.payment,

                    wallet:
                      result?.result
                        ?.wallet ||
                      result?.wallet,

                    calculation:
                      result?.result
                        ?.calculation ||
                      result?.calculation,

                    alreadyProcessed:
                      result?.alreadyProcessed,

                    paymentIntent:
                      result?.paymentIntent,

                    charge:
                      result?.charge,

                    result,
                  };


            setLastPayment(
              paymentResponse
            );


            setWaitingForSecondTap(
              false
            );

            setPaymentIntent(
              null
            );

            setSecondTapCardUid(
              null
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
            | REFRESH REAL BACKEND DATA
            |--------------------------------------------------------------------------
            */

            await loadData(
              true
            );


          } catch (
            paymentError: any
          ) {

            setSecondTapCardUid(
              null
            );

            const message =
              paymentError?.response
                ?.data?.message ||
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
                .includes(
                  "expired"
                )
            ) {

              setWaitingForSecondTap(
                false
              );

              setPaymentIntent(
                null
              );

            }


            setError(
              message
            );

          } finally {

            setProcessingPayment(
              false
            );

          }

        };


      /*
      |--------------------------------------------------------------------------
      | LISTEN FOR REAL NFC IDENTIFICATION
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

    },
    [
      waitingForSecondTap,
      paymentIntent,
      secondTapCardUid,
      request,
      loadData,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | NORMAL CASH / MOBILE MONEY PAYMENT
  |--------------------------------------------------------------------------
  */

  const createNormalPayment =
    async () => {

      if (
        !selectedCharge
      ) {

        setError(
          "Select a charge first."
        );

        return;
      }


      if (
        numericPaymentAmount <=
        0
      ) {

        setError(
          "Enter a valid payment amount."
        );

        return;
      }


      if (
        paymentExceedsCharge
      ) {

        setError(
          "Payment amount exceeds the outstanding charge balance."
        );

        return;
      }


      try {

        setProcessingPayment(
          true
        );

        setError("");

        setSuccessMessage("");


        const payment =
          await request<Payment>(
            `/charges/${encodeURIComponent(
              selectedCharge.id
            )}/payments`,
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  amount:
                    numericPaymentAmount,

                  method:
                    paymentMethod,

                  reference:
                    paymentReference.trim() ||
                    undefined,

                  notes:
                    paymentNotes.trim() ||
                    undefined,
                }),
            }
          );


        setLastPayment({
          payment,

          charge:
            selectedCharge,
        });


        setSuccessMessage(
          "Payment completed successfully."
        );


        setPaymentReference("");

        setPaymentNotes("");


        await loadData(
          true
        );

      } catch (
        paymentError: any
      ) {

        setError(
          paymentError?.response
            ?.data?.message ||
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
  | MAIN PAYMENT HANDLER
  |--------------------------------------------------------------------------
  */

  const handlePayment =
    async () => {

      if (
        paymentMethod ===
        "MEDCARD"
      ) {

        await createMedCardPaymentIntent();

        return;
      }


      await createNormalPayment();

    };


  /*
  |--------------------------------------------------------------------------
  | SELECT CHARGE
  |--------------------------------------------------------------------------
  */

  const handleSelectCharge =
    (
      charge: Charge
    ) => {

      const balance =
        balances[
          charge.id
        ];


      const remaining =
        balance
          ? toNumber(
              balance.remainingBalance
            )
          : charge.status ===
              "PAID"
            ? 0
            : toNumber(
                charge.patientAmount
              );


      setSelectedChargeId(
        charge.id
      );


      if (
        remaining > 0
      ) {

        setPaymentAmount(
          String(
            remaining
          )
        );

      } else {

        setPaymentAmount(
          ""
        );

      }


      setPaymentReference("");

      setPaymentNotes("");

      setError("");

      setSuccessMessage("");

      setLastPayment(
        null
      );

    };


  /*
  |--------------------------------------------------------------------------
  | PATIENT DISPLAY
  |--------------------------------------------------------------------------
  */

  const patientName =
    patient
      ? `${patient.firstName || ""} ${
          patient.lastName || ""
        }`.trim()
      : "Patient";


  /*
  |--------------------------------------------------------------------------
  | BACK TO PATIENT
  |--------------------------------------------------------------------------
  */

  const handleBackToPatient =
    () => {

      if (!patientId) {

        navigate(
          "/patients"
        );

        return;
      }


      const search =
        encounterId
          ? `?encounterId=${encodeURIComponent(
              encounterId
            )}`
          : "";


      navigate(
        `/patients/${encodeURIComponent(
          patientId
        )}${search}`
      );

    };


  /*
  |--------------------------------------------------------------------------
  | PAYMENT METHOD LABEL
  |--------------------------------------------------------------------------
  */

  const paymentMethodLabel =
    paymentMethod ===
    "MEDCARD"
      ? "MedCard"
      : paymentMethod ===
          "MOBILE_MONEY"
        ? "Mobile Money"
        : "Cash";


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="payment-workspace-page">

      <main className="payment-page-content">

        {/* =========================================================
            HEADER
        ========================================================== */}

        <header className="payment-page-header">

          <div className="payment-header-left">

            <button
              type="button"
              className="payment-back-button"
              onClick={
                handleBackToPatient
              }
            >
              <ArrowLeft
                size={17}
              />

              <span>
                Back to patient
              </span>
            </button>


            <div className="payment-title-block">

              <span className="payment-eyebrow">
                MEDCARD PAYMENTS
              </span>

              <h1>
                Payment Workspace
              </h1>

              <p>
                Manage real charges and process
                secure patient payments.
              </p>

            </div>

          </div>


          <button
            type="button"
            className="payment-refresh-button"
            onClick={() =>
              loadData(
                true
              )
            }
            disabled={
              loading ||
              refreshing ||
              waitingForSecondTap
            }
          >

            {refreshing ? (
              <LoaderCircle
                size={16}
                className="payment-spin"
              />
            ) : (
              <RefreshCw
                size={16}
              />
            )}

            <span>
              Refresh
            </span>

          </button>

        </header>


        {/* =========================================================
            ERROR
        ========================================================== */}

        {error && (
          <div className="payment-alert payment-alert-error">

            <XCircle
              size={19}
            />

            <div>

              <strong>
                Payment error
              </strong>

              <span>
                {error}
              </span>

            </div>

          </div>
        )}


        {/* =========================================================
            SUCCESS
        ========================================================== */}

        {successMessage && (
          <div className="payment-alert payment-alert-success">

            <CheckCircle2
              size={19}
            />

            <div>

              <strong>
                MedCard
              </strong>

              <span>
                {successMessage}
              </span>

            </div>

          </div>
        )}


        {/* =========================================================
            PATIENT SUMMARY
        ========================================================== */}

        <section className="payment-patient-card">

          <div className="payment-patient-avatar">
            {getInitials(
              patient?.firstName,
              patient?.lastName
            )}
          </div>


          <div className="payment-patient-info">

            <span>
              PATIENT
            </span>

            <h2>
              {patientName}
            </h2>

            <small>
              {patient?.patientNumber ||
                patientId ||
                "—"}
            </small>

          </div>


          <div className="payment-patient-meta">

            <div>

              <span>
                Encounter
              </span>

              <strong>
                {encounter?.id
                  ? encounter.id.slice(
                      0,
                      8
                    )
                  : encounterId
                    ? encounterId.slice(
                        0,
                        8
                      )
                    : "—"}
              </strong>

            </div>


            <div>

              <span>
                Wallet
              </span>

              <strong>
                {formatRwf(
                  wallet?.balance
                )}
              </strong>

            </div>

          </div>

        </section>


        {/* =========================================================
            SUMMARY
        ========================================================== */}

        <section className="payment-summary-grid">

          <div className="payment-summary-card">

            <div className="payment-summary-icon">

              <CreditCard
                size={19}
              />

            </div>

            <div>

              <span>
                Total charges
              </span>

              <strong>
                {formatRwf(
                  totalCharged
                )}
              </strong>

            </div>

          </div>


          <div className="payment-summary-card">

            <div className="payment-summary-icon">

              <Banknote
                size={19}
              />

            </div>

            <div>

              <span>
                Total paid
              </span>

              <strong>
                {formatRwf(
                  totalPaid
                )}
              </strong>

            </div>

          </div>


          <div className="payment-summary-card">

            <div className="payment-summary-icon">

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
                  totalOutstanding
                )}
              </strong>

            </div>

          </div>

        </section>


        {/* =========================================================
            TABS
        ========================================================== */}

        <div className="payment-tabs">

          <button
            type="button"
            className={
              activeTab ===
              "charges"
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
              size={16}
            />

            Charges

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
              size={16}
            />

            Wallet activity

          </button>

        </div>


        {/* =========================================================
            LOADING
        ========================================================== */}

        {loading ? (

          <section className="payment-loading-state">

            <LoaderCircle
              size={32}
              className="payment-spin"
            />

            <strong>
              Loading payment information...
            </strong>

            <span>
              Retrieving real charges and
              wallet information.
            </span>

          </section>

        ) : (

          <> 
                      {/* =====================================================
                CHARGES TAB
            ====================================================== */}

            {activeTab === "charges" && (
              <section className="payment-main-grid">

                {/* =================================================
                    CHARGE LIST
                ================================================== */}

                <div className="payment-charges-panel">

                  <div className="payment-section-header">

                    <div>

                      <span className="payment-section-eyebrow">
                        ENCOUNTER CHARGES
                      </span>

                      <h2>
                        Outstanding services
                      </h2>

                      <p>
                        Select a charge to process
                        payment.
                      </p>

                    </div>

                    <span className="payment-charge-count">
                      {charges.length}{" "}
                      {charges.length === 1
                        ? "charge"
                        : "charges"}
                    </span>

                  </div>


                  {charges.length === 0 ? (

                    <div className="payment-empty-state">

                      <CreditCard
                        size={34}
                      />

                      <strong>
                        No charges found
                      </strong>

                      <span>
                        No charges have been created
                        for this encounter yet.
                      </span>

                    </div>

                  ) : (

                    <div className="payment-charge-list">

                      {charges.map(
                        (
                          charge
                        ) => {

                          const balance =
                            balances[
                              charge.id
                            ];


                          const remaining =
                            balance
                              ? toNumber(
                                  balance.remainingBalance
                                )
                              : charge.status ===
                                  "PAID"
                                ? 0
                                : toNumber(
                                    charge.patientAmount
                                  );


                          const isSelected =
                            selectedChargeId ===
                            charge.id;


                          const isPaid =
                            remaining <=
                              0 ||
                            charge.status ===
                              "PAID";


                          return (

                            <button
                              key={
                                charge.id
                              }
                              type="button"
                              className={`payment-charge-row ${
                                isSelected
                                  ? "selected"
                                  : ""
                              } ${
                                isPaid
                                  ? "paid"
                                  : ""
                              }`}
                              onClick={() =>
                                handleSelectCharge(
                                  charge
                                )
                              }
                            >

                              <div className="payment-charge-main">

                                <div className="payment-charge-icon">

                                  {isPaid ? (
                                    <CheckCircle2
                                      size={18}
                                    />
                                  ) : (
                                    <CreditCard
                                      size={18}
                                    />
                                  )}

                                </div>


                                <div className="payment-charge-details">

                                  <strong>
                                    {getChargeLabel(
                                      charge
                                    )}
                                  </strong>

                                  <span>
                                    {charge.service
                                      ?.code ||
                                      "Healthcare service"}
                                  </span>

                                  <small>
                                    Created{" "}
                                    {formatDateTime(
                                      charge.createdAt
                                    )}
                                  </small>

                                </div>

                              </div>


                              <div className="payment-charge-amounts">

                                <div>

                                  <span>
                                    Patient amount
                                  </span>

                                  <strong>
                                    {formatRwf(
                                      charge.patientAmount
                                    )}
                                  </strong>

                                </div>


                                <div>

                                  <span>
                                    Remaining
                                  </span>

                                  <strong
                                    className={
                                      remaining >
                                      0
                                        ? "amount-due"
                                        : "amount-paid"
                                    }
                                  >
                                    {formatRwf(
                                      remaining
                                    )}
                                  </strong>

                                </div>

                              </div>


                              <div className="payment-charge-status">

                                <span
                                  className={`payment-status-badge ${
                                    isPaid
                                      ? "paid"
                                      : "pending"
                                  }`}
                                >
                                  {isPaid
                                    ? "Paid"
                                    : getStatusLabel(
                                        charge.status
                                      )}
                                </span>

                                <ChevronRight
                                  size={17}
                                />

                              </div>

                            </button>

                          );

                        }
                      )}

                    </div>

                  )}

                </div>


                {/* =================================================
                    PAYMENT PANEL
                ================================================== */}

                <aside className="payment-processing-panel">

                  <div className="payment-section-header">

                    <div>

                      <span className="payment-section-eyebrow">
                        PAYMENT
                      </span>

                      <h2>
                        Process payment
                      </h2>

                    </div>

                    <ShieldCheck
                      size={20}
                    />

                  </div>


                  {!selectedCharge ? (

                    <div className="payment-select-charge-state">

                      <CreditCard
                        size={36}
                      />

                      <strong>
                        Select a charge
                      </strong>

                      <span>
                        Choose an outstanding charge
                        from the list to continue.
                      </span>

                    </div>

                  ) : (

                    <>

                      {/* =========================================
                          SELECTED CHARGE
                      ========================================== */}

                      <div className="payment-selected-charge">

                        <div>

                          <span>
                            Selected charge
                          </span>

                          <strong>
                            {getChargeLabel(
                              selectedCharge
                            )}
                          </strong>

                        </div>


                        <div className="selected-charge-amount">

                          {formatRwf(
                            outstandingAmount
                          )}

                        </div>

                      </div>


                      {/* =========================================
                          PAYMENT METHOD
                      ========================================== */}

                      <div className="payment-form-group">

                        <label>
                          Payment method
                        </label>


                        <div className="payment-method-grid">

                          <button
                            type="button"
                            className={
                              paymentMethod ===
                              "MEDCARD"
                                ? "active"
                                : ""
                            }
                            onClick={() => {

                              setPaymentMethod(
                                "MEDCARD"
                              );

                              setError("");

                              setSuccessMessage("");

                            }}
                            disabled={
                              waitingForSecondTap ||
                              processingPayment
                            }
                          >

                            <CreditCard
                              size={18}
                            />

                            <span>
                              MedCard
                            </span>

                            <small>
                              Tap to pay
                            </small>

                          </button>


                          <button
                            type="button"
                            className={
                              paymentMethod ===
                              "CASH"
                                ? "active"
                                : ""
                            }
                            onClick={() => {

                              setPaymentMethod(
                                "CASH"
                              );

                              setError("");

                              setSuccessMessage("");

                            }}
                            disabled={
                              waitingForSecondTap ||
                              processingPayment
                            }
                          >

                            <Banknote
                              size={18}
                            />

                            <span>
                              Cash
                            </span>

                            <small>
                              Manual payment
                            </small>

                          </button>


                          <button
                            type="button"
                            className={
                              paymentMethod ===
                              "MOBILE_MONEY"
                                ? "active"
                                : ""
                            }
                            onClick={() => {

                              setPaymentMethod(
                                "MOBILE_MONEY"
                              );

                              setError("");

                              setSuccessMessage("");

                            }}
                            disabled={
                              waitingForSecondTap ||
                              processingPayment
                            }
                          >

                            <Smartphone
                              size={18}
                            />

                            <span>
                              Mobile Money
                            </span>

                            <small>
                              MTN / Airtel
                            </small>

                          </button>

                        </div>

                      </div>


                      {/* =========================================
                          AMOUNT
                      ========================================== */}

                      <div className="payment-form-group">

                        <label
                          htmlFor="paymentAmount"
                        >
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
                            onChange={(
                              event
                            ) =>
                              setPaymentAmount(
                                event.target.value
                              )
                            }
                            disabled={
                              waitingForSecondTap ||
                              processingPayment
                            }
                            placeholder="0"
                          />

                          <span>
                            RWF
                          </span>

                        </div>


                        <div className="payment-amount-hint">

                          Outstanding balance:{" "}

                          <strong>
                            {formatRwf(
                              outstandingAmount
                            )}
                          </strong>

                        </div>


                        {paymentExceedsCharge && (
                          <div className="payment-field-error">
                            Payment amount cannot
                            exceed the outstanding
                            charge.
                          </div>
                        )}


                        {paymentExceedsWallet && (
                          <div className="payment-field-error">
                            Insufficient wallet
                            balance.
                          </div>
                        )}

                      </div>


                      {/* =========================================
                          MEDCARD WALLET
                      ========================================== */}

                      {paymentMethod ===
                        "MEDCARD" && (

                        <div className="payment-wallet-info">

                          <div className="payment-wallet-info-icon">

                            <Wallet
                              size={18}
                            />

                          </div>


                          <div>

                            <span>
                              Available wallet balance
                            </span>

                            <strong>
                              {formatRwf(
                                wallet?.balance
                              )}
                            </strong>

                          </div>

                        </div>

                      )}


                      {/* =========================================
                          REFERENCE
                      ========================================== */}

                      <div className="payment-form-group">

                        <label
                          htmlFor="paymentReference"
                        >
                          Reference
                          <span>
                            {" "}
                            (optional)
                          </span>
                        </label>


                        <input
                          id="paymentReference"
                          type="text"
                          value={
                            paymentReference
                          }
                          onChange={(
                            event
                          ) =>
                            setPaymentReference(
                              event.target.value
                            )
                          }
                          disabled={
                            waitingForSecondTap ||
                            processingPayment
                          }
                          placeholder="Payment reference"
                          className="payment-text-input"
                        />

                      </div>


                      {/* =========================================
                          NOTES
                      ========================================== */}

                      <div className="payment-form-group">

                        <label
                          htmlFor="paymentNotes"
                        >
                          Notes
                          <span>
                            {" "}
                            (optional)
                          </span>
                        </label>


                        <textarea
                          id="paymentNotes"
                          value={
                            paymentNotes
                          }
                          onChange={(
                            event
                          ) =>
                            setPaymentNotes(
                              event.target.value
                            )
                          }
                          disabled={
                            waitingForSecondTap ||
                            processingPayment
                          }
                          placeholder="Add payment notes..."
                          rows={3}
                          className="payment-textarea"
                        />

                      </div>


                      {/* =========================================
                          REAL SECOND TAP STATE
                      ========================================== */}

                      {waitingForSecondTap && (

                        <div className="payment-second-tap-card">

                          <div className="payment-second-tap-icon">

                            {secondTapCardUid ? (

                              <LoaderCircle
                                size={28}
                                className="payment-spin"
                              />

                            ) : (

                              <Wifi
                                size={28}
                              />

                            )}

                          </div>


                          <div>

                            <strong>
                              {secondTapCardUid
                                ? "Authorizing payment..."
                                : "Tap MedCard to pay"}
                            </strong>


                            <span>
                              {secondTapCardUid
                                ? "MedCard detected. Please wait while the real payment is processed."
                                : `Tap the patient's MedCard to authorize ${formatRwf(
                                    numericPaymentAmount
                                  )}.`}
                            </span>

                          </div>


                          {!secondTapCardUid && (

                            <button
                              type="button"
                              className="payment-cancel-button"
                              onClick={
                                cancelSecondTap
                              }
                              disabled={
                                processingPayment
                              }
                            >
                              Cancel
                            </button>

                          )}

                        </div>

                      )}


                      {/* =========================================
                          PAYMENT BUTTON
                      ========================================== */}

                      {!waitingForSecondTap && (

                        <button
                          type="button"
                          className="payment-submit-button"
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
                                size={18}
                                className="payment-spin"
                              />

                              <span>
                                Preparing payment...
                              </span>

                            </>

                          ) : (

                            <>

                              {paymentMethod ===
                              "MEDCARD" ? (

                                <CreditCard
                                  size={18}
                                />

                              ) : (

                                <Banknote
                                  size={18}
                                />

                              )}


                              <span>
                                {paymentMethod ===
                                "MEDCARD"
                                  ? "Continue with MedCard"
                                  : "Complete payment"}
                              </span>


                              <ArrowUpRight
                                size={17}
                              />

                            </>

                          )}

                        </button>

                      )}


                      {/* =========================================
                          SECURITY NOTE
                      ========================================== */}

                      {paymentMethod ===
                        "MEDCARD" &&
                        !waitingForSecondTap && (

                        <div className="payment-security-note">

                          <LockKeyhole
                            size={15}
                          />

                          <span>
                            MedCard payment requires
                            a second physical card tap
                            before the wallet is debited.
                          </span>

                        </div>

                      )}

                    </>

                  )}

                </aside>

              </section>
            )}


            {/* =====================================================
                WALLET TRANSACTIONS TAB
            ====================================================== */}

            {activeTab ===
              "transactions" && (

              <section className="payment-transactions-panel">

                <div className="payment-section-header">

                  <div>

                    <span className="payment-section-eyebrow">
                      WALLET ACTIVITY
                    </span>

                    <h2>
                      Recent transactions
                    </h2>

                    <p>
                      Real wallet transactions
                      recorded by MedCard.
                    </p>

                  </div>


                  <Wallet
                    size={21}
                  />

                </div>


                {transactions.length ===
                0 ? (

                  <div className="payment-empty-state">

                    <History
                      size={34}
                    />

                    <strong>
                      No wallet transactions
                    </strong>

                    <span>
                      There is no transaction
                      history for this patient yet.
                    </span>

                  </div>

                ) : (

                  <div className="payment-transaction-list">

                    {transactions.map(
                      (
                        transaction
                      ) => {

                        const isCredit =
                          transaction.type ===
                          "CREDIT";


                        return (

                          <div
                            key={
                              transaction.id
                            }
                            className="payment-transaction-row"
                          >

                            <div
                              className={`payment-transaction-icon ${
                                isCredit
                                  ? "credit"
                                  : "debit"
                              }`}
                            >

                              <ArrowUpRight
                                size={17}
                              />

                            </div>


                            <div className="payment-transaction-details">

                              <strong>
                                {transaction.description ||
                                  (isCredit
                                    ? "Wallet top-up"
                                    : "Wallet payment")}
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

                              <strong
                                className={
                                  isCredit
                                    ? "credit"
                                    : "debit"
                                }
                              >
                                {isCredit
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

                        );

                      }
                    )}

                  </div>

                )}

              </section>

            )}


            {/* =====================================================
                LAST PAYMENT RESULT
            ====================================================== */}

            {lastPayment && (

              <section className="payment-success-card">

                <div className="payment-success-icon">

                  <CheckCircle2
                    size={25}
                  />

                </div>


                <div className="payment-success-content">

                  <span className="payment-section-eyebrow">
                    PAYMENT CONFIRMED
                  </span>

                  <h2>
                    Payment completed
                  </h2>

                  <p>
                    The payment has been recorded
                    by the MedCard backend.
                  </p>


                  <div className="payment-success-details">

                    <div>

                      <span>
                        Amount
                      </span>

                      <strong>
                        {formatRwf(
                          lastPayment
                            .payment
                            ?.amount
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Method
                      </span>

                      <strong>
                        {lastPayment
                          .payment
                          ?.method ||
                          paymentMethodLabel}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Reference
                      </span>

                      <strong>
                        {lastPayment
                          .payment
                          ?.reference ||
                          "—"}
                      </strong>

                    </div>


                    {lastPayment.wallet && (

                      <div>

                        <span>
                          New wallet balance
                        </span>

                        <strong>
                          {formatRwf(
                            lastPayment
                              .wallet
                              .balanceAfter ??
                            lastPayment
                              .wallet
                              .balance
                          )}
                        </strong>

                      </div>

                    )}

                  </div>

                </div>

              </section>

            )}

          </>
        )}

      </main>

    </div>
  );
}

