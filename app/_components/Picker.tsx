import { forwardRef, useEffect, useRef } from "react";
import type { Analyte } from "./types";
import { SectionHeader } from "./SectionHeader";
import { highlightMatch } from "./utils";

interface PickerProps {
  search: string;
  setSearch: (v: string) => void;
  selected: Analyte | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  onKey: (e: React.KeyboardEvent) => void;
  grouped: [string, Analyte[]][];
  flat: Analyte[];
  activeIdx: number;
  setActiveIdx: (idx: number) => void;
  selectAnalyte: (a: Analyte) => void;
  onClearSelection: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export const Picker = forwardRef<HTMLInputElement, PickerProps>(
  function Picker(props, ref) {
    const {
      search,
      setSearch,
      selected,
      open,
      setOpen,
      onKey,
      grouped,
      flat,
      activeIdx,
      setActiveIdx,
      selectAnalyte,
      onClearSelection,
      dropdownRef,
    } = props;

    const activeRowRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      activeRowRef.current?.scrollIntoView({ block: "nearest" });
    }, [activeIdx]);

    return (
      <section style={{ marginBottom: 8 }}>
        <SectionHeader
          num="01"
          title={selected ? "Selected Analyte" : "Choose an Analyte"}
          helper={
            <>
              Search by name, instrument, or specimen · <kbd>⌘K</kbd>
            </>
          }
        />
        <div className="picker">
          <div
            className={
              "picker-field " +
              (selected ? "is-selected " : "") +
              (open ? "is-open" : "")
            }
          >
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
              <button
                className="clear-x"
                onClick={onClearSelection}
                title="Clear selection"
              >
                CHANGE
              </button>
            )}
          </div>
          {open && (
            <div className="dropdown" ref={dropdownRef}>
              {grouped.length === 0 && (
                <div className="dropdown-empty">
                  No analytes match &ldquo;{search}&rdquo;
                </div>
              )}
              {grouped.map(([instrument, items]) => (
                <div key={instrument}>
                  <div className="dropdown-group-label">
                    {instrument} · {items.length}
                  </div>
                  {items.map((a) => {
                    const fIdx = flat.indexOf(a);
                    return (
                      <div
                        key={a.name}
                        ref={fIdx === activeIdx ? activeRowRef : undefined}
                        className={
                          "dropdown-row " +
                          (fIdx === activeIdx ? "is-active" : "")
                        }
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectAnalyte(a);
                        }}
                        onMouseEnter={() => setActiveIdx(fIdx)}
                      >
                        <div className="idx">
                          {String(fIdx + 1).padStart(2, "0")}
                        </div>
                        <div className="name">
                          {highlightMatch(a.name, search)}
                        </div>
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
  }
);
