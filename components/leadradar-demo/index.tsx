"use client";

import Link from "next/link";
import { sendProductEvent } from "@/components/product-events";
import { useLeadRadarDemo } from "./use-demo";
import { sampleComments, ResultBadge } from "./shared";

/**
 * LeadRadar 演示页（/tools/leadradar）。渲染代码与原实现一致。
 */
export function LeadRadarDemo() {
  const {
    feedbackState, feedbackAction, feedbackPending, demoVisible, setDemoVisible,
    activeStep, setActiveStep, captureStarted, setCaptureStarted, hasScrolledFeed,
    setHasScrolledFeed, capturedIndexes, setCapturedIndexes, visibleIndexes, setVisibleIndexes,
    reviewUnlocked, setReviewUnlocked, reviewFilter, setReviewFilter, feedback,
    setFeedback, problem, setProblem, attachmentLabel, setAttachmentLabel,
    feedbackFormRef, demoSectionRef, reviewSectionRef, feedListRef, commentRefs,
    capturedComments, summary, prioritizedComments, sidebarHighIntentComments, reviewViewComments,
    stepStates, revealDemo, handleTryDemoClick, handleFlowStepClick, syncVisibleComments,
    handleFeedScroll, unlockReview, handleFeedback, exportReviewCsv, getReviewTone,
    getReviewPriorityLabel, getIntentScore, getDemandTypeLabel, getLeadStageLabel, getNegotiationHint,
  } = useLeadRadarDemo();

  return (
    <div className="leadradar-demo-shell">
      <section className="container">
        <div className="leadradar-hero">
          <div className="leadradar-hero-copy">
            <p className="eyebrow">Illustrative workflow demo</p>
            <h1>LeadRadar: Social Comment Review Demo</h1>
            <p className="hero-description">
              Scroll a sample TikTok-style comment feed, let LeadRadar capture visible comments, and review possible
              B2B buying signals before deciding whether they deserve follow-up.
            </p>
            <div className="leadradar-hero-points" aria-label="LeadRadar quick value points">
              <span>Sample data, no signup</span>
              <span>Demo source: TikTok-style comments</span>
              <span>Human review stays in the loop</span>
            </div>
            <section className="leadradar-keyword-section" aria-label="LeadRadar semantic keyword summary">
              <p>
                <strong>LeadRadar:</strong> a product workflow for preserving visible
                comments, flagging possible commercial signals, and preparing a local review list. It does not automate
                outreach or guarantee leads.
              </p>
            </section>
            <section className="how-it-works-seo" aria-labelledby="how-it-works-seo-title">
              <h3 id="how-it-works-seo-title">How LeadRadar Flags Comments for Review</h3>
              <p>
                This demo reads visible TikTok-style comments and flags context that may deserve human review. Example
                signals include:
              </p>
              <ul className="signal-list">
                <li><strong>Pricing inquiries:</strong> Detecting requests for quotes, catalogs, or price lists.</li>
                <li><strong>MOQ questions:</strong> Identifying potential clients asking about Minimum Order Quantities.</li>
                <li><strong>Supplier search terms:</strong> Finding users actively looking for manufacturing or service partners.</li>
                <li><strong>Shipping requests:</strong> Capturing specific logistics and distribution requirements.</li>
              </ul>
            </section>
            <div className="hero-actions">
              <button type="button" className="button primary" onClick={handleTryDemoClick}>
                Try the workflow
              </button>
              <Link href="/products/leadradar" className="button ghost" prefetch={false}>
                View product page
              </Link>
            </div>
          </div>
        </div>
      </section>

      {demoVisible ? (
        <section className="container leadradar-flow-shell">
          <div className="leadradar-flow-status" aria-label="LeadRadar workflow preview status">
            {stepStates.map((step, index) => (
              <button
                key={step.label}
                type="button"
                className={`leadradar-flow-step${step.done ? " is-done" : ""}${activeStep === step.step ? " is-active" : ""}`}
                onClick={() => handleFlowStepClick(step.step)}
                disabled={step.step === 3 && !reviewUnlocked}
              >
                <span className="leadradar-flow-node">{index + 1}</span>
                <p>{step.label}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {demoVisible && activeStep !== 3 ? (
        <section id="leadradar-demo" className="container" ref={demoSectionRef}>
          <div className="leadradar-workbench">
            {activeStep === 1 || activeStep === 2 ? (
              <div className="form-card leadradar-input-card">
                <span className="eyebrow">Live comment feed</span>
                <h2>1. Scroll the comments. LeadRadar captures the signals.</h2>
                <p className="form-intro">
                  The real plugin does not require manual copy-paste. As you scroll a comment feed, LeadRadar watches visible
                  comments, extracts potential buying signals, and organizes them into a reviewable sidebar.
                </p>
                <div className="leadradar-capture-hint">
                  <strong>{hasScrolledFeed ? "Capture is live." : "Scroll this feed to start live capture."}</strong>
                  <p>
                    {hasScrolledFeed
                      ? "As visible comments enter the viewport, the sidebar on the right classifies and stores them automatically."
                      : "The right-side plugin panel will begin collecting visible comments as soon as you scroll this list."}
                  </p>
                </div>
                <div className="leadradar-feed-preview" aria-label="LeadRadar live comment capture preview">
                  <div className="leadradar-feed-topbar">
                    <span className="leadradar-feed-dot" />
                    <span className="leadradar-feed-dot" />
                    <span className="leadradar-feed-dot" />
                    <p>Sample comment stream</p>
                  </div>
                  <p className="form-feedback">These illustrative comments are sample data, not captured customer leads.</p>
                  <div className="leadradar-feed-list leadradar-feed-list-live" onScroll={handleFeedScroll} ref={feedListRef}>
                    {sampleComments.map((comment, index) => {
                      const isVisible = visibleIndexes.includes(index);
                      const isCaptured = capturedIndexes.includes(index);

                      return (
                        <article
                          key={`${comment.author}-${comment.text}`}
                          className={`leadradar-feed-comment${isVisible ? " is-visible" : ""}${isCaptured ? " is-captured" : ""}`}
                          ref={(node) => {
                            commentRefs.current[index] = node;
                          }}
                        >
                          <div className="leadradar-feed-comment-top">
                            <strong>{comment.author}</strong>
                            {isCaptured ? <span className="leadradar-feed-captured-badge">Captured</span> : null}
                          </div>
                          <p>{comment.text}</p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {activeStep === 2 ? (
              <div className={`leadradar-results-panel${captureStarted ? "" : " is-locked"}`}>
                <div className="section-panel leadradar-summary-panel leadradar-sidebar-panel">
                  <span className="eyebrow">{captureStarted ? "Sidebar live" : "Waiting for scroll"}</span>
                  <div className="section-heading">
                    <h2>2. The plugin sidebar updates while you browse</h2>
                  </div>
                  {captureStarted ? (
                    <>
                      <div className="grid-3 leadradar-summary-grid">
                        <div className="card">
                          <p className="leadradar-summary-label">Strong Intent</p>
                          <h3>{summary.high}</h3>
                        </div>
                        <div className="card">
                          <p className="leadradar-summary-label">Review Queue</p>
                          <h3>{summary.medium}</h3>
                        </div>
                        <div className="card">
                          <p className="leadradar-summary-label">Noise Captured</p>
                          <h3>{summary.low}</h3>
                        </div>
                      </div>
                      <div className="leadradar-sidebar-stream">
                        <div className="leadradar-sidebar-stream-head">
                          <h3>Captured in the sidebar</h3>
                          <span>{sidebarHighIntentComments.length} shown</span>
                        </div>
                        <div className="leadradar-sidebar-list">
                          {sidebarHighIntentComments.map((comment) => (
                            <article key={`${comment.author}-${comment.text}`} className="card leadradar-result-card leadradar-sidebar-card">
                              <div className="leadradar-result-top">
                                <strong>{comment.author}</strong>
                                <ResultBadge intent={comment.intent} />
                              </div>
                              <p className="leadradar-comment-text">{comment.text}</p>
                              <p className="leadradar-reason">{comment.reason}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                      <div className="leadradar-step-actions">
                        <button type="button" className="button primary" onClick={unlockReview}>
                          Review captured leads
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="leadradar-locked-state">
                      <strong>The sidebar starts empty, just like the real plugin.</strong>
                      <p>Scroll the left comment feed and LeadRadar will begin capturing the visible comments automatically.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {reviewUnlocked && activeStep === 3 ? (
        <section className="container" ref={reviewSectionRef}>
          <div className="section-panel leadradar-review-shell">
            <p className="eyebrow">Review view</p>
            <div className="section-heading">
              <h2>3. Review the qualified comments like the real LeadRadar workflow</h2>
            </div>
            <p className="form-intro">
              This view separates likely leads from human-review items. It is designed for quick inspection before export or outreach.
            </p>
            <section className="leadradar-review-toolbar">
              <div className="leadradar-filter-pills" aria-label="LeadRadar review filter">
                <button
                  type="button"
                  className={reviewFilter === "all" ? "leadradar-filter-pill is-active" : "leadradar-filter-pill"}
                  onClick={() => setReviewFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={reviewFilter === "strong" ? "leadradar-filter-pill is-active" : "leadradar-filter-pill"}
                  onClick={() => setReviewFilter("strong")}
                >
                  Strong Intent
                </button>
                <button
                  type="button"
                  className={reviewFilter === "review" ? "leadradar-filter-pill is-active" : "leadradar-filter-pill"}
                  onClick={() => setReviewFilter("review")}
                >
                  Review Queue
                </button>
              </div>
              <button type="button" className="button ghost" onClick={exportReviewCsv}>
                Export CSV
              </button>
              <p className="form-feedback">Cards are sorted by intent strength so the best follow-up opportunities stay visible first.</p>
            </section>

            <section className="leadradar-review-grid">
              {reviewViewComments.map((comment) => (
                <article key={`${comment.author}-${comment.text}`} className="leadradar-review-card">
                  <div className="leadradar-review-card-top">
                    <div className="leadradar-chip-group">
                      <span className={`leadradar-priority-chip ${getReviewTone(comment.intent)}`}>
                        {getReviewPriorityLabel(comment.intent)}
                      </span>
                      <span className="leadradar-plain-chip">{getDemandTypeLabel(comment)}</span>
                      <span className="leadradar-plain-chip">{getLeadStageLabel(comment.intent)}</span>
                      {comment.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="leadradar-plain-chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="leadradar-score-chip">Intent Score {getIntentScore(comment.intent)}</span>
                  </div>

                  <p className="leadradar-review-comment">{comment.text}</p>

                  <div className="leadradar-review-details">
                    <div>
                      <span className="leadradar-detail-label">Lead assessment</span>
                      <strong>{comment.reason}</strong>
                    </div>
                    <div>
                      <span className="leadradar-detail-label">Suggested next step</span>
                      <strong>{getNegotiationHint(comment)}</strong>
                    </div>
                  </div>

                  <div className="leadradar-review-footer">
                    <span>{comment.author}</span>
                    <span>{getDemandTypeLabel(comment)}</span>
                    <span>{comment.tags.length} tags</span>
                  </div>
                </article>
              ))}
            </section>
          </div>
        </section>
      ) : null}

      {reviewUnlocked ? (
        <section className="container">
          <div className="two-column leadradar-feedback-grid">
            <form action={feedbackAction} className="section-panel" ref={feedbackFormRef}>
              <p className="eyebrow">Lightweight feedback</p>
              <h2>4. Tell us if this result was useful</h2>
              <p className="form-intro">
                No account needed. We only want to know whether this kind of signal review is worth building deeper.
              </p>
              <input type="hidden" name="tool_slug" value="leadradar" />
              <input type="hidden" name="source_page" value="/tools/leadradar" />
              <input type="hidden" name="is_useful" value={feedback ?? ""} />
              <div className="leadradar-feedback-actions">
                <button
                  type="button"
                  className={`button ${feedback === "useful" ? "primary" : "ghost"}`}
                  onClick={() => handleFeedback("useful")}
                >
                  This was useful
                </button>
                <button
                  type="button"
                  className={`button ${feedback === "not_useful" ? "primary" : "ghost"}`}
                  onClick={() => handleFeedback("not_useful")}
                >
                  Not useful yet
                </button>
              </div>
              <label className="field">
                <span>What were you originally trying to solve?</span>
                <textarea
                  name="problem_context"
                  rows={5}
                  value={problem}
                  onChange={(event) => setProblem(event.target.value)}
                  placeholder="Example: I wanted to quickly separate casual comments from custom-order questions."
                />
              </label>
              <label className="field">
                <span>Attach the original user screenshot or file (optional)</span>
                <input
                  name="attachment"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    setAttachmentLabel(file?.name ?? "");
                  }}
                />
                {attachmentLabel ? <p className="form-feedback success">Attached: {attachmentLabel}</p> : null}
              </label>
              <button
                type="submit"
                className="button primary"
                disabled={feedbackPending || !feedback || !problem.trim()}
              >
                {feedbackPending ? "Submitting..." : "Send feedback"}
              </button>
              <p className={`form-feedback${feedbackState.success ? " success" : ""}`}>
                {feedbackState.message || "Choose useful / not useful, describe the original problem, and optionally attach context."}
              </p>
            </form>

            <div className="form-card">
              <h3>Continue if you want the full workflow</h3>
              <p className="form-intro">
                After the on-site workflow preview, the next step is the Edge extension flow for live capture, filtering, and export.
              </p>
              <div className="activity-list">
                <div>
                  <strong>Step 1</strong>
                  <p>Use the workflow preview to confirm whether comment filtering is valuable in your real workflow.</p>
                </div>
                <div>
                  <strong>Step 2</strong>
                  <p>Start PayPal checkout, then install from Edge after approval or follow the setup path provided after payment.</p>
                </div>
                <div>
                  <strong>Step 3</strong>
                  <p>Use the paid access path for setup support, access, and release timing.</p>
                </div>
              </div>
              <div className="leadradar-next-actions">
                <Link
                  href="/products/leadradar#subscription"
                  className="button primary"
                  prefetch={false}
                  onClick={() => void sendProductEvent("paypal_access_started")}
                >
                  Continue to PayPal checkout
                </Link>
              </div>
              <p className="form-feedback">Payment opens PayPal checkout immediately.</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
