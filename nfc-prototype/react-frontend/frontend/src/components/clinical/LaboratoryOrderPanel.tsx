import { useState } from "react";
import {
  Beaker,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  Send,
  ShieldCheck,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/v1";

const DEVELOPMENT_USER_ID =
  "ac844b2b-cc1b-45a4-9404-e059fdd6df0b";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface LaboratoryOrderPanelProps {
  patientId: string;
  encounterId: string | null;
  disabled?: boolean;
}

interface LaboratoryTest {
  id: string;
  name: string;
  description: string;
}

interface LaboratoryRequest {
  id: string;
  status: string;
  clinicalIndication: string | null;
  notes: string | null;
  requestedAt: string;
}

/*
|--------------------------------------------------------------------------
| AVAILABLE LABORATORY TESTS
|--------------------------------------------------------------------------
*/

const AVAILABLE_TESTS: LaboratoryTest[] = [
  {
    id: "cbc",
    name: "Complete Blood Count (CBC)",
    description:
      "Red cells, white cells, hemoglobin and platelet assessment.",
  },

  {
    id: "glucose",
    name: "Blood Glucose",
    description:
      "Measurement of blood glucose level.",
  },

  {
    id: "malaria",
    name: "Malaria Test",
    description:
      "Laboratory investigation for malaria infection.",
  },

  {
    id: "urinalysis",
    name: "Urinalysis",
    description:
      "Routine examination of urine.",
  },

  {
    id: "liver",
    name: "Liver Function Tests",
    description:
      "Laboratory assessment of liver-related markers.",
  },

  {
    id: "renal",
    name: "Renal Function Tests",
    description:
      "Assessment of kidney-related laboratory markers.",
  },
];

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

function LaboratoryOrderPanel({
  patientId,
  encounterId,
  disabled = false,
}: LaboratoryOrderPanelProps) {
  const [selectedTests, setSelectedTests] =
    useState<string[]>([]);

  const [clinicalIndication, setClinicalIndication] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [request, setRequest] =
    useState<LaboratoryRequest | null>(null);

  /*
  |--------------------------------------------------------------------------
  | TOGGLE TEST
  |--------------------------------------------------------------------------
  */

  const toggleTest = (
    testName: string
  ) => {
    if (disabled || submitting) {
      return;
    }

    setSelectedTests((current) =>
      current.includes(testName)
        ? current.filter(
            (name) =>
              name !== testName
          )
        : [
            ...current,
            testName,
          ]
    );
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT LABORATORY REQUEST
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (disabled) {
      setErrorMessage(
        "Laboratory ordering is unavailable because the encounter has been completed."
      );

      return;
    }

    if (!encounterId) {
      setErrorMessage(
        "A clinical encounter is required before ordering laboratory tests."
      );

      return;
    }

    if (!patientId) {
      setErrorMessage(
        "Patient information is missing."
      );

      return;
    }

    if (selectedTests.length === 0) {
      setErrorMessage(
        "Select at least one laboratory test."
      );

      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/encounters/${encounterId}/lab-requests`,
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
              notes.trim() || null,

            tests:
              selectedTests.map(
                (testName) => ({
                  testName,
                })
              ),
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to create laboratory request."
        );
      }

      setRequest(result.data);

      setSuccessMessage(
        "Laboratory request created successfully."
      );

      setSelectedTests([]);
      setClinicalIndication("");
      setNotes("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create laboratory request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | EFFECTIVE DISABLED STATE
  |--------------------------------------------------------------------------
  */

  const formDisabled =
    disabled ||
    submitting ||
    !encounterId;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <section className="clinical-workspace-section">

      <div className="section-heading">

        <div>

          <span className="eyebrow">
            DIAGNOSTIC SERVICES
          </span>

          <h2>
            Laboratory orders
          </h2>

          <p>
            Request laboratory investigations
            for the patient's active encounter.
          </p>

        </div>

        <div className="workspace-session-badge">

          <Beaker size={15} />

          {disabled
            ? "Encounter completed"
            : "Doctor → Laboratory"}

        </div>

      </div>

      {disabled && (
        <div className="clinical-warning">

          <ShieldCheck size={18} />

          <div>

            <strong>
              Laboratory ordering unavailable
            </strong>

            <span>
              This encounter has been
              completed. New laboratory
              requests cannot be added.
            </span>

          </div>

        </div>
      )}

      {!encounterId && !disabled && (
        <div className="clinical-warning">

          <ShieldCheck size={18} />

          <div>

            <strong>
              Laboratory ordering unavailable
            </strong>

            <span>
              An active clinical encounter is
              required before laboratory tests
              can be ordered.
            </span>

          </div>

        </div>
      )}

      <form
        className="clinical-assessment-form"
        onSubmit={handleSubmit}
      >

        {/* =================================================
            LABORATORY TESTS
        ================================================== */}

        <div className="clinical-field">

          <label>
            Laboratory tests
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
              marginTop: "8px",
            }}
          >

            {AVAILABLE_TESTS.map(
              (test) => {
                const selected =
                  selectedTests.includes(
                    test.name
                  );

                return (
                  <button
                    key={test.id}
                    type="button"
                    onClick={() =>
                      toggleTest(
                        test.name
                      )
                    }
                    disabled={
                      formDisabled
                    }
                    style={{
                      textAlign:
                        "left",
                      padding:
                        "16px",
                      borderRadius:
                        "12px",
                      border: selected
                        ? "2px solid #2563eb"
                        : "1px solid #dbe2ea",
                      background:
                        selected
                          ? "#eff6ff"
                          : "#ffffff",
                      cursor:
                        formDisabled
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        formDisabled
                          ? 0.65
                          : 1,
                    }}
                  >

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "10px",
                      }}
                    >

                      <input
                        type="checkbox"
                        checked={
                          selected
                        }
                        readOnly
                        disabled={
                          formDisabled
                        }
                      />

                      <strong>
                        {test.name}
                      </strong>

                    </div>

                    <small
                      style={{
                        display:
                          "block",
                        marginTop:
                          "8px",
                        color:
                          "#64748b",
                        lineHeight:
                          1.5,
                      }}
                    >
                      {
                        test.description
                      }
                    </small>

                  </button>
                );
              }
            )}

          </div>

          <small
            style={{
              display: "block",
              marginTop: "10px",
            }}
          >
            {selectedTests.length} test
            {selectedTests.length === 1
              ? ""
              : "s"} selected
          </small>

        </div>

        {/* =================================================
            CLINICAL INDICATION
        ================================================== */}

        <div className="clinical-field">

          <label htmlFor="clinicalIndication">
            Clinical indication
          </label>

          <textarea
            id="clinicalIndication"
            value={
              clinicalIndication
            }
            onChange={(event) =>
              setClinicalIndication(
                event.target.value
              )
            }
            placeholder="Why are these laboratory investigations being requested?"
            rows={4}
            disabled={
              formDisabled
            }
          />

        </div>

        {/* =================================================
            NOTES
        ================================================== */}

        <div className="clinical-field">

          <label htmlFor="laboratoryNotes">
            Additional laboratory notes
          </label>

          <textarea
            id="laboratoryNotes"
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value
              )
            }
            placeholder="Relevant clinical information for the laboratory team."
            rows={4}
            disabled={
              formDisabled
            }
          />

        </div>

        {/* =================================================
            SUCCESS
        ================================================== */}

        {successMessage && (
          <div className="clinical-success">

            <CheckCircle2 size={17} />

            <span>
              {successMessage}
            </span>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================== */}

        {errorMessage && (
          <div className="clinical-error">

            <ShieldCheck size={17} />

            <span>
              {errorMessage}
            </span>

          </div>
        )}

        {/* =================================================
            CREATED REQUEST
        ================================================== */}

        {request && (
          <div
            className="clinical-success"
            style={{
              alignItems:
                "flex-start",
            }}
          >

            <ClipboardList size={18} />

            <div>

              <strong>
                Laboratory request created
              </strong>

              <div>
                Request ID:{" "}
                {request.id.slice(
                  0,
                  8
                )}
                …
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

        {/* =================================================
            ACTIONS
        ================================================== */}

        <div className="clinical-form-actions">

          <div className="clinical-form-status">

            <Beaker size={16} />

            <span>
              {disabled
                ? "Encounter completed"
                : encounterId
                ? `Laboratory order for encounter ${encounterId.slice(
                    0,
                    8
                  )}…`
                : "No encounter"}
            </span>

          </div>

          <button
            type="submit"
            disabled={
              formDisabled ||
              selectedTests.length === 0
            }
          >

            {submitting ? (
              <>
                <LoaderCircle
                  size={17}
                  className="spin"
                />

                Sending to laboratory...
              </>
            ) : disabled ? (
              <>
                <ShieldCheck
                  size={17}
                />

                Encounter Completed
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