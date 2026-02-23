import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { verifyFathomWebhook } from "../../../../lib/fathom-verify";
import {
  getActionItems,
  getMeetingContext,
  type FathomMeetingPayload,
} from "@/lib/fathom-types";
import { buildSlackPayload } from "@/lib/slack-message";
import { normalizeSlackWebhookUrl } from "@/lib/slack-webhook";

/** Shape of connection row as selected by this route */
type WebhookConnectionRow = {
  slack_webhook_url: string;
  fathom_webhook_secret: string | null;
  assignee_email_filter: string | null;
  assignee_name_filter: string | null;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Invalid body" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  const { data, error: fetchError } = await supabase
    .from("connections")
    .select("slack_webhook_url, fathom_webhook_secret, assignee_email_filter, assignee_name_filter")
    .eq("id", id)
    .single();

  const connection: WebhookConnectionRow | null = data ?? null;
  if (fetchError || !connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  if (connection.fathom_webhook_secret) {
    const isValid = verifyFathomWebhook(
      connection.fathom_webhook_secret,
      request.headers,
      rawBody
    );
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }
  }

  if (rawBody.length > 1_000_000) {
    return NextResponse.json(
      { error: "Payload too large" },
      { status: 413 }
    );
  }

  let payload: FathomMeetingPayload;
  try {
    payload = JSON.parse(rawBody) as FathomMeetingPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  let actionItems = getActionItems(payload);
  const emailFilter = connection.assignee_email_filter?.trim();
  const nameFilter = connection.assignee_name_filter?.trim();
  const hasFilter = !!emailFilter || !!nameFilter;

  if (hasFilter && actionItems.length > 0) {
    const emailMatchVal = emailFilter?.toLowerCase();
    const nameMatchVal = nameFilter?.toLowerCase();
    actionItems = actionItems.filter((item) => {
      if (!item.assignee) return false;
      const emailMatch =
        !!emailMatchVal &&
        item.assignee.email?.trim().toLowerCase() === emailMatchVal;
      const nameMatch =
        !!nameMatchVal &&
        item.assignee.name?.trim().toLowerCase() === nameMatchVal;
      return emailMatch || nameMatch;
    });
  }

  const meeting = getMeetingContext(payload);
  const slackPayload = buildSlackPayload(actionItems, meeting, hasFilter);

  const slackWebhookUrl = normalizeSlackWebhookUrl(connection.slack_webhook_url);
  if (!slackWebhookUrl) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  const slackRes = await fetch(slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(slackPayload),
  });

  if (!slackRes.ok) {
    const errText = await slackRes.text();
    console.error("Slack webhook error:", slackRes.status, errText);
    return NextResponse.json(
      { error: "Failed to send to Slack" },
      { status: 502 }
    );
  }

  return new NextResponse(null, { status: 200 });
}
