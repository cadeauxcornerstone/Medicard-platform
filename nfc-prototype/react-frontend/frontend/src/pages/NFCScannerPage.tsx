import {
  ArrowLeft,
  CreditCard,
  Wifi,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function NFCScannerPage() {
  const navigate = useNavigate();

  return (
    <div className="nfc-page">
      <header className="nfc-page-header">
        <button
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          Back to dashboard
        </button>

        <div className="nfc-page-brand">
          <div className="brand-mark small">
            <CreditCard size={20} />
          </div>

          <div>
            <strong>
              Med<span>Card</span>
            </strong>
            <small>NFC Patient Identification</small>
          </div>
        </div>
      </header>

      <main className="nfc-scanner-content">
        <div className="nfc-scanner-header">
          <span className="eyebrow">PATIENT IDENTIFICATION</span>

          <h1>Scan MedCard</h1>

          <p>
            Use the connected NFC reader to identify a patient
            securely.
          </p>
        </div>

        <section className="scanner-card">
          <div className="scanner-visual">
            <div className="scanner-ring outer">
              <div className="scanner-ring middle">
                <div className="scanner-icon">
                  <Wifi size={42} />
                </div>
              </div>
            </div>
          </div>

          <div className="scanner-status">
            <span className="status-indicator" />

            <strong>Reader ready</strong>

            <span>Waiting for MedCard...</span>
          </div>

          <div className="scanner-instruction">
            <h2>Tap patient's card</h2>

            <p>
              Place the NFC-enabled MedCard directly on the
              connected reader and keep it there until the card
              is detected.
            </p>
          </div>

          <div className="security-message">
            <ShieldCheck size={17} />

            <span>
              Patient information is retrieved securely from the
              MedCard system after identification.
            </span>
          </div>
        </section>

        <div className="scanner-help">
          <div>
            <strong>Having trouble?</strong>

            <p>
              Make sure the NFC reader is connected to this
              workstation and ready to scan.
            </p>
          </div>

          <button type="button">Check reader</button>
        </div>
      </main>
    </div>
  );
}

export default NFCScannerPage;