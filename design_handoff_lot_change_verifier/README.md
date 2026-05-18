# Handoff — Lot Change Verifier (Scientific Editorial redesign)

## Overview

A complete visual & UX redesign of the **SAMC Clinical Chemistry — Lot Change Verifier**, a single-page tool used by lab techs to compare paired QC values between an old and new reagent lot and decide whether the lot may be placed in service (based on CLIA Total Allowable Error tolerances).

The redesign moves the tool from a generic Tailwind monospace look to a deliberate **scientific-editorial** system: paper-warm canvas, deep ink type, a serif display moment, monospaced tabular data, and verdicts that read like printed lab reports.

## About the Design Files

The files in `design/` are **design references created in HTML/React** — a prototype that demonstrates intended look, layout, type, color, interactions, and states.

**They are not production code.** They are not wired into the existing Next.js codebase, do not use the existing module system, and do not export to PDF or persist anywhere. The task is to **recreate this design inside the existing Next.js codebase** at `lot-change-verifier/`, replacing the current `app/page.tsx` with a faithful implementation that uses the codebase's existing conventions (Next.js App Router, Tailwind via `globals.css`, TypeScript, the same `tea-data.ts` and `evaluate()` function).

## Fidelity

**High-fidelity (hifi).** The mockup is final in terms of:
- Color palette (3 themes: Paper, Graphite, Ink)
- Typography (Newsreader serif + Inter Tight + JetBrains Mono)
- Spacing, rules, and grid structure
- Interaction details (analyte picker, keyboard nav, verdict animation)
- Empty state, dropdown, table, and verdict-banner micro-design

Recreate it pixel-faithfully. Don't substitute a different design system or font stack.

---

## Screens / Views

This is a **single-screen app**. All states live on one page. Listed below are the regions of that page in document order.

### 1. Masthead

**Purpose:** Establish provenance — this is an internal SAMC clinical tool.

**Layout:** Three columns aligned to baseline.
- Left: 56×56 px circular "seal" mark (1.5px ink border, inner 1px ring at 35% opacity, single italic Newsreader letter "L" centered).
- Center: eyebrow line + display title.
- Right: meta strip (3 labeled values).

**Components:**
- **Eyebrow** — `JetBrains Mono`, 10px, uppercase, letter-spacing 0.22em, color `--ink-3`. Text: `SAMC · Clinical Chemistry · QC`.
- **Title** — `Newsreader` 500, 44px, letter-spacing -0.022em, line-height 0.95. Text: `Lot Change Verifier` where "Verifier" is italic + weight 400 + `--ink-2`.
- **Meta items** — 3 stacked label/value pairs in `JetBrains Mono`, label 9.5px (--ink-4), value 11px 500 (--ink). Items: `Standard / TEa v3.2`, `Regulation / CLIA 2024`, `Today / <today>`.
- **Bottom rule** — double rule: 1px solid `--ink` border-bottom + a second 1px line via `::after` 5px below. This is the editorial signature of the design — preserve it.

### 2. Status strip

**Layout:** Flex row, space-between, 10px top / 28px bottom padding.

- **Left** — green dot (6×6 circle, `--pass`, 3px `--pass-soft` halo) + `System Online · TEa Reference Database Loaded · 94 Analytes` in JetBrains Mono 10.5px uppercase 0.18em tracking.
- **Right** — `Clear Session` button: 1px ink border, transparent fill, JetBrains Mono 10.5px uppercase, 7px×14px padding. Hover: inverts to ink-fill / paper-text.

### 3. Section header (reusable)

Used for `01 Choose an Analyte`, `02 Acceptance Criteria`, `03 Paired Values`.

**Layout:** Grid, two columns: title left, helper text right, baseline-aligned, 14px bottom margin.

- **Title** — Newsreader 500, 22px, letter-spacing -0.012em. The numeric prefix (e.g. `01`) is JetBrains Mono 11px, 0.14em tracking, color `--ink-3`, vertically offset +4px from baseline.
- **Helper** — JetBrains Mono 10.5px uppercase 0.14em, `--ink-4`. May contain `<kbd>` chips: JetBrains Mono 10px, `--paper-2` bg, 1px `--rule` border, 3px radius, 1px×5px padding.

