import type { Analyte } from "../tea-data";

export interface Row {
  old: string;
  new: string;
}

export interface Result {
  idx: number;
  old: number;
  new: number;
  pctDiff: number;
  absDiff: number;
  pass: boolean;
}

export interface Summary {
  total: number;
  passing: number;
  failing: number;
  pctFail: number;
  overall: "PASS" | "FAIL" | "REVIEW";
  worst: number;
}

export type { Analyte };
