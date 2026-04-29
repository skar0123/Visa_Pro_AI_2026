"use client";

import LandingNavbar from "@/components/LandingNavbar";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";

const Divider = () => (
  <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.12), transparent)", margin: "0 48px" }} />
);

export default function LandingPage() {
  return (
    <main style={{ backgroundColor: "#03050f", color: "#fff", overflowX: "hidden" }}>
      <LandingNavbar />
      <Hero />
      <Divider />
      <Products />
      <Divider />
      <Pricing />
      <Divider />
      <Contact />
    </main>
  );
}
