create table price_updates (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  old_phase text,
  new_phase text not null,
  old_price numeric,
  new_price numeric not null,
  changed_by uuid references profiles(id),
  created_at timestamptz default now()
);

create index idx_price_updates_created on price_updates(created_at desc);
create index idx_price_updates_team on price_updates(team_name);

alter table price_updates enable row level security;

-- All authenticated users can read the price update log
create policy "authenticated users can read price updates" on price_updates
  for select using (auth.uid() is not null);

-- Only admins can insert (enforced via SECURITY DEFINER function or direct insert from admin UI)
create policy "admins can insert price updates" on price_updates
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

alter publication supabase_realtime add table price_updates;
