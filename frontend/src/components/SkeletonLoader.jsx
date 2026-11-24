export function ProductGridSkeleton({ count = 4 }) {
  return (
    <div className="product-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="product-card">
          <div className="skeleton" style={{ aspectRatio: '1 / 1', width: '100%' }} />
          <div className="product-card-body">
            <div className="skeleton" style={{ height: '18px', width: '80%' }} />
            <div className="skeleton" style={{ height: '20px', width: '50%' }} />
            <div className="skeleton" style={{ height: '44px', width: '100%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}