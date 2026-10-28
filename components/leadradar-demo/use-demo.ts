"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { trackPlausibleEvent } from "@/components/plausible-events";
import { sendProductEvent } from "@/components/product-events";
import { submitLeadRadarFeedback } from "@/lib/actions";
import {
  arraysMatch,
  comment,
  flowSteps,
  trackLeadRadarDemoClick,
  initialFeedbackState,
  sampleComments,
  type DemoComment,
  type DemoStep,
  type ReviewFilter
} from "./shared";

/**
 * 演示页的全部状态与交互逻辑（从 788 行的组件中拆出，逻辑未改）。
 */
export function useLeadRadarDemo() {
  const [feedbackState, feedbackAction, feedbackPending] = useActionState(submitLeadRadarFeedback, initialFeedbackState);
  const [demoVisible, setDemoVisible] = useState(false);
  const [activeStep, setActiveStep] = useState<DemoStep>(1);
  const [captureStarted, setCaptureStarted] = useState(false);
  const [hasScrolledFeed, setHasScrolledFeed] = useState(false);
  const [capturedIndexes, setCapturedIndexes] = useState<number[]>([]);
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);
  const [reviewUnlocked, setReviewUnlocked] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [feedback, setFeedback] = useState<"useful" | "not_useful" | null>(null);
  const [problem, setProblem] = useState("");
  const [attachmentLabel, setAttachmentLabel] = useState("");
  const feedbackFormRef = useRef<HTMLFormElement | null>(null);
  const demoSectionRef = useRef<HTMLElement | null>(null);
  const reviewSectionRef = useRef<HTMLElement | null>(null);
  const feedListRef = useRef<HTMLDivElement | null>(null);
  const commentRefs = useRef<Array<HTMLElement | null>>([]);
  const capturedComments = useMemo(
    () => capturedIndexes.map((index) => sampleComments[index]),
    [capturedIndexes]
  );

  const summary = useMemo(() => {
    const high = capturedComments.filter((item) => item.intent === "high").length;
    const medium = capturedComments.filter((item) => item.intent === "medium").length;
    const low = capturedComments.filter((item) => item.intent === "low").length;

    return { high, medium, low };
  }, [capturedComments]);

  const prioritizedComments = useMemo(() => {
    return [...capturedComments].sort((left, right) => {
      const priority = { high: 0, medium: 1, low: 2 } as const;
      return priority[left.intent] - priority[right.intent];
    });
  }, [capturedComments]);

  const sidebarHighIntentComments = useMemo(
    () => capturedComments.filter((comment) => comment.intent === "high"),
    [capturedComments]
  );

  const reviewViewComments = useMemo(() => {
    const filteredBase = prioritizedComments.filter((comment) => comment.intent !== "low");
    if (reviewFilter === "strong") {
      return filteredBase.filter((comment) => comment.intent === "high");
    }
    if (reviewFilter === "review") {
      return filteredBase.filter((comment) => comment.intent === "medium");
    }

    return filteredBase;
  }, [prioritizedComments, reviewFilter]);

  const stepStates = useMemo(
    () => [
      { step: 1 as DemoStep, label: flowSteps[0], done: hasScrolledFeed },
      { step: 2 as DemoStep, label: flowSteps[1], done: capturedComments.length > 0 },
      { step: 3 as DemoStep, label: flowSteps[2], done: reviewUnlocked }
    ],
    [capturedComments.length, hasScrolledFeed, reviewUnlocked]
  );

  useEffect(() => {
    function syncDemoHash() {
      if (window.location.hash === "#leadradar-demo") {
        setDemoVisible(true);
      }
    }

    syncDemoHash();
    window.addEventListener("hashchange", syncDemoHash);

    return () => window.removeEventListener("hashchange", syncDemoHash);
  }, []);

  useEffect(() => {
    if (!demoVisible) {
      return;
    }

    window.history.replaceState(null, "", "#leadradar-demo");
    requestAnimationFrame(() => {
      demoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [demoVisible]);

  function revealDemo() {
    setDemoVisible(true);
    setActiveStep(1);
  }

  function handleTryDemoClick() {
    trackPlausibleEvent("tool_demo_clicked");
    void trackLeadRadarDemoClick();
    revealDemo();
  }

  useEffect(() => {
    if (!demoVisible) {
      return;
    }

    setCaptureStarted(false);
    setHasScrolledFeed(false);
    setCapturedIndexes([]);
    setVisibleIndexes([]);
    setReviewUnlocked(false);
    setActiveStep(1);
  }, [demoVisible]);

  useEffect(() => {
    if (!demoVisible) {
      return;
    }

    const target = activeStep === 3 ? reviewSectionRef.current : demoSectionRef.current;
    if (!target) {
      return;
    }

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [activeStep, demoVisible]);

  useEffect(() => {
    if (feedbackState.success) {
      setFeedback(null);
      setProblem("");
      setAttachmentLabel("");
      feedbackFormRef.current?.reset();
      trackPlausibleEvent("tool_feedback_submitted");
    }
  }, [feedbackState.success]);

  function handleFlowStepClick(step: DemoStep) {
    if (step === 3 && !reviewUnlocked) {
      return;
    }

    setActiveStep(step);
  }

  function syncVisibleComments() {
    const feedNode = feedListRef.current;
    if (!feedNode) {
      return;
    }

    const feedRect = feedNode.getBoundingClientRect();
    const nextVisibleIndexes = sampleComments.reduce<number[]>((indexes, _comment, index) => {
      const commentNode = commentRefs.current[index];
      if (!commentNode) {
        return indexes;
      }

      const rect = commentNode.getBoundingClientRect();
      const isVisible = rect.bottom > feedRect.top + 24 && rect.top < feedRect.bottom - 24;
      if (isVisible) {
        indexes.push(index);
      }

      return indexes;
    }, []);

    setVisibleIndexes((current) => (arraysMatch(current, nextVisibleIndexes) ? current : nextVisibleIndexes));
    setCapturedIndexes((current) => {
      const merged = Array.from(new Set([...current, ...nextVisibleIndexes])).sort((left, right) => left - right);
      return arraysMatch(current, merged) ? current : merged;
    });
  }

  function handleFeedScroll() {
    if (!captureStarted) {
      setCaptureStarted(true);
      setReviewUnlocked(false);
      trackPlausibleEvent("tool_started");
    }

    if (!hasScrolledFeed) {
      setHasScrolledFeed(true);
    }

    if (activeStep === 1) {
      setActiveStep(2);
    }

    syncVisibleComments();
  }

  function unlockReview() {
    setReviewUnlocked(true);
    setReviewFilter("all");
    setActiveStep(3);
    trackPlausibleEvent("tool_completed");
    void fetch("/api/tool-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        toolSlug: "tools/leadradar",
        eventType: "review_completed",
        path: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer || undefined
      }),
      keepalive: true
    }).catch(() => undefined);
  }

  function handleFeedback(nextFeedback: "useful" | "not_useful") {
    setFeedback(nextFeedback);
  }

  function exportReviewCsv() {
    const rows = [
      ["author", "intent", "reason", "text", "tags"],
      ...reviewViewComments.map((comment) => [
        comment.author,
        comment.intent,
        comment.reason,
        comment.text,
        comment.tags.join("; ")
      ])
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leadradar-review.csv";
    link.click();
    URL.revokeObjectURL(url);
    trackPlausibleEvent("csv_exported");
    void sendProductEvent("csv_exported", { row_count: reviewViewComments.length });
  }

  function getReviewTone(intent: DemoComment["intent"]) {
    if (intent === "high") return "tone-strong";
    if (intent === "medium") return "tone-medium";
    return "tone-neutral";
  }

  function getReviewPriorityLabel(intent: DemoComment["intent"]) {
    if (intent === "high") return "Strong Intent";
    if (intent === "medium") return "Review";
    return "Non-Lead";
  }

  function getIntentScore(intent: DemoComment["intent"]) {
    if (intent === "high") return 72;
    if (intent === "medium") return 41;
    return 10;
  }

  function getDemandTypeLabel(comment: DemoComment) {
    if (comment.tags.some((tag) => /quote|pricing|FOB|EXW|CIF/i.test(tag))) return "Quote Request";
    if (comment.tags.some((tag) => /supplier|vendor/i.test(tag))) return "Supplier Search";
    if (comment.tags.some((tag) => /sample/i.test(tag))) return "Prototype / Sample";
    if (comment.tags.some((tag) => /MOQ|volume|units|capacity/i.test(tag))) return "Order Sizing";
    if (comment.tags.some((tag) => /packaging|label/i.test(tag))) return "Custom Packaging";
    return "Manual Review";
  }

  function getLeadStageLabel(intent: DemoComment["intent"]) {
    if (intent === "high") return "Ready to Reach Out";
    if (intent === "medium") return "Needs Human Review";
    return "Ignore";
  }

  function getNegotiationHint(comment: DemoComment) {
    if (comment.intent === "high") {
      return "Reply with pricing, MOQ, lead time, and the fastest path to a sample or supplier call.";
    }

    if (comment.intent === "medium") {
      return "Keep this in review, confirm commercial context, and check whether the request points to an active buying project.";
    }

    return "No follow-up needed unless a later comment adds commercial context.";
  }

  return {
    feedbackState,
    feedbackAction,
    feedbackPending,
    demoVisible,
    setDemoVisible,
    activeStep,
    setActiveStep,
    captureStarted,
    setCaptureStarted,
    hasScrolledFeed,
    setHasScrolledFeed,
    capturedIndexes,
    setCapturedIndexes,
    visibleIndexes,
    setVisibleIndexes,
    reviewUnlocked,
    setReviewUnlocked,
    reviewFilter,
    setReviewFilter,
    feedback,
    setFeedback,
    problem,
    setProblem,
    attachmentLabel,
    setAttachmentLabel,
    feedbackFormRef,
    demoSectionRef,
    reviewSectionRef,
    feedListRef,
    commentRefs,
    capturedComments,
    summary,
    prioritizedComments,
    sidebarHighIntentComments,
    reviewViewComments,
    stepStates,
    revealDemo,
    handleTryDemoClick,
    handleFlowStepClick,
    syncVisibleComments,
    handleFeedScroll,
    unlockReview,
    handleFeedback,
    exportReviewCsv,
    getReviewTone,
    getReviewPriorityLabel,
    getIntentScore,
    getDemandTypeLabel,
    getLeadStageLabel,
    getNegotiationHint
  };
}
