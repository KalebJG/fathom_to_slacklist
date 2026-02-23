import { CursorTrail } from "@/components/CursorTrail";
import { SetupForm } from "@/components/SetupForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Fathom to Slack
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Send Fathom meeting action items to a Slack channel. Enter your
          webhook URLs below and use the generated URL in Fathom.
        </p>
        <CursorTrail />
        <SetupForm />
      </main>
    </div>
  );
}
