/* global React, ReactDOM, QUANTITATIVE_ANALYTES, evaluateLot, TWEAK_DEFAULTS */
const { useState, useMemo, useEffect, useRef, useCallback } = React;

const ANALYTES = QUANTITATIVE_ANALYTES;
const ROW_COUNT = 10;

// ===== utilities =====
function fmtPct(v, digits = 1) {
  if (v == null || !isFinite(v)) return "—";
  return (v * 100).toFixed(digits) + "%";
}
function fmtNum(v) {
  if (v == null || !isFinite(v)) return "—";
  // smart precision
  const abs = Math.abs(v);
  if (abs >= 100) return v.toFixed(1);
  if (abs >= 10)  return v.toFixed(2);
  if (abs >= 1)   return v.toFixed(2);
  return v.toFixed(3);
}
function highlightMatch(name, q) {
  if (!q) return name;
  const i = name.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return name;
  return (
    <>
      {name.slice(0, i)}
      <mark>{name.slice(i, i + q.length)}</mark>
      {name.slice(i + q.length)}
    </>
  );
}
function todayString() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" }).toUpperCase();
}

// Demo paired values that yield a realistic mix of pass/fail per analyte
function demoValuesFor(a) {
  // base middle-of-range value per analyte family
  const base = {
    "Glucose": 95, "Sodium": 138, "Potassium": 4.1, "Chloride": 102, "Calcium, Total": 9.4,
    "Albumin": 4.0, "Creatinine": 1.0, "BUN (Urea Nitrogen)": 14, "Cholesterol, Total": 180,
    "TSH (TSH3)": 2.1, "Hemoglobin A1c": 5.6, "Vitamin D, 25-OH": 32
  }[a.name] ?? (a.teaFixed ? Math.max(5, a.teaFixed * 8) : 50);

  // produce 8 paired values with a sprinkle of failures
  const seed = a.name.length * 7;
  const rng = (i) => {
    const x = Math.sin(seed + i * 13) * 10000;
    return x - Math.floor(x);
  };
  return Array(8).fill(null).map((_, i) => {
    const old = base * (1 + (rng(i) - 0.5) * 0.4);
    // ~15% of rows should fail
    const fail = rng(i + 100) < 0.18;
    const drift = fail
      ? ((a.teaPct ?? 0.15) * 1.4 + 0.02) * (rng(i + 50) > 0.5 ? 1 : -1)
      : ((a.teaPct ?? 0.15) * 0.5) * (rng(i + 50) - 0.5);
    const fresh = old * (1 + drift);
    return {
      old: round(old, a),
      new: round(fresh, a),
    };
  }).concat([{ old: "", new: "" }, { old: "", new: "" }]);
}
function round(v, a) {
  const abs = Math.abs(v);
  let d = 1;
  if (abs < 1) d = 3;
  else if (abs < 10) d = 2;
  else if (abs < 100) d = 1;
  else d = 0;
  // bump precision for units that need it
  if (["mmol/L", "ng/dL", "ng/mL"].includes(a.units)) d = Math.max(d, 1);
  return v.toFixed(d);
}