### 4. Analyte picker (command-palette)

**Purpose:** Find and select one of 94 quantitative analytes by name, instrument, or specimen.

**Field (closed state):**
- Background `--paper-2`, 1px `--rule` border.
- 22px vertical / 60px left padding.
- `pre` label — JetBrains Mono 11px uppercase "Analyte" with a 8×1px ink rule after it, absolute-positioned at left 22px, vertically centered.
- Input — Newsreader 500, 26px, letter-spacing -0.012em. Placeholder: italic 400, `--ink-4`. No border, no outline.
- Right side: when an analyte is selected, a `CHANGE` link button (JetBrains Mono 11px, `--ink-3`).

**Field (selected state):** background switches to `--paper`, border to `--ink`.

**Field (open state):** border `--ink`, border-bottom transparent (continuous with dropdown).

**Dropdown:**
- Absolute, full width of the field, border 1px `--ink` (no top), `--paper` bg, max-height 360px, scrollable.
- 160ms `drop` animation on open (translateY -4px → 0, opacity 0 → 1).
- **Group label** — JetBrains Mono 10px uppercase 0.18em, `--ink-4`, 14/22/6/22px padding, `--paper-2` bg, 1px `--rule-soft` top border (except first). Format: `<instrument> · <count>`.
- **Row** — grid `32px 1fr auto auto`, 12/22px padding, gap 16, 1px `--rule-soft` top border.
  - Index (`01`, `02`...) — JetBrains Mono 10px, `--ink-4`.
  - Name — Newsreader 500, 16px. The active query substring is wrapped in `<mark>`: transparent bg, 1.5px `--accent` underline.
  - Criterion (e.g. `% only`) — JetBrains Mono 10px uppercase 0.1em, `--ink-3`.
  - Specimen (e.g. `Serum`) — JetBrains Mono 10px uppercase 0.1em, `--ink-4`.
  - Hover/active: `--paper-2` bg.
- **Empty** — `No analytes match "<query>"` in JetBrains Mono 11px uppercase, 40px×22px padding, `--ink-3`.

**Keyboard:**
- `⌘K` / `Ctrl-K` from anywhere → focus + select the input and open the dropdown.
- `↑` / `↓` move active row. `Enter` selects. `Esc` closes.

### 5. Acceptance Criteria card

**Purpose:** Show the rules that the entered values will be judged against, once an analyte is selected.

**Layout:** 4-column grid, 1px `--ink` outer border, internal 1px `--rule` column separators. Each cell 18×20px padding.

Cells:
1. **Analyte** — label `Analyte`, value = analyte name in Newsreader 500 22px, then a `--ink-3` sub-line `<specimen> · <instrument>` in JetBrains Mono 10.5px uppercase 0.08em.
2. **Total Allowable Error** — `±X.X%` and/or `±N <units>`. The `%` and unit are JetBrains Mono 13px `--ink-3`. The word `or` between them is Newsreader italic 400, `--ink-2`.
3. **Decision Rule** — first word of criterion (e.g. `%`) as the big value, full criterion (`% or Fixed (greater)`) as the sub line.
4. **QC Levels** — integer 2 or 3 as the big value, sub: `Reporting units: <units>`.

Responsive: at <900px, collapses to 2 columns with row borders.

### 6. Data table

**Purpose:** Enter 10 paired old/new values; compute differences and pass/fail per row.

**Table styling:**
- Outer border 1px `--ink`, `--paper` background.
- **Header row** — `--ink` bg, `--paper` text, JetBrains Mono 9.5px uppercase 0.2em, 500 weight, 11px×14px padding, 1px `--ink-2` column separators. Right-aligned for numeric columns. Units (e.g. `mg/dL`) inline as a `--ink-4` 400 weight span with 6px left margin.

