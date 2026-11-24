export default function BottomSheet({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div
      className="sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{title}</h2>
          <button
            type="button"
            className="icon-btn btn-outline"
            style={{ padding: 0 }}
            onClick={onClose}
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}