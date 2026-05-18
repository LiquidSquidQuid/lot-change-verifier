export function EmptyState() {
  return (
    <div className="empty-state">
      <div className="es-mark">¶</div>
      <div className="es-title">Awaiting analyte selection</div>
      <div className="es-hint">
        Choose an analyte above to begin verification
      </div>
    </div>
  );
}
