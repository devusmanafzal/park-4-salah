-- Parking slots
create table public.parking_slots (
  id uuid primary key default gen_random_uuid(),
  slot_code text not null unique,
  owner_name text not null,
  description text,
  picture_url text,
  status text not null default 'available' check (status in ('available','reserved','unavailable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parking_slots enable row level security;

create policy "Anyone can view slots" on public.parking_slots for select using (true);
create policy "Anyone can insert slots" on public.parking_slots for insert with check (true);
create policy "Anyone can update slots" on public.parking_slots for update using (true);
create policy "Anyone can delete slots" on public.parking_slots for delete using (true);

-- Reservations
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.parking_slots(id) on delete cascade,
  reserver_name text not null,
  reserved_at timestamptz not null default now(),
  expires_at timestamptz not null,
  active boolean not null default true
);

alter table public.reservations enable row level security;

create policy "Anyone can view reservations" on public.reservations for select using (true);
create policy "Anyone can insert reservations" on public.reservations for insert with check (true);
create policy "Anyone can update reservations" on public.reservations for update using (true);

-- Trigger to keep slot status in sync
create or replace function public.sync_slot_status_on_reserve()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.active then
    update public.parking_slots set status = 'reserved', updated_at = now() where id = new.slot_id;
  end if;
  return new;
end;
$$;

create trigger trg_reservation_insert
after insert on public.reservations
for each row execute function public.sync_slot_status_on_reserve();

create or replace function public.release_slot_on_cancel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.active = true and new.active = false then
    update public.parking_slots set status = 'available', updated_at = now() where id = new.slot_id;
  end if;
  return new;
end;
$$;

create trigger trg_reservation_release
after update on public.reservations
for each row execute function public.release_slot_on_cancel();

-- Storage bucket for slot pictures
insert into storage.buckets (id, name, public) values ('slot-pictures', 'slot-pictures', true);

create policy "Public read slot pictures" on storage.objects for select using (bucket_id = 'slot-pictures');
create policy "Anyone can upload slot pictures" on storage.objects for insert with check (bucket_id = 'slot-pictures');