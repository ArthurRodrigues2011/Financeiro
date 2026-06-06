create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('fixed', 'variable', 'loan', 'income')),
  color text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists financial_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  description text,
  amount numeric(14, 2) not null check (amount >= 0),
  type text not null check (type in ('income', 'fixed', 'variable', 'loan')),
  due_date date not null,
  paid_date date,
  status text not null check (status in ('paid', 'pending')),
  recurrence text not null default 'none',
  tags text[] not null default '{}',
  attachments jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  lender text,
  installment_amount numeric(14, 2) not null check (installment_amount >= 0),
  total_installments integer not null check (total_installments > 0),
  paid_installments integer not null default 0 check (paid_installments >= 0),
  first_due_date date not null,
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount >= 0),
  current_amount numeric(14, 2) not null check (current_amount >= 0),
  target_date date,
  color text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  entity text not null,
  action text not null,
  label text not null,
  created_at timestamptz not null default now()
);

create index if not exists records_user_due_idx on financial_records(user_id, due_date);
create index if not exists categories_user_kind_idx on categories(user_id, kind);
create index if not exists loans_user_idx on loans(user_id);
create index if not exists goals_user_idx on goals(user_id);
