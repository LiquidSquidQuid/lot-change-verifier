import type { Summary } from "./types";
import { fmtPct } from "./utils";

interface VerdictBannerProps {
  summary: Summary;
  showSig: boolean;
}

export function VerdictBanner({ summary, showSig }: VerdictBannerProps) {
  const word =
    summary.overall === "PASS"
      ? "Pass"
      : summary.overall === "FAIL"
        ? "Fail"
        : "Review";
  const cls =
    summary.overall === "PASS"
      ? "v-pass"
      : summary.overall === "FAIL"
        ? "v-fail"
        : "v-review";
  const subtitle =
    summary.overall === "PASS"
      ? "All paired values within TEa. Lot may be placed in service."
      : summary.overall === "FAIL"
        ? "Lot exceeds total allowable error. Do not place in service."
        : "Borderline — supervisor review required before release.";

  return (
    <div
      className={"verdict-banner " + cls}
      role="status"
      aria-live="polite"
    >
      <div className="verdict-stamp">
        {word}.
        <span className="small">{subtitle}</span>
      </div>
      <div className="verdict-meta">
        <div>
          <div className="vm-label">Passing</div>
          <div className="vm-value">
            {summary.passing}
            <span className="frac">/{summary.total}</span>
          </div>
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
