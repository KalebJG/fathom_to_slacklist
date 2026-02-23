import { SetupForm } from "@/components/SetupForm";

export default function Home() {
  return (
    <div className="app-shell min-h-screen font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.13),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.12),_transparent_60%)]" />
      <main className="relative mx-auto max-w-2xl px-6 py-14 sm:py-20">
        <section className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-xl shadow-zinc-300/30 backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:shadow-none sm:p-10">
          <div className="space-y-10">
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Overview
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
                Fathom to Slack
              </h1>
              <p className="max-w-prose text-zinc-600 dark:text-zinc-300">
                Send Fathom meeting action items to a Slack channel. Enter your
                webhook URLs below and use the generated destination URL in
                Fathom.
              </p>
            </section>

            <SetupForm />
          </div>
        </section>
      </main>
    </div>
  );
}
