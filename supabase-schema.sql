create table if not exists public.accounts (
  id text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.dividends (
  id text primary key,
  account text not null references public.accounts(id),
  stock text not null,
  shares numeric not null check (shares > 0),
  date date not null,
  amount integer not null,
  created_at timestamptz not null default now()
);

create index if not exists dividends_date_idx on public.dividends(date);
create index if not exists dividends_account_idx on public.dividends(account);
create index if not exists dividends_stock_idx on public.dividends(stock);

alter table public.accounts enable row level security;
alter table public.dividends enable row level security;

-- This app currently uses the server-side Supabase service role key.
-- Do not expose the service role key in browser code.
