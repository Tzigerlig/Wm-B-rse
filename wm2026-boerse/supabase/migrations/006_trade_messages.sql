create table trade_messages (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid references trades(id) on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  message text not null check (length(message) > 0 and length(message) <= 500),
  created_at timestamptz default now()
);

create index idx_trade_messages_trade on trade_messages(trade_id);
create index idx_trade_messages_created on trade_messages(created_at);

alter table trade_messages enable row level security;

-- Only the two parties of a trade can read or write messages
create policy "trade parties can read messages" on trade_messages
  for select using (
    exists (
      select 1 from trades t
      where t.id = trade_id
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

create policy "trade parties can insert messages" on trade_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from trades t
      where t.id = trade_id
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

alter publication supabase_realtime add table trade_messages;
