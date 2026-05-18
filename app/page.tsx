"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { QUANTITATIVE_ANALYTES, evaluate, type Analyte } from "./tea-data";
import { Masthead } from "./_components/Masthead";
import { Strip } from "./_components/Strip";
import { Picker } from "./_components/Picker";
import { AnalyteCard } from "./_components/AnalyteCard";
import { SectionHeader } from "./_components/SectionHeader";
import { DataTable } from "./_components/DataTable";
import { TableActions } from "./_components/TableActions";
import { VerdictBanner } from "./_components/VerdictBanner";
import { EmptyState } from "./_components/EmptyState";
import { Colophon } from "./_components/Colophon";
import { TweaksPanel } from "./_components/TweaksPanel";
import { demoValuesFor } from "./_components/utils";
import type { Row, Result } from "./_components/types";

const ROW_COUNT = 10;
const EMPTY_ROWS = () =>
  Array(ROW_COUNT)
    .fill(null)
    .map(() => ({ old: "", new: "" }));

export default function Page() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Analyte | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [rows, setRows] = useState<Row[]>(EMPTY_ROWS);

  // Tweaks
  const [theme, setTheme] = useState("paper");
  const [density, setDensity] = useState("comfortable");
  const [showSig, setShowSig] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load persisted tweaks
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lcv-tweaks");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.density) setDensity(parsed.density);
        if (parsed.showSig !== undefined) setShowSig(parsed.showSig);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist tweaks
  useEffect(() => {
    localStorage.setItem(
      "lcv-tweaks",
      JSON.stringify({ theme, density, showSig })
    );
  }, [theme, density, showSig]);

  // Apply theme/density to body
  useEffect(() => {
    document.body.classList.remove(
      "theme-paper",
      "theme-graphite",
      "theme-ink"
    );
    document.body.classList.add(`theme-${theme}`);
    document.body.classList.remove(
      "density-compact",
      "density-comfortable",
      "density-roomy"
    );
    document.body.classList.add(`density-${density}`);
  }, [theme, density]);

  // Derived: filtered analytes
  const filtered = useMemo(() => {
    if (!search) return QUANTITATIVE_ANALYTES;
    const s = search.toLowerCase();
    return QUANTITATIVE_ANALYTES.filter(
      (a) =>
        a.name.toLowerCase().includes(s) ||
        a.instrument.toLowerCase().includes(s) ||
        a.specimen.toLowerCase().includes(s)
    );
  }, [search]);

  // Derived: grouped by instrument
  const grouped = useMemo(() => {
    const map = new Map<string, Analyte[]>();
    filtered.forEach((a) => {
      const k = a.instrument;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(a);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Derived: flat list for keyboard nav
  const flat = useMemo(
    () => grouped.flatMap(([, items]) => items),
    [grouped]
  );

  // Derived: results (preserves null for positional indexing)
  const results = useMemo((): (Result | null)[] => {
    if (!selected) return [];
    return rows.map((r, i) => {
      const o = parseFloat(r.old);
      const n = parseFloat(r.new);
      if (isNaN(o) || isNaN(n)) return null;
      const pctDiff =
        o !== 0 ? Math.abs((n - o) / o) : n === 0 ? 0 : 1;
      const absDiff = Math.abs(n - o);
      const pass = evaluate(o, n, selected);
      return { idx: i, old: o, new: n, pctDiff, absDiff, pass };
    });
  }, [rows, selected]);

  // Derived: summary with worst drift
  const summary = useMemo(() => {
    const valid = results.filter((r): r is Result => r !== null);
    if (valid.length === 0) return null;
    const passing = valid.filter((r) => r.pass).length;
    const failing = valid.length - passing;
    const pctFail = failing / valid.length;
    const overall: "PASS" | "FAIL" | "REVIEW" =
      failing === 0 ? "PASS" : pctFail > 0.2 ? "FAIL" : "REVIEW";
    let worst = 0;
    valid.forEach((r) => {
      if (r.pctDiff > worst) worst = r.pctDiff;
    });
    return { total: valid.length, passing, failing, pctFail, overall, worst };
  }, [results]);

  // Actions
  const selectAnalyte = useCallback((a: Analyte) => {
    setSelected(a);
    setSearch(a.name);
    setOpen(false);
  }, []);

  const clearAll = () => {
    setSelected(null);
    setSearch("");
    setRows(EMPTY_ROWS());
    inputRef.current?.focus();
  };

  const updateRow = (i: number, field: "old" | "new", val: string) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: val };
      return copy;
    });
  };

  const onDemo = () => {
    if (selected) {
      const demo = demoValuesFor(selected);
      setRows(
        demo
          .slice(0, ROW_COUNT)
          .map((r) => ({ old: String(r.old), new: String(r.new) }))
      );
    }
  };

  const onClearRows = () => setRows(EMPTY_ROWS());

  // Keyboard nav for picker
  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          setOpen(true);
          return;
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flat[activeIdx]) selectAnalyte(flat[activeIdx]);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [open, flat, activeIdx, selectAnalyte]
  );

  // Reset activeIdx on search change
  useEffect(() => {
    setActiveIdx(0);
  }, [search]);

  // ⌘K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        !dropdownRef.current?.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="page">
      <Masthead />
      <Strip onClear={clearAll} hasData={selected != null} />

      <Picker
        ref={inputRef}
        dropdownRef={dropdownRef}
        search={search}
        setSearch={(v) => {
          setSearch(v);
          setSelected(null);
          setOpen(true);
        }}
        selected={selected}
        open={open}
        setOpen={setOpen}
        onKey={onKey}
        grouped={grouped}
        flat={flat}
        activeIdx={activeIdx}
        setActiveIdx={setActiveIdx}
        selectAnalyte={selectAnalyte}
        onClearSelection={() => {
          setSelected(null);
          setSearch("");
          setOpen(true);
          inputRef.current?.focus();
        }}
      />

      {selected ? (
        <>
          <AnalyteCard analyte={selected} />

          <SectionHeader
            num="03"
            title="Paired Values"
            helper={
              <>
                Enter <kbd>old</kbd> and <kbd>new</kbd> lot results. Press{" "}
                <kbd>Tab</kbd> to advance.
              </>
            }
          />

          <DataTable
            rows={rows}
            results={results}
            analyte={selected}
            updateRow={updateRow}
          />

          <TableActions
            onDemo={onDemo}
            onClear={onClearRows}
            count={results.filter(Boolean).length}
          />

          {summary && (
            <VerdictBanner
              key={`${summary.overall}-${summary.total}`}
              summary={summary}
              showSig={showSig}
            />
          )}
        </>
      ) : (
        <EmptyState />
      )}

      <Colophon />

      <TweaksPanel
        theme={theme}
        density={density}
        showSig={showSig}
        onThemeChange={setTheme}
        onDensityChange={setDensity}
        onShowSigChange={setShowSig}
      />
    </div>
  );
}