**Body row (44px tall in comfortable density):**
- `#` cell — 38px wide, centered, JetBrains Mono 11px `--ink-4`, padded index `01`–`10`. When the row has any input, the cell background switches to `--paper-2`.
- Old/New input cells — full-width transparent input, JetBrains Mono 14px, right-aligned, tabular-nums, 12px×14px padding. Placeholder `—` in `--ink-4` 300. **Focus** state: bg `#FAF6E8` (subtle ledger highlight) + 1.5px inset `--ink` ring. Tab order: row1.old → row1.new → row2.old → row2.new → ...
- % Diff cell — right-aligned, JetBrains Mono 12.5px `--ink-2`, tabular-nums. Format: `12.3%` with a 10px `--ink-4` `/ 15%` suffix showing the tolerance. When the row's % diff exceeds `analyte.teaPct`, text becomes `--fail`.
- Abs Diff cell — same styling. Suffix `/ <teaFixed>` when applicable.
- Result cell — 96px wide, JetBrains Mono 10.5px uppercase 0.18em 600. Pass: `--pass` text on `--pass-soft` bg with a 6px `--pass` dot before the word. Fail: `--fail` on `--fail-soft` with a `--fail` dot. Empty state: blank cell.

**Density variants** — see Tweaks section. Compact = 36px row, 13px input. Roomy = 52px row, 15px input.

### 7. Table actions

**Layout:** Flex row below the table, 14px top padding.

- Left: `<N> of 10 rows entered` in JetBrains Mono 10.5px uppercase 0.14em, `--ink-3`.
- Right: three link buttons (`Fill demo data`, `Clear rows`, `Print / Export`) styled as JetBrains Mono 10.5px uppercase with a 1px `--rule` bottom border that becomes `--ink` on hover, color `--ink-2` → `--ink`.

### 8. Verdict banner

**Purpose:** The hero result — a stamped lab-report-style verdict.

**Layout:** 1.5px `--ink` border, 28×32px padding, three columns: stamp / meta tiles / signature.

- **Signal bar** — absolute 6px stripe down the left edge, color = `--pass` / `--fail` / `--review`.
- **Stamp** — Newsreader italic 500, 64px, letter-spacing -0.04em. Word + period (`Pass.` / `Fail.` / `Review.`) colored to match. Below the stamp, a `--ink-3` sub-line in JetBrains Mono 10px uppercase 0.22em explains the verdict (see copy below).
- **Meta tiles** — 4-column grid: `Passing`, `Exceed TEa`, `Fail rate`, `Worst drift`. Labels JetBrains Mono 9.5px uppercase 0.18em `--ink-3`. Values Newsreader 500 28px tabular-nums. The "passing" tile renders as `<n><span class=frac>/<total></span>` where the fraction is JetBrains Mono 14px 400 `--ink-3` with 4px left margin.
- **Signature** — right-justified column with an empty `--ink-3` 1px underline (room for a handwritten signature) and an `Approved by` label below in JetBrains Mono 9.5px uppercase 0.18em. Toggleable via Tweaks.

**Stamp animation:** 360ms cubic-bezier(.2,.7,.2,1) translateY(6px → 0) + opacity 0 → 1 on first appearance. Same animation for meta values.

**Verdict logic:**
- All rows pass → `PASS`. Copy: `All paired values within TEa. Lot may be placed in service.`
- Fail rate > 20% → `FAIL`. Copy: `Lot exceeds total allowable error. Do not place in service.`
- Any fail at or below 20% → `REVIEW`. Copy: `Borderline — supervisor review required before release.`

### 9. Empty state

When no analyte is selected, instead of the cards/table show:
- 1px dashed `--rule` border, `--paper-2` bg, 80×40px padding, centered.
- A Newsreader italic 56px `¶` glyph in `--ink-3`.
- Title `Awaiting analyte selection` (Newsreader 500 22px `--ink-2`).
- Hint `Choose an analyte above to begin verification` (JetBrains Mono 11px uppercase 0.12em `--ink-4`).

### 10. Colophon

Footer with 1px `--ink` double rule (same pattern as the masthead), 72px top margin, 22px top padding.

3-column grid:
- Left: `SAMC Lab Operations`
- Center: italic Newsreader 12px `--ink-2` — `Reagent lot change verified against Total Allowable Error`
- Right: `42 CFR §493 · Internal use only`

All in JetBrains Mono 10px uppercase 0.18em `--ink-3` (except the italic center).

---

## Interactions & Behavior

