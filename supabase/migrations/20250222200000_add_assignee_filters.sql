-- Optional filters: only send action items assigned to this email and/or name (OR logic)
alter table public.connections
  add column if not exists assignee_email_filter text,
  add column if not exists assignee_name_filter text;
