import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { normalizeSlackWebhookUrl } from "@/lib/slack-webhook";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawSlackWebhookUrl = body.slack_webhook_url ?? "";
    const slackWebhookUrl = normalizeSlackWebhookUrl(rawSlackWebhookUrl);
    const fathomWebhookSecret = body.fathom_webhook_secret?.trim() || null;
    const assigneeEmailFilter = body.assignee_email_filter?.trim() || null;

    if (fathomWebhookSecret && fathomWebhookSecret.length > 255) {
      return NextResponse.json(
        { error: "Fathom webhook secret must be 255 characters or less" },
        { status: 400 }
      );
    }
    const assigneeNameFilter = body.assignee_name_filter?.trim() || null;

    if (!String(rawSlackWebhookUrl).trim()) {
      return NextResponse.json(
        { error: "Slack webhook URL is required" },
        { status: 400 }
      );
    }

    if (!slackWebhookUrl) {
      return NextResponse.json(
        { error: "Slack webhook URL must be a valid https://hooks.slack.com/services/... URL" },
        { status: 400 }
      );
    }


    const supabase = getSupabase();
    if (assigneeEmailFilter && assigneeEmailFilter.length > 255) {
      return NextResponse.json(
        { error: "Assignee email filter must be 255 characters or less" },
        { status: 400 }
      );
    }
    if (assigneeNameFilter && assigneeNameFilter.length > 255) {
      return NextResponse.json(
        { error: "Assignee name filter must be 255 characters or less" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("connections")
      .insert({
        slack_webhook_url: slackWebhookUrl,
        fathom_webhook_secret: fathomWebhookSecret,
        assignee_email_filter: assigneeEmailFilter,
        assignee_name_filter: assigneeNameFilter,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to create connection" },
        { status: 500 }
      );
    }

    // Prefer NEXT_PUBLIC_APP_URL in production to avoid origin spoofing (see SECURITY.md)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const fathomDestinationUrl = `${baseUrl.replace(/\/$/, "")}/api/webhook/${data.id}`;

    return NextResponse.json({
      connectionId: data.id,
      fathomDestinationUrl,
    });
  } catch (e) {
    console.error("Setup error:", e);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
