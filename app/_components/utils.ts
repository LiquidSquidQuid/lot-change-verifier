import type { Analyte } from "../tea-data";
import type React from "react";
import { createElement } from "react";

export function fmtPct(v: number | null | undefined, digits = 1): string {
  if (v == null || !isFinite(v)) return "—";
  return (v * 100).toFixed(digits) + "%";
}

export function fmtNum(v: number | null | undefined): string {
  if (v == null || !isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 100) return v.toFixed(1);
  if (abs >= 10) return v.toFixed(2);
  if (abs >= 1) return v.toFixed(2);
  return v.toFixed(3);
}

export function highlightMatch(
  name: string,
  query: string
): React.ReactNode {
  if (!query) return name;
  const i = name.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return name;
  return createElement(
    "span",
    null,
    name.slice(0, i),
    createElement("mark", null, name.slice(i, i + query.length)),
    name.slice(i + query.length)
  );
}

export function todayString(): string {
  return new Date()
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}

function round(v: number, a: Analyte): string {
  const abs = Math.abs(v);
  let d = 1;
  if (abs < 1) d = 3;
  else if (abs < 10) d = 2;
  else if (abs < 100) d = 1;
  else d = 0;
  if (["mmol/L", "ng/dL", "ng/mL"].includes(a.units)) d = Math.max(d, 1);
  return v.toFixed(d);
}

export function demoValuesFor(
  a: Analyte
): { old: string; new: string }[] {
  const baseMap: Record<string, number> = {
    Glucose: 95,
    Sodium: 138,
    Potassium: 4.1,
    Chloride: 102,
    "Calcium, Total": 9.4,
    Albumin: 4.0,
    Creatinine: 1.0,
    "BUN (Urea Nitrogen)": 14,
    "Cholesterol, Total": 180,
    "TSH (TSH3)": 2.1,
    "Hemoglobin A1c": 5.6,
    "Vitamin D, 25-OH": 32,
  };
  const base =
    baseMap[a.name] ?? (a.teaFixed ? Math.max(5, a.teaFixed * 8) : 50);

  const seed = a.name.length * 7;
  const rng = (i: number) => {
    const x = Math.sin(seed + i * 13) * 10000;
    return x - Math.floor(x);
  };

  return Array(8)
    .fill(null)
    .map((_, i) => {
      const old = base * (1 + (rng(i) - 0.5) * 0.4);
      const fail = rng(i + 100) < 0.18;
      const drift = fail
        ? ((a.teaPct ?? 0.15) * 1.4 + 0.02) * (rng(i + 50) > 0.5 ? 1 : -1)
        : (a.teaPct ?? 0.15) * 0.5 * (rng(i + 50) - 0.5);
      const fresh = old * (1 + drift);
      return { old: round(old, a), new: round(fresh, a) };
    })
    .concat([
      { old: "", new: "" },
      { old: "", new: "" },
    ]);
}
