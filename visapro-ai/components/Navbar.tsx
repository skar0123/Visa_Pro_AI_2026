"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

const NAV_LINKS = [
  { href: "/dashboard", label: "Analyze" },
  { href: "/history", label: "History" },
  { href: "/strategy", label: "Strategy" },
  { href: "/interview", label: "Interview" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        background: "linear-gradient(to bottom, rgba(3,5,15,0.97) 0%, rgba(3,5,15,0.85) 100%)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,212,255,0.08)",
      }}
    >
      <Link href="/" style={{ textDecoration: "none" }}>
        <Logo size={28} />
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                textDecoration: "none",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                padding: "6px 14px",
                borderRadius: 8,
                color: active ? "#00d4ff" : "rgba(148,163,184,0.8)",
                background: active ? "rgba(0,212,255,0.08)" : "transparent",
                border: active ? "1px solid rgba(0,212,255,0.2)" : "1px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
