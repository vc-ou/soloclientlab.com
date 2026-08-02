export default function ResearchLoading() {
  return (
    <>
      <section className="container route-loading-shell route-loading-research" aria-live="polite" aria-busy="true">
        <div className="hero-grid hero-center route-loading-card">
          <div className="hero-copy route-loading-stack">
            <div className="route-loading-pill" />
            <div className="route-loading-bar route-loading-bar-xl" />
            <div className="route-loading-bar route-loading-bar-md route-loading-bar-center" />
          </div>
        </div>
      </section>

      <section className="container">
        <div>
          <div className="route-loading-topic-row" aria-hidden="true">
            <div className="route-loading-chip" />
            <div className="route-loading-chip" />
            <div className="route-loading-chip" />
            <div className="route-loading-chip" />
          </div>
          <div className="admin-grid">
            <div className="route-loading-post-card" />
            <div className="route-loading-post-card" />
            <div className="route-loading-post-card" />
          </div>
        </div>
      </section>
    </>
  );
}