### Picker
- Typing filters the list by name / instrument / specimen (case-insensitive substring).
- Dropdown groups results by instrument (`DxC 700 AU`, `DxI 800`, `Variant`, etc.) with a counted label per group.
- The query substring inside a name is underlined via `<mark>`.
- Active row tracked via `activeIdx`; mouse hover and keyboard nav both update it.
- Clicking a row (or pressing Enter on active row) selects the analyte, fills the input with the name, closes the dropdown.
- Selecting an analyte resets nothing — the table keeps any entered values.

### Table
- Each row computes `pctDiff = |new - old| / old` and `absDiff = |new - old|` when both fields parse as numbers.
- `evaluate(old, new, analyte)` (already in `app/tea-data.ts`) returns the pass/fail boolean per the criterion type. Use this function as-is.
- Rows with only one of (old, new) entered show nothing in the diff/result cells but still highlight the `#` cell.
- Demo button generates plausible values for the selected analyte that produce ~80–85% pass rate (see `demoValuesFor()` in `app.jsx` for the seeded RNG approach — feel free to replace with a simpler approach in production).

### Verdict
- Recomputes whenever the rows or analyte change, fades in via the `stamp` keyframe.
- Hidden until at least one valid pair is entered.

### Clear Session
- Resets analyte selection, search query, and all 10 rows.
- Returns focus to the picker input.

### Print
- The "Print / Export" link triggers `window.print()`. No special print stylesheet is shipped — feel free to add one (treat the page exactly as the document it visually mimics).

---

## State Management

```ts
search:    string                       // picker query text
selected:  Analyte | null               // chosen analyte
open:      boolean                      // dropdown open
activeIdx: number                       // keyboard cursor index in flattened list
rows:      Array<{ old: string; new: string }>  // length 10
```

Derived (memo):
- `filtered` — `ANALYTES` filtered by `search`
- `grouped` — `filtered` keyed by `instrument`
- `flat` — `grouped` flattened back to a linear array (for keyboard nav)
- `results` — per-row computed `{ old, new, pctDiff, absDiff, pass }` or `null`
- `summary` — `{ total, passing, failing, pctFail, overall, worst }` or `null`

No data fetching. Everything is local. The tea reference data ships as a static array in `app/tea-data.ts` (already in the repo).

---

## Design Tokens

All defined as CSS custom properties in `LotVerifier.html` `<style>`. Reproduce these in `globals.css` (or a `tokens.css` import).

### Paper theme (default)
```css
--paper:       #F6F2E8;
--paper-2:     #EFEADC;
--paper-3:     #E6E0CE;
--ink:         #16140F;
--ink-2:       #3B3830;
--ink-3:       #6A665B;
--ink-4:       #9C9789;
--rule:        #D9D3C0;
--rule-soft:   #E8E3D2;
--pass:        #2B5C3C;
--pass-soft:   #DDE5D2;
--fail:        #8E2A1F;
--fail-soft:   #ECD6CE;
--review:      #8A5A0E;
--review-soft: #F0DFB6;
--accent:      #1E3A8A;
--accent-soft: #D9E1F4;
```

### Graphite theme
```css
--paper:      #F1F1EF;
--paper-2:    #E8E8E5;
--paper-3:    #DDDDD9;
--ink:        #16161A;
--ink-2:      #2F3035;
--ink-3:      #65676E;
--ink-4:      #9A9BA2;
--rule:       #D1D1CE;
--rule-soft:  #E1E1DE;
--pass:       #1F5538;
--pass-soft:  #D3E0D6;
--fail:       #862317;
--fail-soft:  #E8D2CD;
```

### Ink theme (dark)
```css
--paper:      #0E0E11;
--paper-2:    #16161A;
--paper-3:    #1E1E22;
--ink:        #ECE6D2;
--ink-2:      #C7C2B0;
--ink-3:      #8A8675;
--ink-4:      #5B584F;
--rule:       #2A2A2E;
--rule-soft:  #1F1F23;
--pass:       #6FA67A;
--pass-soft:  #1F2A22;
--fail:       #D87767;
--fail-soft:  #2A1D1A;
--review:     #D6A14F;
--review-soft:#2A2218;
--accent:     #8FA9E0;
--accent-soft:#1A1F2E;
```

### Typography
```css
--display: "Newsreader",   ui-serif, Georgia, serif;
--sans:    "Inter Tight",  ui-sans-serif, system-ui, sans-serif;
--mono:    "JetBrains Mono", ui-monospace, Menlo, monospace;
```

