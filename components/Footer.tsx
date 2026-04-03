export default function Footer() {
  return (
    <footer
      style={{
        width: "100%",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "#03050f",
        padding: "20px 24px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: 12,
          color: "rgba(100,116,139,0.7)",
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        © 2026 NeuralOps AI. All rights reserved.
      </p>
      <p
        style={{
          fontSize: 11,
          color: "rgba(100,116,139,0.45)",
          margin: "3px 0 0",
        }}
      >
        VisaPro AI is a product of NeuralOps AI.
      </p>
    </footer>
  );
}
