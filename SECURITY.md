# Security review

## Summary

- **Secrets**: Slack webhook URL and Fathom secret are stored in Supabase and never returned to the client after setup. Connection ID in the webhook URL is an unguessable UUID.
- **Fathom verification**: When a Fathom webhook secret is set, requests are verified with HMAC-SHA256 and a 5-minute timestamp window; constant-time comparison is used.
- **Slack injection**: User-controlled content (action item description, meeting title, assignee name) is escaped for Slack mrkdwn before being sent.
- **SSRF**: Setup validates that the Slack URL starts with `https://hooks.slack.com/`, so outbound POSTs from the webhook handler are limited to Slack’s domain.

## Recommendations

### 1. Set `NEXT_PUBLIC_APP_URL` in production

The Fathom destination URL is built as `{baseUrl}/api/webhook/{id}`. Base URL is taken from `NEXT_PUBLIC_APP_URL` if set, otherwise from the request `Origin` header. In production you should set `NEXT_PUBLIC_APP_URL` (e.g. `https://your-app.vercel.app`) so an attacker cannot influence the URL via a forged `Origin` header.

### 2. Use the Fathom webhook secret

If the Fathom webhook secret is left empty, anyone who learns the webhook URL (e.g. from logs or a leak) can POST arbitrary payloads and have them forwarded to the configured Slack channel. For production, users should set the Fathom webhook secret so only Fathom can trigger the webhook.

### 3. Optional hardening

- **Rate limiting**: Consider rate-limiting `POST /api/setup` and `POST /api/webhook/[id]` (e.g. by IP or by connection id) to reduce abuse and DoS.
- **Payload size**: Very large Fathom payloads could produce large Slack messages; you may want to cap the number of action items or truncate descriptions.
- **Logging**: Avoid logging full request bodies or Supabase errors in production; they may contain secrets or PII.

## Checklist (addressed in code)

- [x] Slack URL restricted to `https://hooks.slack.com/`
- [x] Fathom signature verification when secret is set (replay + HMAC)
- [x] Slack mrkdwn escaping for description, title, and assignee name
- [x] Webhook route validates connection ID format (UUID) before querying DB
- [x] Env files ignored by git (`.env*`)
- [x] Service role key used only server-side (not `NEXT_PUBLIC_`)