// ===== App =====
function App() {
  // Tweaks (use the hook from tweaks-panel.jsx if present)
  const tweaks = (window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}]);
  const t = tweaks[0];
  const setTweak = tweaks[1];

  // Apply theme/density to body
  useEffect(() => {
    document.body.classList.remove("theme-paper", "theme-graphite", "theme-ink");
    document.body.classList.add("theme-" + (t.theme || "paper"));
    document.body.classList.remove("density-compact", "density-roomy", "density-comfortable");
    document.body.classList.add("density-" + (t.density || "comfortable"));
    document.documentElement.style.setProperty("--display", (t.displayFont || "Newsreader") === "Newsreader"
      ? `"Newsreader", ui-serif, Georgia, serif`
      : `"Inter Tight", ui-sans-serif, system-ui, sans-serif`);
  }, [t.theme, t.density, t.displayFont]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [rows, setRows] = useState(() => Array(ROW_COUNT).fill(null).map(() => ({ old: "", new: "" })));
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Honor fillDemo tweak
  useEffect(() => {
    if (t.fillDemo && selected) {
      const demo = demoValuesFor(selected);
      setRows(demo.slice(0, ROW_COUNT).map(r => ({ old: String(r.old), new: String(r.new) })));
    }
  }, [t.fillDemo, selected]);

  const filtered = useMemo(() => {
    const list = ANALYTES;
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(a =>
      a.name.toLowerCase().includes(s) ||
      a.instrument.toLowerCase().includes(s) ||
      a.specimen.toLowerCase().includes(s)
    );
  }, [search]);

  // Group filtered by instrument
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach(a => {
      const k = a.instrument;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(a);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const results = useMemo(() => {
    if (!selected) return [];
    return rows.map((r, i) => {
      const o = parseFloat(r.old);
      const n = parseFloat(r.new);
      if (isNaN(o) || isNaN(n)) return null;
      const pctDiff = o !== 0 ? Math.abs((n - o) / o) : (n === 0 ? 0 : 1);
      const absDiff = Math.abs(n - o);
      const pass = evaluateLot(o, n, selected);
      return { idx: i, old: o, new: n, pctDiff, absDiff, pass };
    });
  }, [rows, selected]);

  const summary = useMemo(() => {
    const valid = results.filter(Boolean);
    if (valid.length === 0) return null;
    const passing = valid.filter(r => r.pass).length;
    const failing = valid.length - passing;
    const pctFail = failing / valid.length;
    const overall = failing === 0 ? "PASS" : pctFail > 0.2 ? "FAIL" : "REVIEW";
    // worst drift
    let worst = 0;
    valid.forEach(r => { if (r.pctDiff > worst) worst = r.pctDiff; });
    return { total: valid.length, passing, failing, pctFail, overall, worst };
  }, [results]);

  const selectAnalyte = useCallback((a) => {
    setSelected(a);
    setSearch(a.name);
    setOpen(false);
  }, []);

  const clearAll = () => {
    setSelected(null);
    setSearch("");
    setRows(Array(ROW_COUNT).fill(null).map(() => ({ old: "", new: "" })));
    inputRef.current?.focus();
  };

  const updateRow = (i, field, val) => {
    setRows(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: val };
      return copy;
    });
  };

  // Flatten filtered list for keyboard nav
  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  // Keyboard nav in dropdown
  const onKey = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") { setOpen(true); return; }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(flat.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (flat[activeIdx]) selectAnalyte(flat[activeIdx]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  useEffect(() => { setActiveIdx(0); }, [search]);

  // ⌘K to focus search
  useEffect(() => {
    const onDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onDown);
    return () => window.removeEventListener("keydown", onDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (!dropdownRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // ===== render =====
  return (
    <div className="page">
      <Masthead />
      <Strip onClear={clearAll} hasData={selected != null} />

      <Picker
        ref={inputRef}
        dropdownRef={dropdownRef}
        search={search}
        setSearch={(v) => { setSearch(v); setSelected(null); setOpen(true); }}
        selected={selected}
        open={open}
        setOpen={setOpen}
        onKey={onKey}
        grouped={grouped}
        flat={flat}
        activeIdx={activeIdx}
        setActiveIdx={setActiveIdx}
        selectAnalyte={selectAnalyte}
        onClearSelection={() => { setSelected(null); setSearch(""); setOpen(true); inputRef.current?.focus(); }}
      />

      {selected ? (
        <>
          <AnalyteCard analyte={selected} />

          <SectionHeader num="03" title="Paired Values" helper={
            <>Enter <kbd>old</kbd> and <kbd>new</kbd> lot results. Press <kbd>Tab</kbd> to advance.</>
          } />

          <DataTable rows={rows} results={results} analyte={selected} updateRow={updateRow} />

          <TableActions
            onDemo={() => {
              const demo = demoValuesFor(selected);
              setRows(demo.slice(0, ROW_COUNT).map(r => ({ old: String(r.old), new: String(r.new) })));
            }}
            onClear={() => setRows(Array(ROW_COUNT).fill(null).map(() => ({ old: "", new: "" })))}
            count={results.filter(Boolean).length}
          />

          {summary && <VerdictBanner summary={summary} analyte={selected} showSig={t.showSig} />}
        </>
      ) : (
        <EmptyState />
      )}

      <Colophon />

      {/* Tweaks panel */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection label="Theme">
            <window.TweakRadio
              label="Palette"
              value={t.theme}
              onChange={(v) => setTweak("theme", v)}
              options={["paper", "graphite", "ink"]}
            />
            <window.TweakRadio
              label="Display font"
              value={t.displayFont}
              onChange={(v) => setTweak("displayFont", v)}
              options={[
                { label: "Newsreader",  value: "Newsreader" },
                { label: "Inter Tight", value: "Inter Tight" },
              ]}
            />
          </window.TweakSection>

          <window.TweakSection label="Layout">
            <window.TweakRadio
              label="Density"
              value={t.density}
              onChange={(v) => setTweak("density", v)}
              options={["compact", "comfortable", "roomy"]}
            />
            <window.TweakToggle
              label="Signature line"
              value={t.showSig}
              onChange={(v) => setTweak("showSig", v)}
            />
          </window.TweakSection>

          <window.TweakSection label="Demo data">
            <window.TweakToggle
              label="Auto-fill on select"
              value={t.fillDemo}
              onChange={(v) => setTweak("fillDemo", v)}
            />
            <window.TweakButton
              label="Fill now"
              onClick={() => {
                if (selected) {
                  const demo = demoValuesFor(selected);
                  setRows(demo.slice(0, ROW_COUNT).map(r => ({ old: String(r.old), new: String(r.new) })));
                }
              }}
            />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
}

// ===== Sub-components =====
function Masthead() {
  return (
    <header className="masthead">
      <div className="seal" aria-hidden="true">L</div>
      <div className="wordmark">
        <div className="eyebrow">SAMC · Clinical Chemistry · QC</div>
        <h1>Lot Change <em>Verifier</em></h1>
      </div>
      <div className="meta">
        <div className="meta-item"><span>Standard</span><span>TEa v3.2</span></div>
        <div className="meta-item"><span>Regulation</span><span>CLIA 2024</span></div>
        <div className="meta-item"><span>Today</span><span>{todayString()}</span></div>
      </div>
    </header>
  );
}

function Strip({ onClear, hasData }) {
  return (
    <div className="strip">
      <div>
        <span className="dot" />
        System Online · TEa Reference Database Loaded · 94 Analytes
      </div>
      <button className="btn-clear" onClick={onClear} disabled={!hasData}>Clear Session</button>
    </div>
  );
}

function SectionHeader({ num, title, helper }) {
  return (
    <div className="step-header">
      <h2 className="h"><span className="num">{num}</span>{title}</h2>
      <div className="helper">{helper}</div>
    </div>
  );
}

const Picker = React.forwardRef(function Picker(props, ref) {
  const {
    dropdownRef, search, setSearch, selected, open, setOpen, onKey,
    grouped, flat, activeIdx, setActiveIdx, selectAnalyte, onClearSelection
  } = props;

  return (
    <section style={{ marginBottom: 8 }}>
      <SectionHeader
        num="01"
        title={selected ? "Selected Analyte" : "Choose an Analyte"}
        helper={<>Search by name, instrument, or specimen · <kbd>⌘K</kbd></>}
      />
      <div className="picker">
        <div className={"picker-field " + (selected ? "is-selected " : "") + (open ? "is-open" : "")}>
          <span className="pre">Analyte</span>
          <input
            ref={ref}
            value={search}
            placeholder="e.g. Glucose, Sodium, Hemoglobin A1c"
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            spellCheck={false}
            autoComplete="off"
          />
          {selected && (
            <button className="clear-x" onClick={onClearSelection} title="Clear selection">CHANGE</button>
          )}
        </div>
        {open && (
          <div className="dropdown" ref={dropdownRef}>
            {grouped.length === 0 && (
              <div className="dropdown-empty">No analytes match "{search}"</div>
            )}
            {grouped.map(([instrument, items]) => (
              <div key={instrument}>
                <div className="dropdown-group-label">{instrument} · {items.length}</div>
                {items.map((a) => {
                  const fIdx = flat.indexOf(a);
                  return (
                    <div
                      key={a.name}
                      className={"dropdown-row " + (fIdx === activeIdx ? "is-active" : "")}
                      onMouseDown={(e) => { e.preventDefault(); selectAnalyte(a); }}
                      onMouseEnter={() => setActiveIdx(fIdx)}
                    >
                      <div className="idx">{String(fIdx + 1).padStart(2, "0")}</div>
                      <div className="name">{highlightMatch(a.name, search)}</div>
                      <div className="crit">{a.criterion}</div>
                      <div className="inst">{a.specimen}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

function AnalyteCard({ analyte }) {
  const teaPct = analyte.teaPct;
  const teaFixed = analyte.teaFixed;
  const tolerance = teaPct != null && teaFixed != null
    ? <>±{(teaPct * 100).toFixed(1)}<span className="unit">%</span> <em>or</em> ±{teaFixed}<span className="unit">{analyte.fixedUnits}</span></>
    : teaPct != null
      ? <>±{(teaPct * 100).toFixed(1)}<span className="unit">%</span></>
      : teaFixed != null
        ? <>±{teaFixed}<span className="unit">{analyte.fixedUnits}</span></>
        : <>—</>;

  return (
    <>
      <SectionHeader num="02" title="Acceptance Criteria" helper={<>Per CLIA TEa Reference v3.2</>} />
      <div className="analyte-card">
        <div className="cell">
          <div className="cell-label">Analyte</div>
          <div className="cell-value">
            {analyte.name}
            <span className="sub">{analyte.specimen} · {analyte.instrument}</span>
          </div>
        </div>
        <div className="cell">
          <div className="cell-label">Total Allowable Error</div>
          <div className="cell-value">{tolerance}</div>
        </div>
        <div className="cell">
          <div className="cell-label">Decision Rule</div>
          <div className="cell-value">
            {analyte.criterion.split(" ")[0]}
            <span className="sub">{analyte.criterion}</span>
          </div>
        </div>
        <div className="cell">
          <div className="cell-label">QC Levels</div>
          <div className="cell-value">
            {analyte.qcLevels}
            <span className="sub">Reporting units: {analyte.units}</span>
          </div>
        </div>
      </div>
    </>
  );
}

function DataTable({ rows, results, analyte, updateRow }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 38 }}>#</th>
            <th className="num">Old lot<span className="u">{analyte.units}</span></th>
            <th className="num">New lot<span className="u">{analyte.units}</span></th>
            <th className="num">% Diff</th>
            <th className="num">Abs Diff</th>
            <th className="center" style={{ width: 96 }}>Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const res = results[i];
            const hasInput = r.old !== "" || r.new !== "";
            const pctOver = res && analyte.teaPct != null && res.pctDiff > analyte.teaPct;
            const absOver = res && analyte.teaFixed != null && res.absDiff > analyte.teaFixed;
            return (
              <tr key={i} className={hasInput ? "has-input" : ""}>
                <td className="idx-cell">{String(i + 1).padStart(2, "0")}</td>
                <td className="input-cell">
                  <input
                    className="cell-input"
                    value={r.old}
                    onChange={(e) => updateRow(i, "old", e.target.value)}
                    inputMode="decimal"
                    tabIndex={i * 2 + 1}
                    placeholder="—"
                  />
                </td>
                <td className="input-cell">
                  <input
                    className="cell-input"
                    value={r.new}
                    onChange={(e) => updateRow(i, "new", e.target.value)}
                    inputMode="decimal"
                    tabIndex={i * 2 + 2}
                    placeholder="—"
                  />
                </td>
                <td className={"diff-cell" + (pctOver ? " over" : "")}>
                  {res ? fmtPct(res.pctDiff) : ""}
                  {res && analyte.teaPct != null && (
                    <span className="compare">/ {fmtPct(analyte.teaPct, 0)}</span>
                  )}
                </td>
                <td className={"diff-cell" + (absOver ? " over" : "")}>
                  {res ? fmtNum(res.absDiff) : ""}
                  {res && analyte.teaFixed != null && (
                    <span className="compare">/ {analyte.teaFixed}</span>
                  )}
                </td>
                <td className={"verdict-cell " + (res ? (res.pass ? "pass" : "fail") : "")}>
                  {res ? (res.pass ? "Pass" : "Fail") : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TableActions({ onDemo, onClear, count }) {
  return (
    <div className="table-actions">
      <div className="grp">
        <span>{count} of {ROW_COUNT} rows entered</span>
      </div>
      <div className="grp">
        <button className="link-btn" onClick={onDemo}>Fill demo data</button>
        <button className="link-btn" onClick={onClear}>Clear rows</button>
        <button className="link-btn" onClick={() => window.print()}>Print / Export</button>
      </div>
    </div>
  );
}

function VerdictBanner({ summary, analyte, showSig }) {
  const word = summary.overall === "PASS" ? "Pass" : summary.overall === "FAIL" ? "Fail" : "Review";
  const cls = summary.overall === "PASS" ? "v-pass" : summary.overall === "FAIL" ? "v-fail" : "v-review";
  const subtitle = summary.overall === "PASS"
    ? "All paired values within TEa. Lot may be placed in service."
    : summary.overall === "FAIL"
      ? "Lot exceeds total allowable error. Do not place in service."
      : "Borderline — supervisor review required before release.";
  return (
    <div className={"verdict-banner " + cls} role="status" aria-live="polite">
      <div className="verdict-stamp">
        {word}.
        <span className="small">{subtitle}</span>
      </div>
      <div className="verdict-meta">
        <div>
          <div className="vm-label">Passing</div>
          <div className="vm-value">{summary.passing}<span className="frac">/{summary.total}</span></div>
        </div>
        <div>
          <div className="vm-label">Exceed TEa</div>
          <div className="vm-value">{summary.failing}</div>
        </div>
        <div>
          <div className="vm-label">Fail rate</div>
          <div className="vm-value">{fmtPct(summary.pctFail, 0)}</div>
        </div>
        <div>
          <div className="vm-label">Worst drift</div>
          <div className="vm-value">{fmtPct(summary.worst)}</div>
        </div>
      </div>
      {showSig && (
        <div className="verdict-sig">
          <div className="sig">&nbsp;</div>
          <div className="sig-label">Approved by</div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="es-mark">¶</div>
      <div className="es-title">Awaiting analyte selection</div>
      <div className="es-hint">Choose an analyte above to begin verification</div>
    </div>
  );
}

function Colophon() {
  return (
    <footer className="colophon">
      <div>SAMC Lab Operations</div>
      <div className="center accent">Reagent lot change verified against Total Allowable Error</div>
      <div className="right">42 CFR §493 · Internal use only</div>
    </footer>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
