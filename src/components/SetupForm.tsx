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
  const [testMessageType, setTestMessageType] = useState<"success" | "error" | null>(
    null,
  );

  const trimmedSlackUrl = slackUrl.trim();
  const trimmedAssigneeEmailFilter = assigneeEmailFilter.trim();
  const slackUrlLooksInvalid =
    trimmedSlackUrl.length > 0 && !isValidUrl(trimmedSlackUrl);
  const assigneeEmailLooksInvalid =
    trimmedAssigneeEmailFilter.length > 0 &&
    !isValidEmail(trimmedAssigneeEmailFilter);

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
      setTestMessage(null);
      setTestMessageType(null);
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
    setTestMessageType(null);
    setTestLoading(true);
    try {
      const res = await fetch(`/api/connections/${result.connectionId}/test`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setTestMessage(data.error || "Failed to send test message.");
        setTestMessageType("error");
        return;
      }
      setTestMessage("Test message sent to Slack.");
      setTestMessageType("success");
    } catch {
      setTestMessage("Network error. Please try again.");
      setTestMessageType("error");
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <div className="mt-10">
      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={loading}>
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
            className={inputClassName(slackUrlLooksInvalid)}
            aria-invalid={slackUrlLooksInvalid}
            aria-describedby="slack-url-help slack-url-hint"
          />
          <p id="slack-url-help" className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Create an Incoming Webhook in your Slack workspace and paste the URL
            here.
          </p>
          <p
            id="slack-url-hint"
            className={`mt-1 text-sm ${slackUrlLooksInvalid ? "text-amber-700 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400"}`}
          >
            {slackUrlLooksInvalid
              ? "Enter a full URL including https://"
              : "Use the full Slack webhook URL (starts with https://)."}
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
            className={inputClassName(false)}
          />
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            From Fathom when you add this destination; used to verify requests.
          </p>
        </div>
        <details className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/60">
          <summary className="cursor-pointer select-none text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Advanced filters (optional)
          </summary>
          <div className="mt-4 space-y-4">
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
                className={inputClassName(assigneeEmailLooksInvalid)}
                aria-invalid={assigneeEmailLooksInvalid}
              />
              <p
                className={`mt-1 text-sm ${assigneeEmailLooksInvalid ? "text-amber-700 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400"}`}
              >
                {assigneeEmailLooksInvalid
                  ? "Enter a valid email address, like me@company.com"
                  : "Optional: limit notifications to one assignee email."}
              </p>
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
                className={inputClassName(false)}
              />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Leave both blank to receive all action items. If you set one or
              both, only items assigned to that email or name are sent (either
              match is enough).
            </p>
          </div>
        </details>
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/80 dark:bg-red-950/40 dark:text-red-300"
          >
            <p className="font-medium">Could not create connection</p>
            <p className="mt-1">{error}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading && <Spinner />}
          {loading ? "Creating connection…" : "Create connection"}
        </button>
      </form>

      {result && (
        <div className="mt-12 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 space-y-4">
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"
          >
            <p className="font-medium">Connection created successfully</p>
            <p className="mt-1">
              Use the destination URL below in Fathom, then send a test message
              to verify.
            </p>
          </div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Your Fathom destination URL
          </h2>
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
              aria-busy={testLoading}
              className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {testLoading && <Spinner small />}
              {testLoading ? "Sending test message…" : "Send test message to Slack"}
            </button>
            {testMessage && (
              <div
                role={testMessageType === "error" ? "alert" : "status"}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  testMessageType === "success"
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"
                    : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/80 dark:bg-red-950/40 dark:text-red-300"
                }`}
              >
                {testMessage}
              </div>
            )}
          </div>
          <div className="rounded-md bg-zinc-100 dark:bg-zinc-800 p-4 text-sm text-zinc-700 dark:text-zinc-300">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Setup in Fathom
            </p>
            <ol className="mt-2 list-decimal list-inside space-y-1">
              <li>Go to Fathom → Settings → API Access → Add webhook.</li>
              <li>Paste the URL above as the destination.</li>
              <li>Enable only &quot;Include action items&quot; for this webhook.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function inputClassName(hasError: boolean) {
  return `mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 transition-colors hover:border-zinc-400 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 ${
    hasError
      ? "border-amber-500 focus:border-amber-500 focus:ring-amber-500 dark:border-amber-500"
      : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-600"
  }`;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function Spinner({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={`animate-spin ${small ? "h-4 w-4" : "h-5 w-5"}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4Z"
      />
    </svg>
  );
}
