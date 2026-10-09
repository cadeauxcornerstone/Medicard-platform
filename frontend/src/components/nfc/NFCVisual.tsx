export function NFCVisual() {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-auto" role="img" aria-label="NFC interaction demonstration">
      <defs>
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EAF7FB" />
          <stop offset="100%" stopColor="#A7D5E6" />
        </linearGradient>
        <linearGradient id="readerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#003F66" />
          <stop offset="100%" stopColor="#2A7AA5" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="400" height="300" fill="#F2FAFC" />

      <g transform="translate(60, 50)">
        <rect x="0" y="0" width="100" height="60" rx="8" fill="url(#readerGradient)" />
        <rect x="10" y="10" width="80" height="40" rx="4" fill="#1F4B66" opacity="0.3" />
        <circle cx="50" cy="30" r="12" fill="#00A3B8" filter="url(#glow)" />
        <circle cx="50" cy="30" r="6" fill="#FFFFFF" />
      </g>

      <g transform="translate(240, 100)">
        <rect x="0" y="0" width="140" height="90" rx="12" fill="url(#cardGradient)" stroke="#003F66" strokeWidth="2" />
        <rect x="10" y="10" width="30" height="20" rx="4" fill="#F7C443" />
        <text x="55" y="25" fontSize="12" fontWeight="bold" fill="#003F66">MedCard</text>
        <text x="10" y="55" fontSize="10" fill="#1F4B66">MC •••• ••••</text>
        <g transform="translate(110, 65)">
          <path d="M0 0 Q10 -5 20 0" stroke="#00A3B8" strokeWidth="2" fill="none" />
          <path d="M5 5 Q15 0 25 5" stroke="#00A3B8" strokeWidth="2" fill="none" />
          <path d="M10 10 Q20 5 30 10" stroke="#00A3B8" strokeWidth="2" fill="none" />
        </g>
      </g>

      <g transform="translate(200, 80)">
        <circle cx="0" cy="0" r="25" fill="none" stroke="#00A3B8" strokeWidth="2" opacity="0.3">
          <animate attributeName="r" values="25;35;25" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="0" cy="0" r="35" fill="none" stroke="#00A3B8" strokeWidth="2" opacity="0.2">
          <animate attributeName="r" values="35;45;35" dur="2s" repeatCount="indefinite" begin="0.5s" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" begin="0.5s" />
        </circle>
      </g>

      <path d="M170 110 L190 95" stroke="#00A3B8" strokeWidth="3" strokeDasharray="6 4" opacity="0.6">
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1s" repeatCount="indefinite" />
      </path>

      <g transform="translate(80, 180)">
        <circle cx="120" cy="10" r="6" fill="#00A3B8" opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="cx" values="0;240" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </g>

      <text x="200" y="240" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#003F66">
        Tap to Connect
      </text>
      <text x="200" y="260" textAnchor="middle" fontSize="11" fill="#4A6A7D">
        Hold MedCard near the reader
      </text>
    </svg>
  );
}
