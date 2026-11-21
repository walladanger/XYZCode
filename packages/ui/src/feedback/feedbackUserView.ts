import type { FeedbackComment, FeedbackTicketStatus } from "@zcode/shared";

type MessageFormatter = (
  descriptor: { id: string },
  values?: Record<string, string>,
) => string;

const TOP_DESCRIPTION_SECTIONS = new Set([
  "结构化反馈",
  "开发复现信息",
  "用户原始描述",
]);
const REPRO_DESCRIPTION_SECTIONS = new Set([
  "问题概述",
  "复现步骤",
  "期望结果",
  "实际结果",
  "报错信息",
  "补充线索",
]);

const SYSTEM_COMMENT_PREFIX = "系统提示：";

export const STATUS_USER_HINT: Record<FeedbackTicketStatus, string> = {
  已提交: "We received it and will handle it soon.",
  信息不足: "We need a bit more information. Check the team reply below.",
  已采纳: "Your feedback was accepted. We will schedule a fix or improvement.",
  答复关闭: "The product team replied and closed this feedback. Submit a new one if the issue remains.",
  已归档: "The product team replied and closed this feedback. Submit a new one if the issue remains.",
  已拒绝: "This feedback is not planned for now. You can check the explanation below.",
  开发中: "We are working on it. Updates will appear below.",
  已解决: "The issue has been fixed and is waiting for release.",
  已上线: "The related fix or improvement is live. Thanks for the feedback.",
};

export const STATUS_USER_HINT_MESSAGE_IDS: Record<FeedbackTicketStatus, string> = {
  已提交: "feedback.statusHint.pendingReview",
  信息不足: "feedback.statusHint.needInfo",
  已采纳: "feedback.statusHint.accepted",
  答复关闭: "feedback.statusHint.closedByReply",
  已归档: "feedback.statusHint.archived",
  已拒绝: "feedback.statusHint.rejected",
  开发中: "feedback.statusHint.inDevelopment",
  已解决: "feedback.statusHint.resolved",
  已上线: "feedback.statusHint.released",
};

export function formatFeedbackStatusHint(
  status: FeedbackTicketStatus,
  formatMessage: MessageFormatter,
) {
  return formatMessage({ id: STATUS_USER_HINT_MESSAGE_IDS[status] });
}

export function formatRelativeTime(iso: string, formatMessage: MessageFormatter) {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diff = Date.now() - ts;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return formatMessage({ id: "feedback.time.justNow" });
  if (diff < hour) {
    return formatMessage(
      { id: "feedback.time.minutesAgo" },
      { count: String(Math.floor(diff / minute)) },
    );
  }
  if (diff < day) {
    return formatMessage(
      { id: "feedback.time.hoursAgo" },
      { count: String(Math.floor(diff / hour)) },
    );
  }
  if (diff < 7 * day) {
    return formatMessage(
      { id: "feedback.time.daysAgo" },
      { count: String(Math.floor(diff / day)) },
    );
  }
  return new Date(iso).toLocaleDateString();
}

export function formatSubmittedAt(iso: string, formatMessage: MessageFormatter) {
  const relative = formatRelativeTime(iso, formatMessage);
  if (!relative) return "";
  return formatMessage({ id: "feedback.time.submittedAt" }, { time: relative });
}

function isSystemComment(body: string) {
  return body.trimStart().startsWith(SYSTEM_COMMENT_PREFIX);
}

export function filterUserVisibleComments(comments: FeedbackComment[]) {
  return comments.filter((item) => !isSystemComment(item.body));
}

export function getUserFacingDescription(description: string) {
  const parsed = parseTicketDescription(description);
  if (parsed.raw) return parsed.raw.trim();
  if (parsed.reproOverview) return parsed.reproOverview.trim();
  const trimmed = description.trim();
  if (!trimmed || looksLikeStructuredTicketDescription(trimmed)) {
    return "";
  }
  return trimmed;
}

function parseTicketDescription(description: string) {
  const topSections = splitSections(description, TOP_DESCRIPTION_SECTIONS);
  const reproBody =
    topSections.find((item) => item.title === "开发复现信息")?.body ?? null;
  const reproOverview = reproBody
    ? splitSections(reproBody, REPRO_DESCRIPTION_SECTIONS).find(
        (item) => item.title === "问题概述",
      )?.body ?? null
    : null;
  return {
    raw: topSections.find((item) => item.title === "用户原始描述")?.body ?? null,
    reproOverview,
  };
}

function looksLikeStructuredTicketDescription(description: string) {
  return (
    description.includes("结构化反馈") ||
    description.includes("开发复现信息") ||
    description.includes("整理方式:")
  );
}

function splitSections(raw: string, headings: Set<string>) {
  const sections: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;
  for (const line of raw.split(/\r?\n/)) {
    const title = line.trim();
    if (headings.has(title)) {
      if (current) sections.push(current);
      current = { title, lines: [] };
      continue;
    }
    if (!current) current = { title: "内容", lines: [] };
    current.lines.push(line);
  }
  if (current) sections.push(current);
  return sections
    .map((section) => ({ title: section.title, body: section.lines.join("\n").trim() }))
    .filter((section) => section.body || section.title !== "内容");
}
