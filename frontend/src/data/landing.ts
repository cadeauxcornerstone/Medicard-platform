export const landingConfig = {
  slogan: "Technology Connecting People and Possibilities",
  
  contact: {
    phone: "0790 280 727",
    email: "",
    location: "Kigali, Rwanda",
    district: "Remera",
  },
  
  nav: {
    links: [
      { label: "About", href: "#about" },
      { label: "Services", href: "#services" },
      { label: "Patient Vault", href: "/patient-vault" },
      { label: "Contact", href: "#contact" },
    ],
    cta: {
      label: "Explore Services",
      href: "#services",
    },
  },
  
  hero: {
    eyebrow: "Technology company in Kigali, Rwanda",
    headline: "Technology connecting people and possibilities.",
    description: "MedCard builds NFC, manufacturing and data solutions that connect people, information and services across healthcare, education and business.",
    primaryCta: {
      label: "Explore Services",
      href: "#services",
    },
    secondaryCta: {
      label: "Patient Vault",
      href: "/patient-vault",
    },
  },
  
  solutions: {
    prefix: "Solutions for",
    items: [
      { label: "Healthcare" },
      { label: "Education" },
      { label: "Business" },
      { label: "Dentistry" },
    ],
  },
  
  about: {
    eyebrow: "About MedCard",
    headlinePart1: "One company.",
    headlinePart2: "Many ways to connect.",
    description: "MedCard is a technology company. We design and deliver solutions that connect people, information and services, from healthcare identity to education, business and precision manufacturing.",
  },
  
  services: {
    eyebrow: "Our services",
    headline: "Two ways we put technology to work.",
    nfc: {
      label: "Service 01",
      title: "NFC Technology",
      description: "Near field communication for healthcare, education, business and other industries.",
      pills: [
        { label: "Healthcare" },
        { label: "Education" },
        { label: "Business" },
        { label: "And more" },
      ],
      cta: {
        label: "Explore NFC Technology",
        href: "/nfc",
      },
    },
    manufacturing: {
      label: "Service 02",
      title: "Manufacturing Technology",
      description: "Precision technology for production, starting with dental solutions.",
      pills: [
        { label: "Dentistry" },
      ],
      cta: {
        label: "Coming soon",
        href: "",
        disabled: true,
      },
    },
  },
  
  patientVault: {
    eyebrow: "Patient Vault",
    headlinePart1: "Your health information,",
    headlinePart2: "safe and always within reach.",
    steps: [
      {
        number: "1",
        title: "Create your account",
        description: "Sign up in a few minutes.",
      },
      {
        number: "2",
        title: "Store your information",
        description: "Keep your records in one private place.",
      },
      {
        number: "3",
        title: "Access it anytime",
        description: "View your data and manage your plan.",
      },
    ],
    pricing: [
      {
        name: "Basic Vault",
        subtitle: "For essential record retrieval",
        price: "100",
        period: "RWF /mo",
        description: null,
        features: [
          { text: "Secure Patient Vault", active: true },
          { text: "Unlimited basic clinical records", active: true },
          { text: "Instant NFC data retrieval", active: true },
          { text: "Document uploads (Scans, PDFs, X-rays)", active: false },
          { text: "Multi-Sector Linkage (Healthcare, Education, Business)", active: false },
        ],
        featured: false,
      },
      {
        name: "Premium Vault",
        subtitle: "For complete data storage and linkage",
        price: "150",
        period: "RWF /mo",
        description: null,
        features: [
          { text: "Includes everything in Basic", active: true },
          { text: "Unlimited document uploads (Scans, PDFs, X-rays)", active: true },
          { text: "Multi-Sector Linkage (Healthcare, Education, Business)", active: true },
          { text: "Priority data backup & recovery", active: true },
          { text: "Family profile sharing", active: true },
        ],
        featured: true,
      },
    ],
  },
  
  whyMedCard: [
    {
      icon: "Cpu",
      title: "Technology",
      description: "NFC and manufacturing technology under one roof.",
    },
    {
      icon: "Lightbulb",
      title: "Innovation",
      description: "Practical solutions designed around real needs.",
    },
    {
      icon: "ShieldCheck",
      title: "Security",
      description: "Your information is handled with care and kept private.",
    },
    {
      icon: "Users",
      title: "Accessibility",
      description: "Simple to use, affordable and available across Rwanda.",
    },
  ],
  
  faq: [
    {
      question: "Is my personal data secure in the Patient Vault?",
      answer: "Yes, completely. MedCard utilizes end-to-end encryption to ensure your medical and personal data is visible only to you and authorized personnel. Our system is built strictly in compliance with Rwanda's Law on Personal Data Protection and Privacy, ensuring your records are kept private, confidential, and safe from unauthorized access.",
    },
    {
      question: "Can anyone read my medical file if I lose my physical MedCard?",
      answer: "No. The physical MedCard acts as a secure key, but it does not display or store open medical files directly on the card itself. If someone finds your card, they cannot access your Patient Vault without your biometric verification or authorized PIN confirmation at a partner clinic system. If you lose your card, you can instantly freeze it by calling our support line.",
    },
    {
      question: "How do I pay for my Patient Vault subscription?",
      answer: "Payment is completely digital and hassle-free. We integrate directly with MTN Mobile Money (MoMo) and Airtel Money. When choosing your plan (Basic or Premium), you will receive a prompt on your phone to securely authorize the monthly billing transaction.",
    },
    {
      question: "Can I cancel or change my subscription tier at any time?",
      answer: "Yes, absolutely. There are no long-term contracts. You can upgrade from Basic to Premium, downgrade, or cancel your subscription at any moment directly through your online account portal without any hidden fees.",
    },
    {
      question: "What happens to my uploaded documents if I downgrade to the Basic plan?",
      answer: "If you downgrade from Premium to Basic, your previously uploaded documents (such as PDFs, X-rays, and lab reports) will be securely archived and hidden, as Basic only supports text-based clinical record data retrieval. They will not be deleted, and you can re-access them instantly by upgrading back to Premium.",
    },
    {
      question: "Do I need a physical card to use the Patient Vault service?",
      answer: "No, you can sign up and manage your text-based records entirely online via our portal. However, having a physical MedCard allows you to use our instant NFC Tap feature at participating healthcare providers, schools, or businesses to verify your identity in seconds.",
    },
    {
      question: "How does MedCard tie into precision dental manufacturing?",
      answer: "MedCard is a comprehensive technology provider. While the Patient Vault stores consumer data, our manufacturing division builds advanced technology solutions for clinics—starting with digital dentistry design, 3D printing, and precise dental restoration fabrication.",
    },
  ],
};
