"use client";

import { useState, useMemo, useRef } from "react";
import { QUANTITATIVE_ANALYTES, evaluate, type Analyte } from "./tea-data";

function formatPct(v: number): string { return (v * 100).toFixed(1) + "%"; }

interface Row { old: string; new: string; }
interface Result { idx: number; old: number; new: number; pctDiff: number; absDiff: number; pass: boolean; }

export default function Page() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Analyte | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [rows, setRows] = useState<Row[]>(Array(10).fill(null).map(() => ({ old: "", new: "" })));

  const filtered = useMemo(() => {
    if (!search) return QUANTITATIVE_ANALYTES;
    const s = search.toLowerCase();
    return QUANTITATIVE_ANALYTES.filter(a =>
      a.name.toLowerCase().includes(s) || a.instrument.toLowerCase().includes(s)
    );
  }, [search]);

  const results: Result[] = useMemo(() => {
    if (!selected) return [];
    return rows.map((r, i) => {
      const o = parseFloat(r.old);
      const n = parseFloat(r.new);
      if (isNaN(o) || isNaN(n)) return null;
      const pctDiff = o !== 0 ? Math.abs((n - o) / o) : 0;
      const absDiff = Math.abs(n - o);
      const pass = evaluate(o, n, selected);
      return { idx: i, old: o, new: n, pctDiff, absDiff, pass };
    }).filter((r): r is Result => r !== null);
  }, [rows, selected]);

  const summary = useMemo(() => {
    if (results.length === 0) return null;
    const passing = results.filter(r => r.pass).length;
    const failing = results.length - passing;
    const pctFail = failing / results.length;
    const overall = failing === 0 ? "PASS" : pctFail > 0.2 ? "FAIL" : "REVIEW";
    return { total: results.length, passing, failing, pctFail, overall };
  }, [results]);

  const selectAnalyte = (a: Analyte) => {
    setSelected(a);
    setSearch(a.name);
    setShowDropdown(false);
  };

  const clearAll = () => {
    setSelected(null);
    setSearch("");
    setRows(Array(10).fill(null).map(() => ({ old: "", new: "" })));
  };

  const updateRow = (i: number, field: "old" | "new", val: string) => {
    setRows(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: val };
      return copy;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-[860px] mx-auto px-4 py-6 font-mono text-[13px] text-zinc-900">

        <div className="flex items-baseline justify-between border-b-[3px] border-zinc-900 pb-2 mb-5">
          <div>
            <h1 className="text-lg font-bold tracking-wider uppercase m-0">Lot Change Verifier</h1>
            <p className="text-[11px] text-zinc-500 tracking-wide m-0">SAMC Clinical Chemistry — TEa v3.2 · CLIA 2024</p>
          </div>
          <button onClick={clearAll} className="bg-zinc-900 text-white border-none px-4 py-1.5 text-[11px] tracking-wider uppercase cursor-pointer hover:bg-zinc-700 transition-colors">
            Clear
          </button>
        </div>

        <div className="relative mb-4">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowDropdown(true); setSelected(null); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Type analyte name..."
            className={`w-full px-3 py-2.5 text-sm border-2 border-zinc-900 outline-none font-mono ${selected ? "bg-green-50" : "bg-amber-50"}`}
          />
          {showDropdown && !selected && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 max-h-60 overflow-y-auto bg-white border-2 border-zinc-900 border-t-0 z-10 shadow-lg">
              {filtered.slice(0, 30).map(a => (
                <div key={a.name} onMouseDown={() => selectAnalyte(a)}
                  className="flex justify-between px-3 py-2 cursor-pointer border-b border-zinc-100 hover:bg-blue-50 transition-colors">
                  <span className="font-semibold">{a.name}</span>
                  <span className="text-zinc-400 text-[11px]">{a.instrument}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="grid grid-cols-4 gap-px bg-zinc-900 mb-5 text-[13px]">
            {([
              ["TEa %", selected.teaPct ? formatPct(selected.teaPct) : "—"],
              ["TEa Fixed", selected.teaFixed ? `±${selected.teaFixed} ${selected.fixedUnits}` : "—"],
              ["Criterion", selected.criterion],
              ["Instrument", selected.instrument],
            ] as const).map(([label, val]) => (
              <div key={label} className="bg-zinc-50 px-3 py-2">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{label}</div>
                <div className="font-semibold mt-0.5">{val}</div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <>
            <div className="grid gap-px bg-zinc-900" style={{ gridTemplateColumns: "32px 1fr 1fr 80px 80px 72px" }}>
              {["#", `Old (${selected.units})`, `New (${selected.units})`, "% Diff", "Abs Diff", "Result"].map(h => (
                <div key={h} className="bg-zinc-900 text-white px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold">{h}</div>
              ))}
              {rows.map((r, i) => {
                const res = results.find(x => x.idx === i);
                return (
                  <div key={i} className="contents">
                    <div className="bg-zinc-100 px-2 py-1.5 flex items-center text-zinc-400">{i + 1}</div>
                    <div className="bg-white">
                      <input value={r.old} onChange={e => updateRow(i, "old", e.target.value)}
                        className="w-full px-2 py-1.5 border-none text-[13px] font-mono bg-transparent outline-none focus:bg-amber-50 transition-colors"
                        tabIndex={i * 2 + 1} inputMode="decimal" />
                    </div>
                    <div className="bg-white">
                      <input value={r.new} onChange={e => updateRow(i, "new", e.target.value)}
                        className="w-full px-2 py-1.5 border-none text-[13px] font-mono bg-transparent outline-none focus:bg-amber-50 transition-colors"
                        tabIndex={i * 2 + 2} inputMode="decimal" />
                    </div>
                    <div className="bg-zinc-50 px-2 py-1.5 text-right tabular-nums">
                      {res ? (res.pctDiff * 100).toFixed(1) + "%" : ""}
                    </div>
                    <div className="bg-zinc-50 px-2 py-1.5 text-right tabular-nums">
                      {res ? res.absDiff.toFixed(2) : ""}
                    </div>
                    <div className={`px-2 py-1.5 text-center font-bold text-[12px] ${
                      res ? (res.pass ? "bg-emerald-600 text-white" : "bg-red-600 text-white") : "bg-zinc-50"
                    }`}>
                      {res ? (res.pass ? "PASS" : "FAIL") : ""}
                    </div>
                  </div>
                );
              })}
            </div>

            {summary && (
              <div className={`mt-4 flex items-center gap-3 px-4 py-3 text-white ${
                summary.overall === "PASS" ? "bg-emerald-600" :
                summary.overall === "FAIL" ? "bg-red-600" : "bg-amber-600"
              }`}>
                <span className="text-xl font-extrabold tracking-widest">{summary.overall}</span>
                <span className="text-[12px] opacity-90">
                  {summary.passing}/{summary.total} pass · {summary.failing} exceed TEa · {(summary.pctFail * 100).toFixed(0)}% fail rate
                </span>
              </div>
            )}
          </>
        )}

        {!selected && (
          <div className="text-center py-16 text-zinc-400 text-[12px]">
            Select an analyte to begin verification
          </div>
        )}

        <div className="mt-8 pt-3 border-t border-zinc-200 text-[10px] text-zinc-400 text-center">
          SAMC Lab Operations · TEa Reference Database v3.2 · CLIA 2024 (42 CFR §493) · For internal use only
        </div>
      </div>
    </div>
  );
}
