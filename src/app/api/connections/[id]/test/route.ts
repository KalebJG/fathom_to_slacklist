import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { buildSlackPayload } from "@/lib/slack-message";
import type { FathomActionItem } from "@/lib/fathom-types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FAKE_ACTION_ITEMS: FathomActionItem[] = [
  {
    description: "This is a test action item from Fathom to Slack.",
    assignee: { name: "Test User", email: null, team: null },
  },
];

const FAKE_MEETING = {
  title: "Test meeting (Fathom → Slack)",
  url: null as string | null,
  created_at: null as string | null,
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
  const slackPayload = buildSlackPayload(
    FAKE_ACTION_ITEMS,
    FAKE_MEETING,
    hasFilter
  );

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
