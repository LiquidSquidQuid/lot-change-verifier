import { todayString } from "./utils";

export function Masthead() {
  return (
    <header className="masthead">
      <div className="seal" aria-hidden="true">
        L
      </div>
      <div className="wordmark">
        <div className="eyebrow">SAMC · Clinical Chemistry · QC</div>
        <h1>
          Lot Change <em>Verifier</em>
        </h1>
      </div>
      <div className="meta">
        <div className="meta-item">
          <span>Standard</span>
          <span>TEa v3.2</span>
        </div>
        <div className="meta-item">
          <span>Regulation</span>
          <span>CLIA 2024</span>
        </div>
        <div className="meta-item">
          <span>Today</span>
          <span>{todayString()}</span>
        </div>
      </div>
    </header>
  );
}
