import { landingConfig } from "../../data/landing";

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-[72px] md:scroll-mt-[88px] py-16 md:py-24 bg-navy text-white">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/medcard-logo.svg"
                alt="MedCard"
                className="h-8 w-auto brightness-0 invert"
              />
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg leading-none">MedCard</span>
                <span className="text-teal text-xs">Technology Solutions</span>
              </div>
            </div>
            <p className="text-soft-text-on-navy">
              {landingConfig.slogan}
            </p>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Phone</h4>
              <a
                href={`tel:${landingConfig.contact.phone}`}
                className="text-soft-text-on-navy hover:text-white transition-colors"
              >
                {landingConfig.contact.phone}
              </a>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Location</h4>
              <p className="text-soft-text-on-navy">
                {landingConfig.contact.location}
              </p>
              <p className="text-soft-text-on-navy text-sm">
                {landingConfig.contact.district}
              </p>
            </div>

            {landingConfig.contact.email && (
              <div>
                <h4 className="font-semibold mb-4">Email</h4>
                <a
                  href={`mailto:${landingConfig.contact.email}`}
                  className="text-soft-text-on-navy hover:text-white transition-colors"
                >
                  {landingConfig.contact.email}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-soft-text-on-navy pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-soft-text-on-navy text-sm">
            2026 MedCard, Rwanda
          </p>
          <nav className="flex gap-6">
            {landingConfig.nav.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-soft-text-on-navy text-sm hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
