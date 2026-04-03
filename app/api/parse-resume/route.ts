import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse/lib/pdf-parse.js";

function extractSection(text: string, headers: string[]): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let inSection = false;
  const stopHeaders = [
    "experience", "education", "skills", "work history", "employment",
    "publications", "certifications", "awards", "projects", "summary",
    "objective", "references", "languages", "volunteer", "interests",
  ];

  const norm = (s: string) => s.toLowerCase().trim();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNorm = norm(line);

    // Check if this line IS one of our target headers
    const isTarget = headers.some((h) => lineNorm.includes(h));
    // Check if this is a DIFFERENT known section header (stop collecting)
    const isOtherSection =
      !isTarget &&
      stopHeaders.some(
        (h) =>
          lineNorm === h ||
          lineNorm.startsWith(h + " ") ||
          lineNorm.startsWith(h + ":")
      ) &&
      line.length < 60;

    if (isTarget && !inSection) {
      inSection = true;
      continue;
    }

    if (inSection) {
      if (isOtherSection) break;
      if (line.trim()) result.push(line.trim());
    }
  }

  return result.slice(0, 60).join("\n");
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]{3,}/g, "  ")
    .replace(/\n{4,}/g, "\n\n")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let rawText = "";

    if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
      const data = await pdf(buffer);
      rawText = data.text;
    } else {
      rawText = buffer.toString("utf-8");
    }

    rawText = cleanText(rawText);

    const education = extractSection(rawText, [
      "education", "academic background", "academic history", "degrees",
    ]);

    const experience = extractSection(rawText, [
      "experience", "work experience", "work history", "employment history",
      "professional experience", "career history",
    ]);

    const skills = extractSection(rawText, [
      "skills", "technical skills", "core competencies", "technologies",
      "tools", "expertise", "competencies",
    ]);

    return NextResponse.json({
      education: education || "",
      experience: experience || "",
      skills: skills || "",
      raw_length: rawText.length,
    });
  } catch (err) {
    console.error("parse-resume error:", err);
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
  }
}
