import type { ReactNode } from "react";

interface SectionHeaderProps {
  num: string;
  title: string;
  helper: ReactNode;
}

export function SectionHeader({ num, title, helper }: SectionHeaderProps) {
  return (
    <div className="step-header">
      <h2 className="h">
        <span className="num">{num}</span>
        {title}
      </h2>
      <div className="helper">{helper}</div>
    </div>
  );
}
