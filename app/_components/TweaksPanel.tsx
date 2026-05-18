"use client";

import { useState } from "react";

interface TweaksPanelProps {
  theme: string;
  density: string;
  showSig: boolean;
  onThemeChange: (t: string) => void;
  onDensityChange: (d: string) => void;
  onShowSigChange: (v: boolean) => void;
}

export function TweaksPanel({
  theme,
  density,
  showSig,
  onThemeChange,
  onDensityChange,
  onShowSigChange,
}: TweaksPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="tweaks-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Settings"
        aria-label="Toggle settings panel"
      >
        ⚙
      </button>
      {isOpen && (
        <div className="tweaks-panel">
          <div className="tp-title">Settings</div>

          <div className="tp-group">
            <div className="tp-label">Palette</div>
            <div className="tp-options">
              {["paper", "graphite", "ink"].map((t) => (
                <button
                  key={t}
                  className={"tp-opt" + (theme === t ? " is-active" : "")}
                  onClick={() => onThemeChange(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="tp-group">
            <div className="tp-label">Density</div>
            <div className="tp-options">
              {["compact", "comfortable", "roomy"].map((d) => (
                <button
                  key={d}
                  className={"tp-opt" + (density === d ? " is-active" : "")}
                  onClick={() => onDensityChange(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="tp-group">
            <div className="tp-label">Signature line</div>
            <div
              className="tp-toggle"
              onClick={() => onShowSigChange(!showSig)}
            >
              <div
                className={
                  "tp-toggle-track" + (showSig ? " is-on" : "")
                }
              >
                <div className="tp-toggle-thumb" />
              </div>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "9.5px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  color: "var(--ink-3)",
                }}
              >
                {showSig ? "On" : "Off"}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
