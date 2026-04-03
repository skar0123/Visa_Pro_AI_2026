"use client";

import LandingNavbar from "@/components/LandingNavbar";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import Contact from "@/components/Contact";

export default function LandingPage() {
  return (
    <main style={{ backgroundColor: "#03050f", color: "#fff", overflowX: "hidden" }}>
      <LandingNavbar />
      <Hero />

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.12), transparent)", margin: "0 48px" }} />

      <Products />

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.12), transparent)", margin: "0 48px" }} />

      <Contact />
    </main>
  );
}
