# Fathom to Slack

Automatically send [Fathom](https://fathom.video) meeting action items to a Slack channel via webhooks. Each action item triggers your Slack Workflow individually, so you can format, route, or act on them however you like.

Designed to deploy on [Vercel](https://vercel.com) with a [Supabase](https://supabase.com) database -- no server management required.

## How it works

```
Fathom meeting ends
  → Fathom sends a webhook to your app
    → App extracts action items from the payload
      → Optionally filters by assignee (name or email)
        → Sends one POST per action item to your Slack Workflow trigger
          → Slack Workflow formats and posts each item to your channel
```

Each POST to Slack contains a flat JSON object with these fields:

| Field           | Description                          | Example                                 |
|-----------------|--------------------------------------|-----------------------------------------|
| `task`          | The action item description          | "Share the updated launch timeline"     |
| `assignee`      | Name of the assigned person          | "Avery Kim"                             |
| `meeting_title` | Title of the meeting                 | "Product sync – Q2 planning"            |
| `meeting_url`   | Link to the Fathom recording         | "https://fathom.video/share/demo-meeting" |

## Prerequisites

- [Node.js](https://nodejs.org) 20.x
- A [Supabase](https://supabase.com) project (free tier works)
- A Slack workspace with a [Workflow](https://slack.com/help/articles/17542172840595-Build-a-workflow--Create-a-workflow-that-starts-with-a-webhook-trigger) that starts from a webhook trigger

## Setup

### 1. Clone and install

```bash
git clone https://github.com/KalebJG/fathom_to_slacklist.git
cd fathom_to_slacklist
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migrations in `supabase/migrations/` in order (Supabase Dashboard > SQL Editor, or `supabase db push` with the Supabase CLI).
3. In Project Settings > API, copy your **Project URL** and **service_role** secret (not the anon key).

### 3. Set up your Slack Workflow

1. Open Slack and go to **Automations** (or **Workflow Builder**).
2. Create a new workflow and choose **Starts with a webhook** as the trigger.
3. Add four variables, all with type **Text**:
   - `task`
   - `assignee`
   - `meeting_title`
   - `meeting_url`
4. Add a **Send a message** step (or any other action you want). Use the variables in your message template, for example:

   > **New action item from {{meeting_title}}**
   > Task: {{task}}
   > Assigned to: {{assignee}}
   > Recording: {{meeting_url}}

5. Publish the workflow and copy the webhook URL (it will start with `https://hooks.slack.com/triggers/...`).

### 4. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app   # optional for local dev, recommended in production
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Create a connection

On the app's home page:

1. Paste your **Slack Workflow trigger URL** (from step 3).
2. Optionally enter a **Fathom webhook secret** (recommended for production -- verifies that requests actually come from Fathom).
3. Optionally set an **assignee email** and/or **name** filter. If set, only action items assigned to that person are forwarded. Leave both blank to receive all action items.
4. Click **Create connection**. You'll get a Fathom destination URL.
5. Click **Send sample Fathom payload to Slack** to verify the integration works. You should see one message per sample action item appear in your Slack channel.

### 7. Wire up Fathom

1. In Fathom, go to **Settings > API Access > Add webhook**.
2. Paste the destination URL from step 6.
3. Enable **Include action items** for this webhook.
4. If you set a secret in step 6, enter the same secret in Fathom.

After your next meeting, Fathom will automatically send action items to your Slack channel.

## Deploy to Vercel

1. Push your repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Add the environment variables in Vercel (Project Settings > Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` -- set this to your Vercel URL (e.g. `https://your-app.vercel.app`)

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── setup/route.ts                  # POST: creates a new connection
│   │   ├── webhook/[id]/route.ts           # POST: receives Fathom webhooks
│   │   └── connections/[id]/test/route.ts  # POST: sends sample data to Slack
│   ├── page.tsx                            # Home page with setup form
│   └── layout.tsx                          # App shell
├── components/
│   └── SetupForm.tsx                       # Form UI for creating connections
└── lib/
    ├── fathom-types.ts        # Fathom payload types and extraction helpers
    ├── fathom-verify.ts       # HMAC-SHA256 webhook signature verification
    ├── slack-message.ts       # Builds per-item workflow trigger payloads
    ├── slack-webhook.ts       # Slack URL validation and normalization
    └── supabase.ts            # Supabase client setup

supabase/
└── migrations/                # Database schema (run these in order)
```

## Assignee filtering

When you create a connection, you can optionally filter by assignee email and/or name. If either field is set:

- Only action items whose assignee matches (case-insensitive) are forwarded to Slack.
- Items without an assignee are skipped.
- If both email and name are set, an item is forwarded if **either** matches.

Leave both blank to receive every action item from every meeting.

## Security

- Connection IDs are UUIDs -- unguessable by design.
- Slack webhook URLs and Fathom secrets are stored in Supabase and never returned to the client after setup.
- When a Fathom webhook secret is configured, incoming requests are verified with HMAC-SHA256 (with a 5-minute timestamp window and constant-time comparison).
- Slack Workflow trigger URLs are validated to ensure they point to `https://hooks.slack.com`.

For more detail, see [SECURITY.md](SECURITY.md).

## License

MIT
