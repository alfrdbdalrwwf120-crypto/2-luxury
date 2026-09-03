-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor قبل تشغيل البوت.
-- Project → SQL Editor → New query → الصق المحتوى → Run

create table if not exists services (
  key text primary key,
  emoji text not null,
  name text not null,
  min_price integer not null,
  max_price integer not null,
  per_page boolean not null default false,
  needs_size boolean not null default false,
  size_options text[] default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id bigint generated always as identity primary key,
  order_number integer not null,
  telegram_user_id bigint not null,
  customer_name text,
  username text,
  service_key text not null references services(key),
  project_name text,
  project_field text,
  idea_description text,
  wants_colors boolean,
  colors_text text,
  has_references boolean,
  usage_notes text,
  size_choice text,
  custom_size text,
  price_min integer not null,
  price_max integer not null,
  final_price integer,
  status text not null default 'pend;ing',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists orders_order_number_idx on orders(order_number);
create index if not exists orders_telegram_user_id_idx on orders(telegram_user_id);
create index if not exists orders_status_idx on orders(status);

create table if not exists order_counters (
  id integer primary key default 1,
  last_order_number integer not null default 1000
);

insert into order_counters (id, last_order_number)
values (1, 1000)
on conflict (id) do nothing;

-- drafts: keeps in-progress order wizard state so a user can resume later
create table if not exists order_drafts (
  telegram_user_id bigint primary key,
  draft jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function next_order_number()
returns integer
language plpgsql
as $$
declare
  new_number integer;
begin
  update order_counters
  set last_order_number = last_order_number + 1
  where id = 1
  returning last_order_number into new_number;
  return new_number;
end;
$$;
