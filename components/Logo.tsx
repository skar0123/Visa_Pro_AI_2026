interface LogoProps {
  size?: number;
  showText?: boolean;
}

export default function Logo({ size = 32, showText = true }: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Icon mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0055ee" />
            <stop offset="100%" stopColor="#00d4ff" />
          </linearGradient>
          <linearGradient id="glowGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0066ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Outer rounded square (visa stamp shape) */}
        <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#glowGrad)" stroke="url(#logoGrad)" strokeWidth="1.5" />

        {/* Globe circles (visa theme) */}
        <circle cx="20" cy="20" r="11" stroke="url(#logoGrad)" strokeWidth="1.2" fill="none" opacity="0.5" />
        <ellipse cx="20" cy="20" rx="6" ry="11" stroke="url(#logoGrad)" strokeWidth="1" fill="none" opacity="0.4" />
        <line x1="9" y1="20" x2="31" y2="20" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.4" />
        <line x1="11.5" y1="14" x2="28.5" y2="14" stroke="url(#logoGrad)" strokeWidth="0.8" opacity="0.3" />
        <line x1="11.5" y1="26" x2="28.5" y2="26" stroke="url(#logoGrad)" strokeWidth="0.8" opacity="0.3" />

        {/* Neural nodes */}
        <circle cx="20" cy="20" r="2.5" fill="url(#logoGrad)" />
        <circle cx="20" cy="9" r="1.5" fill="#00d4ff" opacity="0.9" />
        <circle cx="20" cy="31" r="1.5" fill="#00d4ff" opacity="0.9" />
        <circle cx="9" cy="20" r="1.5" fill="#0066ff" opacity="0.9" />
        <circle cx="31" cy="20" r="1.5" fill="#0066ff" opacity="0.9" />

        {/* Glow center dot */}
        <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.9" />
      </svg>

      {showText && (
        <span
          style={{
            fontWeight: 700,
            fontSize: size * 0.53,
            color: "#ffffff",
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          Visapro{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #0099ff, #00d4ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AI
          </span>
        </span>
      )}
    </div>
  );
}
