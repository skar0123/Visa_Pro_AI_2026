import LandingNavbar from "@/components/LandingNavbar";
import Pricing from "@/components/Pricing";

export const metadata = {
  title: "Pricing — VisaPro AI",
  description: "Choose a plan to access VisaPro AI visa evaluation.",
};

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#03050f" }}>
      <LandingNavbar />
      <div style={{ paddingTop: 80 }}>
        <div style={{ textAlign: "center", padding: "48px 24px 0" }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#00d4ff",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Access Required
          </p>
          <h1
            style={{
              fontSize: "clamp(24px, 4vw, 40px)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              marginBottom: 12,
            }}
          >
            Select Your Plan to Continue
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "rgba(100,116,139,0.8)",
              maxWidth: 440,
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            Choose a plan below to access your VisaPro AI analysis dashboard.
          </p>
        </div>
        <Pricing />
      </div>
    </div>
  );
}
