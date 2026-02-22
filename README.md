# Fathom to Slack

Send Fathom meeting action items to a Slack channel via webhooks. No hosting required when deployed to Vercel.

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Supabase**

   - Create a project at [supabase.com](https://supabase.com).
   - Run the migrations in `supabase/migrations/` in order (Supabase Dashboard → SQL Editor, or `supabase db push` if using Supabase CLI).
   - In Project Settings → API: copy the Project URL and the `service_role` secret (not the anon key).

3. **Environment**

   Copy `.env.local.example` to `.env.local` and set:

   - `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` – your Supabase service role key
   - Optionally `NEXT_PUBLIC_APP_URL` – your app URL (e.g. `https://your-app.vercel.app`) so the Fathom destination URL is correct in production (recommended in production to avoid origin spoofing; see [SECURITY.md](SECURITY.md))

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000), enter your Slack webhook URL (and optional Fathom secret). Optionally set **Only send action items assigned to (email)** and/or **(name)** to receive just your action items; leave both blank for all action items. Use the generated URL in Fathom (Settings → API Access → Add webhook, enable "Include action items").

## Deploy (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add the same env vars in Vercel (Project Settings → Environment Variables).
3. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL so the Fathom destination URL is correct.

## Security

- Store only the Slack webhook URL and optional Fathom webhook secret in Supabase. The connection ID in the webhook URL is a UUID (unguessable).
- If you set a Fathom webhook secret, incoming webhooks are verified using Fathom’s signature; otherwise anyone with the webhook URL could POST to your endpoint.
