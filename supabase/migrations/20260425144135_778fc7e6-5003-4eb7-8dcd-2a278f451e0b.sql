
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create or replace function public.is_locked(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select locked from public.profiles where id = _user_id), false)
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "Users view own roles" on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins view all roles" on public.user_roles for select using (public.has_role(auth.uid(),'admin'));
create policy "Admins insert roles" on public.user_roles for insert with check (public.has_role(auth.uid(),'admin'));
create policy "Admins delete roles" on public.user_roles for delete using (public.has_role(auth.uid(),'admin'));

create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins view all profiles" on public.profiles for select using (public.has_role(auth.uid(),'admin'));
create policy "Users update own display_name" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and locked = (select locked from public.profiles where id = auth.uid()));
create policy "Admins update any profile" on public.profiles for update using (public.has_role(auth.uid(),'admin'));

drop policy if exists "Anyone can insert slots" on public.parking_slots;
drop policy if exists "Anyone can update slots" on public.parking_slots;
drop policy if exists "Anyone can delete slots" on public.parking_slots;

create policy "Admins insert slots" on public.parking_slots for insert with check (public.has_role(auth.uid(),'admin'));
create policy "Admins delete slots" on public.parking_slots for delete using (public.has_role(auth.uid(),'admin'));
create policy "Admins update slots" on public.parking_slots for update using (public.has_role(auth.uid(),'admin'));

alter table public.reservations add column reserver_user_id uuid references auth.users(id) on delete set null;

drop policy if exists "Anyone can insert reservations" on public.reservations;
drop policy if exists "Anyone can update reservations" on public.reservations;

create policy "Signed-in non-locked users reserve" on public.reservations for insert
  with check (
    auth.uid() is not null
    and reserver_user_id = auth.uid()
    and not public.is_locked(auth.uid())
  );

create policy "Owner or admin updates reservation" on public.reservations for update
  using (auth.uid() = reserver_user_id or public.has_role(auth.uid(),'admin'));

drop policy if exists "Public read slot pictures" on storage.objects;
drop policy if exists "Anyone can upload slot pictures" on storage.objects;
drop policy if exists "Anyone can update slot pictures" on storage.objects;
drop policy if exists "Anyone can delete slot pictures" on storage.objects;

create policy "Public read slot pictures" on storage.objects for select using (bucket_id = 'slot-pictures');
create policy "Admins upload slot pictures" on storage.objects for insert
  with check (bucket_id = 'slot-pictures' and public.has_role(auth.uid(),'admin'));
create policy "Admins update slot pictures" on storage.objects for update
  using (bucket_id = 'slot-pictures' and public.has_role(auth.uid(),'admin'));
create policy "Admins delete slot pictures" on storage.objects for delete
  using (bucket_id = 'slot-pictures' and public.has_role(auth.uid(),'admin'));
