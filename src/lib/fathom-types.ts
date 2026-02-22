export type FathomAssignee = {
  name: string | null;
  email: string | null;
  team: string | null;
};

export type FathomActionItem = {
  description: string;
  user_generated?: boolean;
  completed?: boolean;
  recording_timestamp?: string;
  recording_playback_url?: string;
  assignee?: FathomAssignee;
};

export type FathomMeetingPayload = {
  action_items?: FathomActionItem[] | null;
  meeting?: {
    action_items?: FathomActionItem[] | null;
    title?: string | null;
    meeting_title?: string | null;
    url?: string | null;
    share_url?: string | null;
    created_at?: string | null;
  };
  title?: string | null;
  meeting_title?: string | null;
  url?: string | null;
  share_url?: string | null;
  created_at?: string | null;
};

export function getActionItems(payload: FathomMeetingPayload): FathomActionItem[] {
  const items = payload.action_items ?? payload.meeting?.action_items ?? [];
  return Array.isArray(items) ? items : [];
}

export function getMeetingContext(payload: FathomMeetingPayload) {
  const meeting = payload.meeting ?? payload;
  return {
    title: meeting.title ?? meeting.meeting_title ?? "Meeting",
    url: meeting.url ?? meeting.share_url ?? null,
    created_at: meeting.created_at ?? null,
  };
}
