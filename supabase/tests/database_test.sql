-- Database tests: profile trigger, constraints and row-level security.
-- Runs in a transaction and rolls back, so it is safe against the dev project.
-- Run with:  npx supabase test db --linked     (see supabase/README.md)

begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

-- Collect TAP lines and print them once at the end: `supabase db query` only
-- returns the last result set, and this keeps the output valid TAP for
-- `supabase test db` as well.
create temp table tap_output (n serial, line text);
grant insert on tap_output to authenticated;
grant usage on sequence tap_output_n_seq to authenticated;

insert into tap_output (line) select plan(16);

-- Two users, created the way Supabase Auth would (triggers fire).
insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-00000000000a', 'a@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.com', 'authenticated', 'authenticated');

-- 3.3: new users get a profile with default preferences ----------------------

insert into tap_output (line) select results_eq(
  $$ select email, remind_days, notify_push, notify_in_app, notify_email
       from profiles where id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values ('a@example.com'::text, '{3,1}'::smallint[], true, true, true) $$,
  'new user gets a profile with default reminder preferences'
);

-- 3.2: constraints ------------------------------------------------------------

insert into tap_output (line) select throws_ok(
  $$ insert into subscriptions (user_id, name, amount_cents, currency, cycle_unit, cycle_count, start_date)
     values ('00000000-0000-0000-0000-00000000000a', 'X', 100, 'USD', 'month', 1, '2026-01-01') $$,
  '23514', null, 'currency other than AUD is rejected'
);

insert into tap_output (line) select throws_ok(
  $$ insert into subscriptions (user_id, name, amount_cents, cycle_unit, cycle_count, start_date)
     values ('00000000-0000-0000-0000-00000000000a', 'X', 100, 'month', 13, '2026-01-01') $$,
  '23514', null, 'cycle_count 13 is rejected'
);

insert into tap_output (line) select throws_ok(
  $$ insert into subscriptions (user_id, name, amount_cents, cycle_unit, cycle_count, start_date)
     values ('00000000-0000-0000-0000-00000000000a', 'X', 10000000, 'month', 1, '2026-01-01') $$,
  '23514', null, 'amount over $99,999.99 is rejected'
);

insert into tap_output (line) select throws_ok(
  $$ insert into subscriptions (user_id, name, amount_cents, cycle_unit, cycle_count, start_date, trial_ends_on)
     values ('00000000-0000-0000-0000-00000000000a', 'X', 100, 'month', 1, '2026-03-05', '2026-03-01') $$,
  '23514', null, 'trial ending before the start date is rejected'
);

insert into tap_output (line) select throws_ok(
  $$ update profiles set remind_days = '{7,3,1,0}' where id = '00000000-0000-0000-0000-00000000000a' $$,
  '23514', null, 'more than 3 reminder days is rejected'
);

insert into tap_output (line) select throws_ok(
  $$ update profiles set remind_days = '{3,3}' where id = '00000000-0000-0000-0000-00000000000a' $$,
  '23514', null, 'duplicate reminder days are rejected'
);

insert into tap_output (line) select throws_ok(
  $$ update profiles set timezone = 'Mars/Olympus' where id = '00000000-0000-0000-0000-00000000000a' $$,
  '23514', null, 'unknown timezone is rejected'
);

-- Seed one subscription for each user.
insert into subscriptions (id, user_id, name, amount_cents, cycle_unit, cycle_count, start_date)
values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'Netflix', 1549, 'month', 1, '2026-01-12'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'Spotify', 1399, 'month', 1, '2026-03-05');

-- 3.4: row-level security, acting as user A -----------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

insert into tap_output (line) select results_eq(
  $$ select name from subscriptions $$,
  $$ values ('Netflix'::text) $$,
  'user A only sees their own subscriptions'
);

insert into tap_output (line) select results_eq(
  $$ select count(*)::int from profiles $$,
  $$ values (1) $$,
  'user A only sees their own profile'
);

insert into tap_output (line) select is_empty(
  $$ update subscriptions set amount_cents = 1 where id = '10000000-0000-0000-0000-00000000000b' returning id $$,
  'user A cannot update user B''s subscription'
);

insert into tap_output (line) select is_empty(
  $$ delete from subscriptions where id = '10000000-0000-0000-0000-00000000000b' returning id $$,
  'user A cannot delete user B''s subscription'
);

insert into tap_output (line) select throws_ok(
  $$ insert into subscriptions (user_id, name, amount_cents, cycle_unit, cycle_count, start_date)
     values ('00000000-0000-0000-0000-00000000000b', 'Sneaky', 100, 'month', 1, '2026-01-01') $$,
  '42501', null, 'user A cannot add a subscription for user B'
);

insert into tap_output (line) select lives_ok(
  $$ insert into subscriptions (name, amount_cents, cycle_unit, cycle_count, start_date)
     values ('Stan', 1200, 'month', 1, '2026-02-01') $$,
  'user A can add their own subscription (user_id defaults to them)'
);

insert into tap_output (line) select throws_ok(
  $$ update profiles set email = 'evil@example.com' where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501', null, 'user A cannot change their profile email'
);

insert into tap_output (line) select throws_ok(
  $$ select * from email_reminder_log $$,
  '42501', null, 'clients cannot read the email reminder log'
);

reset role;
insert into tap_output (line) select * from finish();
select line from tap_output order by n;

rollback;
