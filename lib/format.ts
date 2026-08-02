import { topicLabels } from "@/lib/content";

export function formatDate(date?: string) {
  if (!date) return "Draft";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

export function labelForTopic(topic?: string) {
  if (!topic) return "Research";

  if (topic === "client_acquisition" || topic === "marketing_positioning") {
    return topicLabels.solo_worker_client_acquisition;
  }
  if (topic === "ai_automation" || topic === "offer_validation" || topic === "operations") {
    return topicLabels.workflow_signal_research;
  }

  return topicLabels[topic as keyof typeof topicLabels] ?? topic;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toDateTimeLocalValue(date?: string) {
  if (!date) return "";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
