import { Cpu, Lightbulb, ShieldCheck, Users } from "lucide-react";
import { landingConfig } from "../../data/landing";

const iconMap = {
  Cpu,
  Lightbulb,
  ShieldCheck,
  Users,
};

export function WhyMedCard() {
  return (
    <section className="scroll-mt-[72px] md:scroll-mt-[88px] py-16 md:py-24 bg-section-tint">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20">
        <div className="text-center mb-12">
          <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-navy mb-4">
            Why MedCard
          </h2>
          <p className="text-body-text max-w-2xl mx-auto">
            What sets us apart
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {landingConfig.whyMedCard.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            return (
              <div key={item.title} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-pale-cyan rounded-full flex items-center justify-center">
                  {Icon && <Icon size={28} className="text-teal" />}
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-body-text">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
