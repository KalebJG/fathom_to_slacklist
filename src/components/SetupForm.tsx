"use client";

import { useState } from "react";

type Result = {
  connectionId: string;
  fathomDestinationUrl: string;
};

export function SetupForm() {
  const [slackUrl, setSlackUrl] = useState("");
  const [fathomSecret, setFathomSecret] = useState("");
  const [assigneeEmailFilter, setAssigneeEmailFilter] = useState("");
  const [assigneeNameFilter, setAssigneeNameFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slack_webhook_url: slackUrl.trim(),
          fathom_webhook_secret: fathomSecret.trim() || undefined,
          assignee_email_filter: assigneeEmailFilter.trim() || undefined,
          assignee_name_filter: assigneeNameFilter.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setResult({
        connectionId: data.connectionId,
        fathomDestinationUrl: data.fathomDestinationUrl,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyUrl() {
    if (!result) return;
    navigator.clipboard.writeText(result.fathomDestinationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendTestToSlack() {
    if (!result) return;
    setTestMessage(null);
    setTestLoading(true);
    try {
      const res = await fetch(`/api/connections/${result.connectionId}/test`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setTestMessage(data.error || "Failed to send test message.");
        return;
      }
      setTestMessage("Test message sent to Slack.");
    } catch {
      setTestMessage("Network error. Please try again.");
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Setup form
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="slack-url"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Slack webhook URL
            </label>
            <input
              id="slack-url"
              type="url"
              required
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Create an Incoming Webhook in your Slack workspace and paste the
              URL here.
            </p>
          </div>
          <div>
            <label
              htmlFor="fathom-secret"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Fathom webhook secret (optional)
            </label>
            <input
              id="fathom-secret"
              type="password"
              value={fathomSecret}
              onChange={(e) => setFathomSecret(e.target.value)}
              placeholder="whsec_..."
              className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              From Fathom when you add this destination; used to verify
              requests.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="assignee-email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Only send action items assigned to (email)
              </label>
              <input
                id="assignee-email"
                type="email"
                value={assigneeEmailFilter}
                onChange={(e) => setAssigneeEmailFilter(e.target.value)}
                placeholder="me@company.com"
                className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div>
              <label
                htmlFor="assignee-name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Only send action items assigned to (name)
              </label>
              <input
                id="assignee-name"
                type="text"
                value={assigneeNameFilter}
                onChange={(e) => setAssigneeNameFilter(e.target.value)}
                placeholder="Jane Smith"
                className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Leave both blank to receive all action items. If you set one or
              both, only items assigned to that email or name are sent (either
              match is enough).
            </p>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2.5 px-4 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create connection"}
          </button>
        </form>
      </section>

      {result && (
        <section className="space-y-5">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Result panel
          </h2>
          <div className="space-y-4 rounded-xl border border-zinc-200/90 bg-zinc-50/70 p-6 dark:border-zinc-700/80 dark:bg-zinc-900/80">
            <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
              Your Fathom destination URL
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={result.fathomDestinationUrl}
                className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={copyUrl}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <button
                type="button"
                onClick={sendTestToSlack}
                disabled={testLoading}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                {testLoading ? "Sending…" : "Send test message to Slack"}
              </button>
              {testMessage && (
                <p
                  className={`text-sm ${
                    testMessage.startsWith("Test message sent")
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                  role="status"
                >
                  {testMessage}
                </p>
              )}
            </div>
            <div className="rounded-md bg-zinc-100 p-4 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Setup in Fathom
              </p>
              <ol className="mt-2 list-decimal list-inside space-y-1">
                <li>Go to Fathom → Settings → API Access → Add webhook.</li>
                <li>Paste the URL above as the destination.</li>
                <li>
                  Enable only &quot;Include action items&quot; for this webhook.
                </li>
              </ol>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
