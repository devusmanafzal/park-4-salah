create table public.prayer_reservations (
  id uuid primary key default gen_random_uuid(),
  slot_id text not null check (slot_id ~ '^[A-Za-z0-9_-]{1,30}$'),
  prayer_date date not null,
  prayer_id text not null check (prayer_id in ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha')),
  reserver_user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  reserver_name text not null check (char_length(trim(reserver_name)) between 2 and 80),
  reserver_phone text not null check (char_length(trim(reserver_phone)) between 7 and 30),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create unique index prayer_reservations_active_slot
  on public.prayer_reservations (slot_id, prayer_date, prayer_id)
  where active;

create unique index prayer_reservations_one_per_member
  on public.prayer_reservations (reserver_user_id, prayer_date, prayer_id)
  where active;

alter table public.prayer_reservations enable row level security;

revoke all on public.prayer_reservations from anon, authenticated;

drop policy if exists "Anyone can view reservations" on public.reservations;

create or replace function public.today_at_masjid()
returns date
language sql
stable
set search_path = public
as $$
  select (now() at time zone 'Europe/Stockholm')::date
$$;

create or replace function public.get_prayer_availability(p_prayer_id text)
returns table (slot_id text, is_mine boolean, reservation_id uuid)
language sql
security definer
set search_path = public
as $$
  select
    reservation.slot_id,
    reservation.reserver_user_id = auth.uid() as is_mine,
    case when reservation.reserver_user_id = auth.uid() then reservation.id else null end as reservation_id
  from public.prayer_reservations reservation
  where reservation.prayer_date = public.today_at_masjid()
    and reservation.prayer_id = p_prayer_id
    and reservation.active
    and p_prayer_id in ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha')
$$;

create or replace function public.reserve_prayer_slot(
  p_slot_id text,
  p_prayer_id text,
  p_reserver_name text,
  p_reserver_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  reservation_id uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;
  if p_slot_id !~ '^[A-Za-z0-9_-]{1,30}$' then
    raise exception using errcode = 'P0001', message = 'INVALID_SLOT';
  end if;
  if p_prayer_id not in ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha') then
    raise exception using errcode = 'P0001', message = 'INVALID_PRAYER';
  end if;
  if char_length(trim(p_reserver_name)) not between 2 and 80 then
    raise exception using errcode = 'P0001', message = 'INVALID_NAME';
  end if;
  if char_length(regexp_replace(p_reserver_phone, '[^0-9+]', '', 'g')) not between 7 and 20 then
    raise exception using errcode = 'P0001', message = 'INVALID_PHONE';
  end if;

  insert into public.prayer_reservations (
    slot_id, prayer_date, prayer_id, reserver_user_id, reserver_name, reserver_phone
  ) values (
    p_slot_id,
    public.today_at_masjid(),
    p_prayer_id,
    auth.uid(),
    trim(p_reserver_name),
    trim(p_reserver_phone)
  )
  returning id into reservation_id;

  return reservation_id;
exception
  when unique_violation then
    if exists (
      select 1 from public.prayer_reservations
      where reserver_user_id = auth.uid()
        and prayer_date = public.today_at_masjid()
        and prayer_id = p_prayer_id
        and active
    ) then
      raise exception using errcode = 'P0001', message = 'ALREADY_BOOKED_PRAYER';
    end if;
    raise exception using errcode = 'P0001', message = 'SLOT_TAKEN';
end;
$$;

create or replace function public.cancel_prayer_reservation(p_reservation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_count integer;
begin
  update public.prayer_reservations
  set active = false, cancelled_at = now()
  where id = p_reservation_id
    and reserver_user_id = auth.uid()
    and active;

  get diagnostics changed_count = row_count;
  return changed_count = 1;
end;
$$;

revoke execute on function public.today_at_masjid() from public;
revoke execute on function public.get_prayer_availability(text) from public;
revoke execute on function public.reserve_prayer_slot(text, text, text, text) from public;
revoke execute on function public.cancel_prayer_reservation(uuid) from public;

grant execute on function public.today_at_masjid() to anon, authenticated;
grant execute on function public.get_prayer_availability(text) to anon, authenticated;
grant execute on function public.reserve_prayer_slot(text, text, text, text) to authenticated;
grant execute on function public.cancel_prayer_reservation(uuid) to authenticated;
