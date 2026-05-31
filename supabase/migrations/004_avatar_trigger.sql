-- Migration 004: Avatar im handle_new_user Trigger
create or replace function handle_new_user()
returns trigger as $$
declare
  user_count integer;
  user_name  text;
  user_avatar text;
begin
  select count(*) into user_count from public.profiles;

  user_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Spieler'
  );

  user_avatar := coalesce(
    new.raw_user_meta_data->>'avatar',
    '🦁'
  );

  begin
    insert into public.profiles (id, name, avatar, is_admin)
    values (new.id, user_name, user_avatar, user_count = 0);
  exception when others then
    raise warning 'Profile creation failed: %', sqlerrm;
  end;

  return new;
end;
$$ language plpgsql security definer;
