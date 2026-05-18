import type { Analyte, Row, Result } from "./types";
import { fmtPct, fmtNum } from "./utils";

interface DataTableProps {
  rows: Row[];
  results: (Result | null)[];
  analyte: Analyte;
  updateRow: (i: number, field: "old" | "new", val: string) => void;
}

export function DataTable({
  rows,
  results,
  analyte,
  updateRow,
}: DataTableProps) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 38 }}>#</th>
            <th className="num">
              Old lot<span className="u">{analyte.units}</span>
            </th>
            <th className="num">
              New lot<span className="u">{analyte.units}</span>
            </th>
            <th className="num">% Diff</th>
            <th className="num">Abs Diff</th>
            <th className="center" style={{ width: 96 }}>
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const res = results[i] ?? null;
            const hasInput = r.old !== "" || r.new !== "";
            const pctOver =
              res != null &&
              analyte.teaPct != null &&
              res.pctDiff > analyte.teaPct;
            const absOver =
              res != null &&
              analyte.teaFixed != null &&
              res.absDiff > analyte.teaFixed;
            return (
              <tr key={i} className={hasInput ? "has-input" : ""}>
                <td className="idx-cell">
                  {String(i + 1).padStart(2, "0")}
                </td>
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
                    <span className="compare">
                      / {fmtPct(analyte.teaPct, 0)}
                    </span>
                  )}
                </td>
                <td className={"diff-cell" + (absOver ? " over" : "")}>
                  {res ? fmtNum(res.absDiff) : ""}
                  {res && analyte.teaFixed != null && (
                    <span className="compare">/ {analyte.teaFixed}</span>
                  )}
                </td>
                <td
                  className={
                    "verdict-cell " +
                    (res ? (res.pass ? "pass" : "fail") : "")
                  }
                >
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
