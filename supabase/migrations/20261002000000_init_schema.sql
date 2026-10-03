-- Initial schema for the subscription tracker MVP.
-- See openspec/changes/add-subscription-tracker-mvp/design.md (decision 2).
-- CHECK constraints mirror the app's form rules in src/lib/subscriptions/schema.ts.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 1-3 distinct values, each 0..30 (reminders spec, "Reminder preferences").
create function public.valid_remind_days(days smallint[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select days is not null
    and cardinality(days) between 1 and 3
    and array_position(days, null) is null
    and (select bool_and(d between 0 and 30) from unnest(days) as d)
    and (select count(distinct d) = cardinality(days) from unnest(days) as d);
$$;

create function public.valid_timezone(tz text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz);
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, holding reminder preferences
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  timezone text not null default 'Australia/Sydney'
    check (public.valid_timezone(timezone)),
  remind_days smallint[] not null default '{3,1}'
    check (public.valid_remind_days(remind_days)),
  notify_push boolean not null default true,
  notify_in_app boolean not null default true,
  notify_email boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Every new auth user gets a profile with default preferences.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  catalog_key text,
  amount_cents integer not null check (amount_cents between 0 and 9999999),
  currency char(3) not null default 'AUD' check (currency = 'AUD'),
  cycle_unit text not null check (cycle_unit in ('week', 'month', 'year')),
  cycle_count smallint not null check (cycle_count between 1 and 12),
  start_date date not null,
  trial_ends_on date check (trial_ends_on >= start_date),
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  category text check (char_length(category) <= 40),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- email_reminder_log: claims each reminder email so it is sent at most once
-- ---------------------------------------------------------------------------

create table public.email_reminder_log (
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  event_date date not null,
  days_before smallint not null,
  sent_at timestamptz not null default now(),
  primary key (subscription_id, event_date, days_before)
);

-- ---------------------------------------------------------------------------
-- Row-level security: users only ever see and change their own rows
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.email_reminder_log enable row level security; -- no policies: server only

create policy "Users read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Profiles are created by the trigger and removed by account deletion only;
-- users may change preferences and timezone, but not id or email.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (timezone, remind_days, notify_push, notify_in_app, notify_email)
  on public.profiles to authenticated;

create policy "Users read their own subscriptions"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users add their own subscriptions"
  on public.subscriptions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own subscriptions"
  on public.subscriptions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own subscriptions"
  on public.subscriptions for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.subscriptions from anon;
revoke all on public.email_reminder_log from anon, authenticated;
