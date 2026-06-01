-- Add team_prices to the Supabase realtime publication so all clients
-- receive price change events without needing a manual refetch.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'team_prices'
  ) then
    alter publication supabase_realtime add table public.team_prices;
  end if;
end $$;
