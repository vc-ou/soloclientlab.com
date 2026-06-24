export default function Loading() {
  return (
    <section className="container route-loading-shell" aria-live="polite" aria-busy="true">
      <div className="route-loading-card">
        <div className="route-loading-bar route-loading-bar-lg" />
        <div className="route-loading-bar route-loading-bar-md" />
        <div className="route-loading-grid">
          <div className="route-loading-block" />
          <div className="route-loading-block" />
          <div className="route-loading-block" />
        </div>
      </div>
    </section>
  );
}