Load via Google Fonts (already in the prototype `<head>`):
```
https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap
```

In Next.js, prefer `next/font/google` for performance.

### Spacing & rhythm
- Page max-width: **1240px**, padding `56px 64px 120px` (desktop), `32px 24px 80px` (≤900px).
- Section header → content gap: **14px**.
- Card / table → next section gap: **44px**.
- Verdict top margin: **42px**.
- Colophon top margin: **72px**.

### Borders / radii
- All structural borders **1px** solid (header & verdict use **1.5px**).
- **No border radius anywhere.** This is intentional — the editorial paper feel relies on hard corners.
- Seal mark is the only circular element (50%).
- `<kbd>` chips use a 3px radius.

### Shadows
- One shared paper shadow on the dropdown:
  `0 1px 0 rgba(22,20,15,0.04), 0 12px 32px -16px rgba(22,20,15,0.18)`
- Nothing else has a shadow.

### Motion
- `drop` — 160ms ease, translateY(-4 → 0), opacity 0 → 1. Applied to the dropdown panel.
- `stamp` — 360ms `cubic-bezier(.2, .7, .2, 1)`, translateY(6 → 0), opacity 0 → 1. Applied to the verdict stamp and meta values.
- Both wrapped in `@media (prefers-reduced-motion: no-preference)`.

---

## Tweaks (optional in production)

The prototype exposes a Tweaks panel. These are nice-to-have settings; ship whichever feel appropriate:
- **Palette:** Paper / Graphite / Ink (recommend keeping all three; persist via `localStorage`).
- **Display font:** Newsreader / Inter Tight (recommend Newsreader as default).
- **Density:** Compact / Comfortable / Roomy (Comfortable default).
- **Signature line:** show/hide approver signature in verdict.

---

## Assets

- **No image assets.** The seal mark is a CSS-drawn circle with a typographic glyph.
- **Fonts:** Newsreader, Inter Tight, JetBrains Mono — all from Google Fonts.
- **Data:** `app/tea-data.ts` is already in the codebase. Do not modify; the prototype uses it verbatim (re-exported as `QUANTITATIVE_ANALYTES` and `evaluate()`).

---

## Files (in `design/`)

- `LotVerifier.html` — entry point. Contains all CSS tokens + structural styles, font imports, and the React mount. **Source of truth for visual design.**
- `app.jsx` — React component tree. **Source of truth for component structure, state, and interactions.** Re-implement these components in TypeScript inside the Next.js codebase. Names map cleanly: `App`, `Masthead`, `Strip`, `SectionHeader`, `Picker`, `AnalyteCard`, `DataTable`, `TableActions`, `VerdictBanner`, `EmptyState`, `Colophon`.
- `data.js` — runtime data shim used by the prototype. **Ignore in production** — use `app/tea-data.ts` directly.
- `tweaks-panel.jsx` — design-tool harness. **Ignore in production.**

---

## Implementation notes for the Next.js codebase

The target file is `app/page.tsx` (already a `"use client"` component). Suggested approach:

1. **Replace the `<style>` block** by adding the CSS custom properties + base typography to `app/globals.css`. Keep Tailwind (it's already wired) but use it sparingly — most layout in this design is grid/flex with explicit pixel values, not utility classes. A scoped CSS module for the page is also fine.
2. **Load fonts via `next/font/google`** in `app/layout.tsx` and expose them as CSS variables (`--display`, `--sans`, `--mono`).
3. **Re-implement the components** as `.tsx` files in `app/_components/` (or similar), one per logical region. Keep the props minimal — most regions only need the analyte + the row state.
4. **Reuse `tea-data.ts` verbatim.** Don't change `Analyte` shape or `evaluate()`.
5. **Apply the theme class on `<body>`** via a `useEffect` that reads from `localStorage` (or skip persistence and let `prefers-color-scheme` choose).
6. The repo's `AGENTS.md` warns that this is a forked Next.js — when in doubt, read `node_modules/next/dist/docs/` before invoking anything exotic.

Open `design/LotVerifier.html` in a browser side-by-side with your implementation while you build. The visual reference is the spec.
