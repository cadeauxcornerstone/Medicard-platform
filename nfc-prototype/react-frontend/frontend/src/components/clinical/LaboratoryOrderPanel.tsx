import { useState, type FormEvent } from "react";
import {
  Beaker,
  Check,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LoaderCircle,
  Send,
  ShieldCheck,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

const DEVELOPMENT_USER_ID =
  import.meta.env.VITE_DEMO_USER_ID ||
  "ac844b2b-cc1b-45a4-9404-e059fdd6df0b";

interface LaboratoryOrderPanelProps {
  patientId: string;
  encounterId: string | null;
  disabled?: boolean;
}

interface LaboratoryTest {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface LaboratoryRequest {
  id: string;
  status: string;
  clinicalIndication?: string | null;
  notes?: string | null;
  requestedAt?: string;
}

interface CreatedCharge {
  id: string;
  patientId: string;
  encounterId: string;
  serviceId: string;
  servicePriceId?: string | null;
  quantity: number;
  unitPrice: number | string;
  subtotal: number | string;
  insuranceAmount: number | string;
  patientAmount: number | string;
  currency: string;
  status: string;
  description?: string | null;
}

/*
|--------------------------------------------------------------------------
| AVAILABLE LABORATORY TESTS
|--------------------------------------------------------------------------
|
| These are the tests displayed to the doctor.
|
| IMPORTANT:
| We do NOT hard-code service UUIDs here.
|
| When the doctor orders a test, the component searches the MedCard
| service catalogue using the test name and gets the REAL serviceId
| from the backend.
|
|--------------------------------------------------------------------------
*/

const AVAILABLE_TESTS: LaboratoryTest[] = [
  {
    id: "cbc",
    name: "Complete Blood Count",
    code: "LAB-CBC",
    description:
      "Measures red blood cells, white blood cells, hemoglobin and platelets.",
  },

  {
    id: "glucose",
    name: "Blood Glucose Test",
    code: "LAB-GLUCOSE",
    description:
      "Measures the level of glucose in the blood.",
  },

  {
    id: "lipid",
    name: "Lipid Profile",
    code: "LAB-LIPID",
    description:
      "Measures cholesterol and triglyceride levels.",
  },

  {
    id: "malaria",
    name: "Malaria Test",
    code: "LAB-MALARIA",
    description:
      "Laboratory investigation for malaria parasites.",
  },

  {
    id: "urinalysis",
    name: "Urinalysis",
    code: "LAB-URINALYSIS",
    description:
      "Examines urine for signs of infection and other abnormalities.",
  },

  {
    id: "hiv",
    name: "HIV Test",
    code: "LAB-HIV",
    description:
      "Laboratory screening test for HIV infection.",
  },

  {
    id: "hepatitis-b",
    name: "Hepatitis B Test",
    code: "LAB-HBV",
    description:
      "Screens for hepatitis B infection.",
  },

  {
    id: "pregnancy",
    name: "Pregnancy Test",
    code: "LAB-PREGNANCY",
    description:
      "Detects pregnancy using a laboratory test.",
  },

  {
    id: "liver-function",
    name: "Liver Function Test",
    code: "LAB-LFT",
    description:
      "Assesses laboratory markers associated with liver function.",
  },

  {
    id: "kidney-function",
    name: "Kidney Function Test",
    code: "LAB-KFT",
    description:
      "Assesses laboratory markers associated with kidney function.",
  },
];

function LaboratoryOrderPanel({
  patientId,
  encounterId,
  disabled = false,
}: LaboratoryOrderPanelProps) {
  const [selectedTests, setSelectedTests] =
    useState<string[]>([]);

  const [
    clinicalIndication,
    setClinicalIndication,
  ] = useState("");

  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [request, setRequest] =
    useState<LaboratoryRequest | null>(null);

  const [createdCharges, setCreatedCharges] =
    useState<CreatedCharge[]>([]);

  /*
  |--------------------------------------------------------------------------
  | TOGGLE TEST
  |--------------------------------------------------------------------------
  */

  const toggleTest = (testId: string) => {
    if (disabled || submitting) {
      return;
    }

    setSelectedTests((current) =>
      current.includes(testId)
        ? current.filter(
            (id) => id !== testId
          )
        : [...current, testId]
    );

    setErrorMessage("");
    setSuccessMessage("");
  };

  /*
  |--------------------------------------------------------------------------
  | FIND BACKEND SERVICE
  |--------------------------------------------------------------------------
  |
  | The frontend test ID is NOT the database service ID.
  |
  | Example:
  |
  | "Complete Blood Count"
  |          ↓
  | GET /services?search=Complete%20Blood%20Count
  |          ↓
  | service.id
  |          ↓
  | POST /encounters/:encounterId/charges
  |
  |--------------------------------------------------------------------------
  */

  const findBackendService = async (
    test: LaboratoryTest
  ) => {
    const response = await fetch(
      `${API_URL}/services?search=${encodeURIComponent(
        test.name
      )}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.message ||
          `Unable to find laboratory service "${test.name}".`
      );
    }

    const services = Array.isArray(result?.data)
      ? result.data
      : [];

    /*
     * Prefer exact name match.
     */
    const exactMatch = services.find(
      (service: any) =>
        String(service?.name || "")
          .trim()
          .toLowerCase() ===
        test.name.trim().toLowerCase()
    );

    const service = exactMatch || services[0];

    if (!service?.id) {
      throw new Error(
        `Laboratory service "${test.name}" is not registered in the MedCard service catalogue.`
      );
    }

    return service;
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE BILLING CHARGE
  |--------------------------------------------------------------------------
  |
  | THIS IS THE SAME OPERATION YOU SUCCESSFULLY TESTED IN POWERSHELL.
  |
  | Terminal:
  |
  | POST /encounters/:encounterId/charges
  |
  | {
  |   patientId,
  |   serviceId,
  |   quantity,
  |   description
  | }
  |
  |--------------------------------------------------------------------------
  */

  const createLaboratoryCharge = async (
    test: LaboratoryTest
  ): Promise<CreatedCharge> => {
    const service =
      await findBackendService(test);

    console.log(
      "[MedCard] Creating laboratory charge",
      {
        patientId,
        encounterId,
        serviceId: service.id,
        serviceName: service.name,
        test: test.name,
      }
    );

    const response = await fetch(
      `${API_URL}/encounters/${encodeURIComponent(
        encounterId as string
      )}/charges`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          patientId,

          serviceId: service.id,

          quantity: 1,

          description:
            `Laboratory — ${test.name}`,
        }),
      }
    );

    const result = await response.json();

    console.log(
      "[MedCard] Charge response",
      result
    );

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.message ||
          `Failed to create charge for ${test.name}.`
      );
    }

    return result.data as CreatedCharge;
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT LABORATORY ORDER
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setCreatedCharges([]);
    setRequest(null);

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!patientId) {
      setErrorMessage(
        "Patient ID is missing."
      );
      return;
    }

    if (!encounterId) {
      setErrorMessage(
        "No active encounter was found. Open the patient from an active clinical encounter."
      );
      return;
    }

    if (disabled) {
      setErrorMessage(
        "This encounter is completed. Laboratory orders cannot be added."
      );
      return;
    }

    if (
      selectedTests.length === 0
    ) {
      setErrorMessage(
        "Please select at least one laboratory test."
      );
      return;
    }

    try {
      setSubmitting(true);

      console.log(
        "[MedCard] Creating laboratory request",
        {
          patientId,
          encounterId,
          selectedTests,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | STEP 1 — CREATE LABORATORY REQUEST
      |--------------------------------------------------------------------------
      */

      const labResponse =
        await fetch(
          `${API_URL}/encounters/${encodeURIComponent(
            encounterId
          )}/lab-requests`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              patientId,

              requestedById:
                DEVELOPMENT_USER_ID,

              clinicalIndication:
                clinicalIndication.trim() ||
                null,

              notes:
                notes.trim() ||
                null,

              tests:
                selectedTests.map(
                  (testId) => {
                    const test =
                      AVAILABLE_TESTS.find(
                        (item) =>
                          item.id ===
                          testId
                      );

                    return {
                      testName:
                        test?.name ||
                        testId,

                      testCode:
                        test?.code ||
                        null,
                    };
                  }
                ),
            }),
          }
        );

      const labResult =
        await labResponse.json();

      console.log(
        "[MedCard] Laboratory request response",
        labResult
      );

      if (
        !labResponse.ok ||
        !labResult?.success
      ) {
        throw new Error(
          labResult?.message ||
            `Laboratory request failed (${labResponse.status}).`
        );
      }

      const laboratoryRequest =
        labResult.data as LaboratoryRequest;

      setRequest(
        laboratoryRequest
      );

      /*
      |--------------------------------------------------------------------------
      | STEP 2 — CREATE BILLING CHARGES
      |--------------------------------------------------------------------------
      |
      | One selected laboratory test = one billing charge.
      |
      | The backend determines:
      |
      | - service price
      | - insurance amount
      | - patient amount
      | - currency
      |
      |--------------------------------------------------------------------------
      */

      const charges: CreatedCharge[] =
        [];

      for (
        const testId of selectedTests
      ) {
        const test =
          AVAILABLE_TESTS.find(
            (item) =>
              item.id === testId
          );

        if (!test) {
          continue;
        }

        const charge =
          await createLaboratoryCharge(
            test
          );

        console.log(
          "[MedCard] Laboratory charge created",
          charge
        );

        charges.push(charge);
      }

      setCreatedCharges(
        charges
      );

      /*
      |--------------------------------------------------------------------------
      | STEP 3 — CALCULATE PATIENT AMOUNT
      |--------------------------------------------------------------------------
      */

      const patientAmount =
        charges.reduce(
          (
            total,
            charge
          ) =>
            total +
            Number(
              charge.patientAmount ||
                0
            ),
          0
        );

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      setSuccessMessage(
        `Laboratory order created successfully. ${
          charges.length
        } charge${
          charges.length === 1
            ? ""
            : "s"
        } added. Patient payment: ${patientAmount.toLocaleString()} RWF.`
      );

      /*
      |--------------------------------------------------------------------------
      | RESET FORM
      |--------------------------------------------------------------------------
      */

      setSelectedTests([]);
      setClinicalIndication("");
      setNotes("");
    } catch (error) {
      console.error(
        "[MedCard] Laboratory order failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to create laboratory order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TOTAL PATIENT AMOUNT
  |--------------------------------------------------------------------------
  */

  const totalPatientAmount =
    createdCharges.reduce(
      (
        total,
        charge
      ) =>
        total +
        Number(
          charge.patientAmount ||
            0
        ),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <section className="clinical-workspace-section">

      {/* HEADER */}

      <div className="section-heading">

        <div>

          <span className="eyebrow">
            DIAGNOSTIC SERVICES
          </span>

          <h2>
            Laboratory orders
          </h2>

          <p>
            Request laboratory
            investigations for this
            patient's active encounter.
          </p>

        </div>

        <div className="workspace-session-badge">

          <Beaker size={15} />

          {disabled
            ? "Encounter completed"
            : "Doctor → Laboratory"}

        </div>

      </div>


      {/* WARNING */}

      {!encounterId && (
        <div className="clinical-warning">

          <ShieldCheck size={18} />

          <div>

            <strong>
              No active encounter
            </strong>

            <span>
              Laboratory orders require
              an active patient encounter.
            </span>

          </div>

        </div>
      )}


      {/* FORM */}

      <form
        className="clinical-assessment-form"
        onSubmit={handleSubmit}
      >

        {/* TESTS */}

        <div className="clinical-field">
          <label>Laboratory tests</label>

          <div className="lab-tests-selection-grid">
            {AVAILABLE_TESTS.map((test) => {
              const selected = selectedTests.includes(test.id);

              return (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => toggleTest(test.id)}
                  disabled={disabled || submitting || !encounterId}
                  className={`lab-test-select-card ${selected ? "is-selected" : ""}`}
                >
                  <div className="lab-test-card-header">
                    <div className={`lab-test-checkbox ${selected ? "checked" : ""}`}>
                      {selected && <Check size={13} strokeWidth={3} />}
                    </div>
                    <strong className="lab-test-name">{test.name}</strong>
                  </div>

                  <span className="lab-test-code">{test.code}</span>
                  <p className="lab-test-description">{test.description}</p>
                </button>
              );
            })}
          </div>

          <div className="lab-selected-count-badge">
            <Beaker size={14} />
            <span>
              {selectedTests.length} test{selectedTests.length === 1 ? "" : "s"} selected
            </span>
          </div>
        </div>


        {/* CLINICAL INDICATION */}

        <div className="clinical-field">

          <label>
            Clinical indication
          </label>

          <textarea
            value={
              clinicalIndication
            }

            onChange={(event) =>
              setClinicalIndication(
                event.target.value
              )
            }

            placeholder="Why is the laboratory investigation required?"

            rows={4}

            disabled={
              disabled ||
              submitting ||
              !encounterId
            }
          />

        </div>


        {/* NOTES */}

        <div className="clinical-field">

          <label>
            Additional laboratory notes
          </label>

          <textarea
            value={notes}

            onChange={(event) =>
              setNotes(
                event.target.value
              )
            }

            placeholder="Additional information for the laboratory team."

            rows={4}

            disabled={
              disabled ||
              submitting ||
              !encounterId
            }
          />

        </div>


        {/* SUCCESS */}

        {successMessage && (
          <div className="clinical-success">

            <CheckCircle2
              size={18}
            />

            <span>
              {successMessage}
            </span>

          </div>
        )}


        {/* ERROR */}

        {errorMessage && (
          <div className="clinical-error">

            <ShieldCheck
              size={18}
            />

            <span>
              {errorMessage}
            </span>

          </div>
        )}


        {/* REQUEST CREATED */}

        {request && (
          <div className="clinical-success">

            <ClipboardList
              size={18}
            />

            <div>

              <strong>
                Laboratory request created
              </strong>

              <div>
                Request ID:{" "}
                {request.id}
              </div>

              <div>
                Status:{" "}
                <strong>
                  {request.status}
                </strong>
              </div>

            </div>

          </div>
        )}


        {/* CHARGE CREATED */}

        {createdCharges.length >
          0 && (
          <div className="clinical-success">

            <CreditCard
              size={18}
            />

            <div>

              <strong>
                Billing charge created
              </strong>

              <div>
                Patient amount:{" "}
                <strong>
                  {totalPatientAmount.toLocaleString()}{" "}
                  RWF
                </strong>
              </div>

              <small>
                The charge is now
                available in the
                Payment Workspace.
              </small>

              <div
                style={{
                  marginTop:
                    "8px",
                }}
              >
                {createdCharges.map(
                  (charge) => (
                    <div
                      key={
                        charge.id
                      }
                    >
                      {charge.description ||
                        "Laboratory service"}{" "}
                      —{" "}
                      {Number(
                        charge.patientAmount ||
                          0
                      ).toLocaleString()}{" "}
                      RWF
                    </div>
                  )
                )}
              </div>

            </div>

          </div>
        )}


        {/* ACTION */}

        <div className="clinical-form-actions">

          <div className="clinical-form-status">

            <Beaker size={16} />

            <span>
              {encounterId
                ? `Active encounter: ${encounterId.slice(
                    0,
                    8
                  )}…`
                : "No active encounter"}
            </span>

          </div>


          <button
            type="submit"
            className="action-pill-btn primary"
            disabled={
              disabled ||
              submitting ||
              !encounterId ||
              selectedTests.length ===
                0
            }
          >

            {submitting ? (
              <>
                <LoaderCircle
                  size={17}
                  className="spin"
                />

                Creating laboratory
                order...
              </>
            ) : (
              <>
                <Send size={17} />

                Order Laboratory Tests
              </>
            )}

          </button>

        </div>

      </form>

    </section>
  );
}

export default LaboratoryOrderPanel;