interface StripProps {
  onClear: () => void;
  hasData: boolean;
}

export function Strip({ onClear, hasData }: StripProps) {
  return (
    <div className="strip">
      <div>
        <span className="dot" />
        System Online · TEa Reference Database Loaded · 94 Analytes
      </div>
      <button className="btn-clear" onClick={onClear} disabled={!hasData}>
        Clear Session
      </button>
    </div>
  );
}
