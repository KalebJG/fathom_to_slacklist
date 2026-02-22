import type { FathomActionItem } from "./fathom-types";

type MeetingContext = {
  title: string;
  url: string | null;
  created_at: string | null;
};

export function buildSlackBlocks(
  actionItems: FathomActionItem[],
  meeting: MeetingContext,
  assigneeFilterApplied?: boolean
): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "New action items from Fathom", emoji: true },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: meeting.url
            ? `<${escapeSlackUrl(meeting.url)}|${escapeSlackText(meeting.title)}>`
            : escapeSlackText(meeting.title),
        },
      ],
    },
    { type: "divider" },
  ];

  if (actionItems.length === 0) {
    const emptyText = assigneeFilterApplied
      ? "_No action items assigned to you from this meeting._"
      : "_No action items from this meeting._";
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: emptyText },
    });
    return blocks;
  }

  for (const item of actionItems) {
    const assigneeLabel = item.assignee?.name
      ? ` • Assignee: ${escapeSlackText(item.assignee.name)}`
      : "";
    const link = item.recording_playback_url
      ? ` <${escapeSlackUrl(item.recording_playback_url)}|View in Fathom>`
      : "";
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `• ${escapeSlackText(item.description)}${assigneeLabel}${link}`,
      },
    });
  }

  return blocks;
}

function escapeSlackText(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Escape URL for Slack mrkdwn link; avoids breaking out of <url|text> */
function escapeSlackUrl(s: string): string {
  return String(s).replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;"));
}

export function buildSlackPayload(
  actionItems: FathomActionItem[],
  meeting: MeetingContext,
  assigneeFilterApplied?: boolean
): { text: string; blocks?: Record<string, unknown>[] } {
  const blocks = buildSlackBlocks(actionItems, meeting, assigneeFilterApplied);
  const fallbackText =
    actionItems.length === 0
      ? assigneeFilterApplied
        ? `No action items assigned to you from: ${meeting.title}`
        : `No action items from: ${meeting.title}`
      : `Action items from ${meeting.title}:\n${actionItems.map((i) => `• ${i.description}`).join("\n")}`;
  return {
    text: fallbackText,
    blocks,
  };
}
