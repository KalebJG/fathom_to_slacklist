import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { buildSlackPayload } from "@/lib/slack-message";
import {
  getActionItems,
  getMeetingContext,
  type FathomMeetingPayload,
} from "@/lib/fathom-types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Sample payload based on Fathom "new meeting content ready" docs.
 * It lets users validate Slack rendering before wiring a real webhook.
 */
const SAMPLE_FATHOM_PAYLOAD: FathomMeetingPayload = {
  meeting: {
    meeting_title: "Product sync – Q2 planning",
    share_url: "https://fathom.video/share/demo-meeting",
    created_at: "2026-02-20T18:17:00.000Z",
    action_items: [
      {
        description: "Share the updated launch timeline by Friday",
        assignee: {
          name: "Avery Kim",
          email: "avery@example.com",
          team: "Product",
        },
        recording_playback_url: "https://fathom.video/share/demo-meeting?t=14m10s",
      },
      {
        description: "Draft customer FAQ for the onboarding flow",
        assignee: {
          name: "Jordan Lee",
          email: "jordan@example.com",
          team: "Success",
        },
      },
    ],
  },
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  const supabase = getSupabase();
  const { data: connection, error: fetchError } = await supabase
    .from("connections")
    .select("slack_webhook_url, assignee_email_filter, assignee_name_filter")
    .eq("id", id)
    .single();

  if (fetchError || !connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  const hasFilter =
    !!connection.assignee_email_filter?.trim() ||
    !!connection.assignee_name_filter?.trim();
  const actionItems = getActionItems(SAMPLE_FATHOM_PAYLOAD);
  const meeting = getMeetingContext(SAMPLE_FATHOM_PAYLOAD);
  const slackPayload = buildSlackPayload(actionItems, meeting, hasFilter);

  const slackRes = await fetch(connection.slack_webhook_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(slackPayload),
  });

  if (!slackRes.ok) {
    const errText = await slackRes.text();
    console.error("Slack test webhook error:", slackRes.status, errText);
    return NextResponse.json(
      { error: "Failed to send to Slack" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
