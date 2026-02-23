# Security review

## Summary

- **Secrets**: Slack webhook URL and Fathom secret are stored in Supabase and never returned to the client after setup. Connection ID in the webhook URL is an unguessable UUID.
- **Fathom verification**: When a Fathom webhook secret is set, requests are verified with HMAC-SHA256 and a 5-minute timestamp window; constant-time comparison is used.
- **Slack injection**: User-controlled content (action item description, meeting title, assignee name) is escaped for Slack mrkdwn before being sent.
- **SSRF**: Slack webhook URLs are parsed and validated (`https`, hostname `hooks.slack.com`, `/services/` path, no credentials/query/hash) at setup and again before outbound sends.

## Recommendations

### 1. Set `NEXT_PUBLIC_APP_URL` in production

The Fathom destination URL is built as `{baseUrl}/api/webhook/{id}`. Base URL is taken from `NEXT_PUBLIC_APP_URL` if set, otherwise from `request.url` origin. In production you should still set `NEXT_PUBLIC_APP_URL` (e.g. `https://your-app.vercel.app`) so links are stable and not dependent on forwarded host headers.

### 2. Use the Fathom webhook secret

If the Fathom webhook secret is left empty, anyone who learns the webhook URL (e.g. from logs or a leak) can POST arbitrary payloads and have them forwarded to the configured Slack channel. For production, users should set the Fathom webhook secret so only Fathom can trigger the webhook.

### 3. Optional hardening

- **Rate limiting**: Consider rate-limiting `POST /api/setup` and `POST /api/webhook/[id]` (e.g. by IP or by connection id) to reduce abuse and DoS.
- **Payload size**: Request body size is capped (1 MB) in the webhook route; consider also capping action-item count or truncating long descriptions.
- **Logging**: Avoid logging full request bodies or Supabase errors in production; they may contain secrets or PII.

## Checklist (addressed in code)

- [x] Slack URL parsed/validated to strict Slack webhook shape (`https://hooks.slack.com/services/...`)
- [x] Fathom signature verification when secret is set (replay + HMAC)
- [x] Slack mrkdwn escaping for description, title, and assignee name
- [x] Webhook route validates connection ID format (UUID) before querying DB
- [x] Env files ignored by git (`.env*`)
- [x] Service role key used only server-side (not `NEXT_PUBLIC_`)
