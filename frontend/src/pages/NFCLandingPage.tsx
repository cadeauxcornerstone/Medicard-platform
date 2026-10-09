import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, ArrowRight, Wifi, ShieldCheck, FileText, WalletCards, Activity, HeartPulse, FlaskConical, Stethoscope, CreditCard } from "lucide-react";

export default function NFCLandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const goToFacilityPortal = () => {
    navigate("/facility-login");
  };

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 h-[72px] md:h-[88px] bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20 h-full">
          <div className="flex items-center justify-between h-full">
            <a href="/" className="flex items-center gap-3">
              <img
                src="/medcard-logo.svg"
                alt="MedCard"
                className="h-8 w-auto"
              />
              <div className="flex flex-col">
                <span className="text-navy font-bold text-lg leading-none">MedCard</span>
                <span className="text-xs text-body-text">Technology Solutions</span>
              </div>
            </a>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#problem" className="text-base font-semibold text-body-text hover:text-teal transition-colors">
                Problem
              </a>
              <a href="#solution" className="text-base font-semibold text-body-text hover:text-teal transition-colors">
                Solution
              </a>
              <a href="#services" className="text-base font-semibold text-body-text hover:text-teal transition-colors">
                Services
              </a>
              <a href="#payment" className="text-base font-semibold text-body-text hover:text-teal transition-colors">
                Payments
              </a>
              <a
                href="#patients"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/patients");
                }}
                className="text-base font-semibold text-body-text hover:text-teal transition-colors"
              >
                Patient Registry
              </a>
              <a href="#contact" className="text-base font-semibold text-body-text hover:text-teal transition-colors">
                Contact
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center px-4 py-2 text-base font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors"
              >
                Live Dashboard
              </button>
              <button
                type="button"
                onClick={goToFacilityPortal}
                className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors"
              >
                Facility Portal
                <ArrowRight size={18} className="ml-2" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-body-text hover:text-teal focus:outline-none focus:ring-2 focus:ring-teal rounded"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-white">
            <nav className="px-5 py-6 space-y-4">
              <a href="#problem" onClick={() => setMenuOpen(false)} className="block py-3 text-base font-semibold text-body-text hover:text-teal">
                Problem
              </a>
              <a href="#solution" onClick={() => setMenuOpen(false)} className="block py-3 text-base font-semibold text-body-text hover:text-teal">
                Solution
              </a>
              <a href="#services" onClick={() => setMenuOpen(false)} className="block py-3 text-base font-semibold text-body-text hover:text-teal">
                Services
              </a>
              <a href="#payment" onClick={() => setMenuOpen(false)} className="block py-3 text-base font-semibold text-body-text hover:text-teal">
                Payments
              </a>
              <a href="#contact" onClick={() => setMenuOpen(false)} className="block py-3 text-base font-semibold text-body-text hover:text-teal">
                Contact
              </a>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/login");
                }}
                className="w-full py-3 text-base font-semibold text-navy border-2 border-navy rounded-full"
              >
                Live Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  goToFacilityPortal();
                }}
                className="w-full py-3 text-base font-semibold text-navy border-2 border-navy rounded-full"
              >
                Authorized Facility Login
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="pt-[72px] md:pt-[88px]">
        <section className="relative overflow-x-clip bg-section-tint py-12 md:py-16 lg:py-20">
          <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20">
            <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12 items-center">
              <div className="space-y-8 order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-pale-cyan rounded-full">
                  <div className="w-2 h-2 rounded-full bg-teal" />
                  <span className="text-sm font-semibold text-teal">
                    RWANDA DIGITAL HEALTH INFRASTRUCTURE
                  </span>
                </div>
                <h1 className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold text-navy leading-[1.1] font-sans">
                  One patient.
                  <br />
                  One identity.
                  <br />
                  <span className="text-teal italic font-serif">
                    Every facility.
                  </span>
                </h1>
                <p className="text-[clamp(1.125rem,2vw,1.25rem)] text-body-text max-w-[34rem]">
                  MedCard connects patient identity, medical records and healthcare payments into one secure experience across participating facilities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="inline-flex items-center justify-center h-14 px-6 text-base font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors"
                  >
                    Launch Interactive Demo
                    <ArrowRight size={18} className="ml-2" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="inline-flex items-center justify-center h-14 px-6 text-base font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors"
                  >
                    <Wifi size={18} className="mr-2" />
                    Scan MedCard
                  </button>
                  <button
                    type="button"
                    onClick={goToFacilityPortal}
                    className="inline-flex items-center justify-center h-14 px-6 text-base font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors"
                  >
                    Facility Login
                  </button>
                </div>
                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center gap-2 text-body-text">
                    <ShieldCheck size={18} className="text-teal" />
                    <span className="text-sm">Secure identity</span>
                  </div>
                  <div className="flex items-center gap-2 text-body-text">
                    <FileText size={18} className="text-teal" />
                    <span className="text-sm">Connected records</span>
                  </div>
                  <div className="flex items-center gap-2 text-body-text">
                    <WalletCards size={18} className="text-teal" />
                    <span className="text-sm">Digital payments</span>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2 flex justify-center">
                <div className="relative w-[300px] md:w-[460px] h-[190px] md:h-[290px] rounded-[28px] shadow-card bg-white">
                  <div className="absolute inset-0 rounded-[28px] overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[35%] bg-mist" />
                    <svg
                      className="absolute bottom-0 left-0 right-0 h-[65%]"
                      viewBox="0 0 460 188"
                      preserveAspectRatio="none"
                    >
                      <path d="M0 188 L0 120 Q115 80 230 120 Q345 160 460 120 L460 188 Z" fill="#A7D5E6" />
                      <path d="M0 188 L0 100 Q115 60 230 100 Q345 140 460 100 L460 188 Z" fill="#2A7AA5" />
                      <path d="M0 188 L0 80 Q115 40 230 80 Q345 120 460 80 L460 188 Z" fill="#003F66" />
                    </svg>
                  </div>

                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="w-8 h-8">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15 8H9L12 2Z" fill="#003F66" />
                        <path d="M12 22L9 16H15L12 22Z" fill="#00A3B8" />
                        <path d="M2 12L8 9V15L2 12Z" fill="#003F66" />
                        <path d="M22 12L16 15V9L22 12Z" fill="#00A3B8" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-navy font-bold text-sm leading-none">MedCard</span>
                      <span className="text-teal text-xs">Technology Solutions</span>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 w-10 h-8 bg-chip-gold rounded-[18px]" />

                  <div className="absolute bottom-8 left-4">
                    <div className="text-navy font-bold text-sm">MC •••• ••••</div>
                  </div>

                  <div className="absolute bottom-8 right-4 flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-6 h-6 border-2 border-white rounded-full opacity-60" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="problem" className="py-16 md:py-24 bg-white">
          <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20">
            <div className="mb-12">
              <p className="text-sm font-semibold text-teal mb-4">THE PROBLEM</p>
              <div className="grid md:grid-cols-2 gap-12">
                <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-navy">
                  Healthcare information should follow the patient.
                </h2>
                <div className="space-y-4 text-body-text">
                  <p>
                    Patients often move between hospitals, clinics, laboratories and pharmacies without one connected identity.
                  </p>
                  <p>
                    This can lead to repeated paperwork, fragmented medical history, repeated tests and unnecessary costs.
                  </p>
                  <p>
                    Payment can be fragmented too, requiring patients to navigate separate processes for consultation, laboratory services, pharmacy and other care.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-section-tint rounded-2xl">
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center mb-4">
                  <FileText size={24} className="text-teal" />
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">Fragmented records</h3>
                <p className="text-body-text text-sm">
                  Patient information can remain separated across different facilities and systems.
                </p>
              </div>

              <div className="p-6 bg-section-tint rounded-2xl">
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center mb-4">
                  <FlaskConical size={24} className="text-teal" />
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">Repeated services</h3>
                <p className="text-body-text text-sm">
                  Missing history can contribute to unnecessary repetition of tests and procedures.
                </p>
              </div>

              <div className="p-6 bg-section-tint rounded-2xl">
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center mb-4">
                  <CreditCard size={24} className="text-teal" />
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">Fragmented payment</h3>
                <p className="text-body-text text-sm">
                  Healthcare payments can involve multiple disconnected steps.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="solution" className="py-16 md:py-24 bg-section-tint">
          <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20">
            <div className="mb-12">
              <p className="text-sm font-semibold text-teal mb-4">THE SOLUTION</p>
              <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-navy mb-4">
                One MedCard connects the healthcare journey.
              </h2>
              <p className="text-body-text max-w-2xl">
                A smart patient identity that helps participating facilities access the right information and enables a simpler payment experience.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-pale-cyan rounded-full flex items-center justify-center">
                  <Activity size={32} className="text-teal" />
                </div>
                <div className="text-3xl font-bold text-teal mb-2">01</div>
                <h3 className="text-lg font-bold text-navy mb-2">Identify</h3>
                <p className="text-body-text text-sm">
                  Patient identity is securely established using the MedCard.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-pale-cyan rounded-full flex items-center justify-center">
                  <FileText size={32} className="text-teal" />
                </div>
                <div className="text-3xl font-bold text-teal mb-2">02</div>
                <h3 className="text-lg font-bold text-navy mb-2">Connect</h3>
                <p className="text-body-text text-sm">
                  Authorized facility workflows connect patient information.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-pale-cyan rounded-full flex items-center justify-center">
                  <WalletCards size={32} className="text-teal" />
                </div>
                <div className="text-3xl font-bold text-teal mb-2">03</div>
                <h3 className="text-lg font-bold text-navy mb-2">Pay</h3>
                <p className="text-body-text text-sm">
                  Eligible healthcare charges can be settled through a digital wallet.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="py-16 md:py-24 bg-white">
          <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20">
            <div className="mb-12">
              <p className="text-sm font-semibold text-teal mb-4">PLATFORM</p>
              <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-navy mb-4">
                Built around the healthcare journey.
              </h2>
              <p className="text-body-text max-w-2xl">
                MedCard brings key healthcare interactions into one connected platform.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 border border-border rounded-2xl hover:border-teal transition-colors">
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center mb-4">
                  <HeartPulse size={24} className="text-teal" />
                </div>
                <span className="text-sm font-semibold text-teal mb-2">01</span>
                <h3 className="text-lg font-bold text-navy mb-2">Patient Identity</h3>
                <p className="text-body-text text-sm">
                  A single digital identity helps facilities identify patients consistently.
                </p>
              </div>

              <div className="p-6 border border-border rounded-2xl hover:border-teal transition-colors">
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center mb-4">
                  <FileText size={24} className="text-teal" />
                </div>
                <span className="text-sm font-semibold text-teal mb-2">02</span>
                <h3 className="text-lg font-bold text-navy mb-2">Medical Records</h3>
                <p className="text-body-text text-sm">
                  Access relevant patient information through authorized clinical workflows.
                </p>
              </div>

              <div className="p-6 border border-border rounded-2xl hover:border-teal transition-colors">
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center mb-4">
                  <FlaskConical size={24} className="text-teal" />
                </div>
                <span className="text-sm font-semibold text-teal mb-2">03</span>
                <h3 className="text-lg font-bold text-navy mb-2">Laboratory</h3>
                <p className="text-body-text text-sm">
                  Laboratory requests and results become part of the connected patient journey.
                </p>
              </div>

              <div className="p-6 border border-border rounded-2xl hover:border-teal transition-colors">
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center mb-4">
                  <Stethoscope size={24} className="text-teal" />
                </div>
                <span className="text-sm font-semibold text-teal mb-2">04</span>
                <h3 className="text-lg font-bold text-navy mb-2">Clinical Care</h3>
                <p className="text-body-text text-sm">
                  Support clinical teams with structured patient workflows.
                </p>
              </div>

              <div id="payment" className="p-6 border-2 border-teal rounded-2xl relative">
                <div className="absolute top-0 right-0 bg-teal text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  PAYMENT
                </div>
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center mb-4">
                  <WalletCards size={24} className="text-teal" />
                </div>
                <span className="text-sm font-semibold text-teal mb-2">05</span>
                <h3 className="text-lg font-bold text-navy mb-2">Healthcare Payments</h3>
                <p className="text-body-text text-sm">
                  A digital wallet helps patients manage eligible healthcare payments through MedCard.
                </p>
              </div>

              <div className="p-6 border border-border rounded-2xl hover:border-teal transition-colors">
                <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck size={24} className="text-teal" />
                </div>
                <span className="text-sm font-semibold text-teal mb-2">06</span>
                <h3 className="text-lg font-bold text-navy mb-2">Secure Access</h3>
                <p className="text-body-text text-sm">
                  Facility and staff workflows are designed around controlled access to healthcare information.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="payment" className="py-16 md:py-24 bg-navy text-white">
          <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-sm font-semibold text-accent-on-navy mb-4">A BETTER WAY TO PAY</p>
                <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold mb-4">
                  Healthcare payment should be part of the patient journey.
                </h2>
                <p className="text-soft-text-on-navy mb-8">
                  MedCard combines patient identity with a healthcare payment wallet, helping reduce disconnected payment processes between the patient and participating facilities.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-soft-text-on-navy">Pay eligible healthcare charges</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-soft-text-on-navy">Track payment transactions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-soft-text-on-navy">Simplify financial processes</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-8">
                <WalletCards size={48} className="text-teal mb-4" />
                <h3 className="text-xl font-bold mb-2">Digital Healthcare Wallet</h3>
                <p className="text-soft-text-on-navy text-sm">
                  Manage eligible healthcare payments securely through your MedCard digital wallet.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-16 md:py-24 bg-white">
          <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20 text-center">
            <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-navy mb-4">
              Ready to get started?
            </h2>
            <p className="text-body-text max-w-2xl mx-auto mb-8">
              Contact us to learn more about how MedCard can help your facility.
            </p>
            <button
              type="button"
              onClick={goToFacilityPortal}
              className="inline-flex items-center justify-center h-14 px-8 text-base font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors"
            >
              Contact Us
              <ArrowRight size={18} className="ml-2" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
