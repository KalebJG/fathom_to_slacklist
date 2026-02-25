import type { FathomActionItem } from "./fathom-types";

type MeetingContext = {
  title: string;
  url: string | null;
  created_at: string | null;
};

export function buildWorkflowPayloads(
  actionItems: FathomActionItem[],
  meeting: MeetingContext,
  assigneeFilterApplied?: boolean
): Record<string, string>[] {
  if (actionItems.length === 0) {
    return [{
      task: assigneeFilterApplied
        ? "No action items assigned to you from this meeting."
        : "No action items from this meeting.",
      assignee: "",
      meeting_title: meeting.title,
      meeting_url: meeting.url ?? "",
    }];
  }

  return actionItems.map((item) => ({
    task: item.description,
    assignee: item.assignee?.name ?? "Unassigned",
    meeting_title: meeting.title,
    meeting_url: meeting.url ?? "",
  }));
}
