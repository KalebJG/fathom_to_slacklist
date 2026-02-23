export function normalizeSlackWebhookUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (parsed.hostname !== "hooks.slack.com") return null;
  if (!parsed.pathname.startsWith("/services/")) return null;
  if (parsed.username || parsed.password) return null;
  if (parsed.search || parsed.hash) return null;

  return parsed.toString();
}
