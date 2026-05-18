import type { Analyte } from "./types";
import { SectionHeader } from "./SectionHeader";

interface AnalyteCardProps {
  analyte: Analyte;
}

export function AnalyteCard({ analyte }: AnalyteCardProps) {
  const teaPct = analyte.teaPct;
  const teaFixed = analyte.teaFixed;

  const tolerance =
    teaPct != null && teaFixed != null ? (
      <>
        ±{(teaPct * 100).toFixed(1)}
        <span className="unit">%</span> <em>or</em> ±{teaFixed}
        <span className="unit">{analyte.fixedUnits}</span>
      </>
    ) : teaPct != null ? (
      <>
        ±{(teaPct * 100).toFixed(1)}
        <span className="unit">%</span>
      </>
    ) : teaFixed != null ? (
      <>
        ±{teaFixed}
        <span className="unit">{analyte.fixedUnits}</span>
      </>
    ) : (
      <>—</>
    );

  return (
    <>
      <SectionHeader
        num="02"
        title="Acceptance Criteria"
        helper={<>Per CLIA TEa Reference v3.2</>}
      />
      <div className="analyte-card">
        <div className="cell">
          <div className="cell-label">Analyte</div>
          <div className="cell-value">
            {analyte.name}
            <span className="sub">
              {analyte.specimen} · {analyte.instrument}
            </span>
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
