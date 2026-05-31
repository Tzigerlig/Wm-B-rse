-- ============================================================
-- Migration 002: accept_order RPC-Funktion
--
-- Führe dieses SQL im Supabase SQL Editor aus.
--
-- Warum RPC statt direktem Client-Update:
--   Das ORDER-Update und der TRADE-Insert müssen atomar in einer
--   Transaktion passieren. SECURITY DEFINER erlaubt den Insert
--   in trades auch dann, wenn RLS den directen Client-Zugriff
--   blockieren würde.
-- ============================================================

create or replace function accept_order(p_order_id uuid, p_acceptor_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order   orders%rowtype;
  v_buyer   uuid;
  v_seller  uuid;
  v_trade   uuid;
begin
  -- Atomares Update: nur wenn status noch 'open' und nicht eigene Order
  update orders
  set
    status      = 'accepted',
    accepted_by = p_acceptor_id,
    accepted_at = now()
  where id          = p_order_id
    and status      = 'open'
    and creator_id <> p_acceptor_id
  returning * into v_order;

  if not found then
    return json_build_object(
      'success', false,
      'error',   'Order nicht mehr verfügbar oder bereits akzeptiert'
    );
  end if;

  -- Buyer / Seller je nach Order-Side
  if v_order.side = 'buy' then
    -- Creator will kaufen → Creator ist Buyer, Acceptor ist Seller
    v_buyer  := v_order.creator_id;
    v_seller := p_acceptor_id;
  else
    -- Creator will verkaufen → Creator ist Seller, Acceptor ist Buyer
    v_buyer  := p_acceptor_id;
    v_seller := v_order.creator_id;
  end if;

  -- Pending Trade anlegen
  insert into trades (
    buyer_id, seller_id, team_name, qty, price_per_unit,
    proposed_by, status, from_order_id
  ) values (
    v_buyer, v_seller, v_order.team_name, v_order.qty, v_order.price_per_unit,
    v_order.creator_id, 'pending', p_order_id
  )
  returning id into v_trade;

  return json_build_object(
    'success',  true,
    'trade_id', v_trade
  );

exception when others then
  -- Rollback passiert automatisch; Fehler zurückgeben
  return json_build_object(
    'success', false,
    'error',   sqlerrm
  );
end;
$$;

-- Ausführungsrecht für eingeloggte User
grant execute on function accept_order(uuid, uuid) to authenticated;
