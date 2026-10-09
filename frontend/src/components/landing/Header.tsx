import { useState } from "react";
import { Menu, X } from "lucide-react";
import { landingConfig } from "../../data/landing";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
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
            {landingConfig.nav.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-base font-semibold text-body-text hover:text-teal transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 rounded"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center">
            <a
              href={landingConfig.nav.cta.href}
              className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
            >
              {landingConfig.nav.cta.label}
            </a>
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
            {landingConfig.nav.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-base font-semibold text-body-text hover:text-teal"
              >
                {link.label}
              </a>
            ))}
            <a
              href={landingConfig.nav.cta.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-base font-semibold text-navy"
            >
              {landingConfig.nav.cta.label}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
