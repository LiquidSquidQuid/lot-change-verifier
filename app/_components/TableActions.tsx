const ROW_COUNT = 10;

interface TableActionsProps {
  onDemo: () => void;
  onClear: () => void;
  count: number;
}

export function TableActions({ onDemo, onClear, count }: TableActionsProps) {
  return (
    <div className="table-actions">
      <div className="grp">
        <span>
          {count} of {ROW_COUNT} rows entered
        </span>
      </div>
      <div className="grp">
        <button className="link-btn" onClick={onDemo}>
          Fill demo data
        </button>
        <button className="link-btn" onClick={onClear}>
          Clear rows
        </button>
        <button className="link-btn" onClick={() => window.print()}>
          Print / Export
        </button>
      </div>
    </div>
  );
}
