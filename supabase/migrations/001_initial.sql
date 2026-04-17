-- ============================================================
-- Flappy Bare v3 — Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── PROFILES ────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  username      text unique,
  avatar_url    text,
  -- Run quota
  runs_today    int not null default 0,
  bonus_runs    int not null default 0,
  runs_reset_at timestamptz not null default now(),
  -- Social flags
  ig_story_bonus_used_today boolean not null default false,
  ig_story_reset_at         timestamptz not null default now(),
  ig_follow_bonus_claimed   boolean not null default false,
  -- Klaviyo
  klaviyo_id    text,
  -- Meta
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── GAME SESSIONS ───────────────────────────────────────────
create table public.game_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade,
  score         int not null default 0,
  coins_earned  int not null default 0,
  duration_ms   int not null default 0,
  run_type      text not null default 'daily' check (run_type in ('daily', 'bonus_story', 'bonus_follow', 'bonus_referral')),
  -- Anti-cheat
  anti_cheat_hash text,
  client_seed   text,
  pipe_timestamps jsonb,
  -- Flags
  is_valid      boolean not null default true,
  invalidation_reason text,
  created_at    timestamptz not null default now()
);

-- ─── COIN LEDGER (FIFO, 90-day expiry) ───────────────────────
create table public.coin_ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  amount        int not null,
  type          text not null check (type in ('earn', 'spend', 'expire')),
  description   text,
  expires_at    timestamptz,
  session_id    uuid references public.game_sessions(id),
  created_at    timestamptz not null default now()
);

-- ─── BUCKS LEDGER ────────────────────────────────────────────
create table public.bucks_ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  amount        numeric(10,2) not null,
  type          text not null check (type in ('convert', 'redeem', 'expire', 'refund')),
  description   text,
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- ─── REDEMPTIONS ─────────────────────────────────────────────
create table public.redemptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  reward_tier           int not null check (reward_tier in (10, 20, 30, 50, 80, 150, 300)),
  bucks_spent           numeric(10,2) not null,
  status                text not null default 'pending' check (status in ('pending', 'processing', 'fulfilled', 'cancelled', 'overflow_requested')),
  shopify_discount_code text,
  shopify_order_id      text,
  notes                 text,
  created_at            timestamptz not null default now(),
  fulfilled_at          timestamptz
);

-- ─── REFERRALS ───────────────────────────────────────────────
create table public.referrals (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references public.profiles(id) on delete cascade,
  referee_id    uuid not null references public.profiles(id) on delete cascade,
  code          text not null unique,
  qualified     boolean not null default false,
  qualified_at  timestamptz,
  bonus_granted boolean not null default false,
  created_at    timestamptz not null default now(),
  unique(referrer_id, referee_id)
);

-- ─── LEADERBOARD (materialized view) ─────────────────────────
create table public.leaderboard (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  username      text not null,
  all_time_best int not null default 0,
  weekly_best   int not null default 0,
  weekly_reset_at timestamptz not null default date_trunc('week', now()),
  total_coins   int not null default 0,
  updated_at    timestamptz not null default now()
);

-- ─── VIEWS ───────────────────────────────────────────────────

-- Coin balance per user (accounting for expiry)
create or replace view public.coin_balances as
select
  user_id,
  coalesce(sum(amount) filter (where type = 'earn' and (expires_at is null or expires_at > now())), 0)
  - coalesce(sum(abs(amount)) filter (where type = 'spend'), 0) as balance
from public.coin_ledger
group by user_id;

-- Bucks balance per user
create or replace view public.bucks_balances as
select
  user_id,
  coalesce(sum(amount) filter (where type in ('convert', 'refund') and (expires_at is null or expires_at > now())), 0)
  - coalesce(sum(abs(amount)) filter (where type = 'redeem'), 0) as balance
from public.bucks_ledger
group by user_id;

-- Monthly redemption totals (30-day rolling)
create or replace view public.monthly_redemptions as
select
  user_id,
  coalesce(sum(abs(amount)), 0) as bucks_redeemed_30d
from public.bucks_ledger
where type = 'redeem'
  and created_at > now() - interval '30 days'
group by user_id;

-- ─── FUNCTIONS ───────────────────────────────────────────────

-- Handle new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1)
  );
  insert into public.leaderboard (user_id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Expire coins older than 90 days (run via cron or on-demand)
create or replace function public.expire_coins()
returns void language plpgsql security definer as $$
begin
  -- Mark expired earn entries
  update public.coin_ledger
  set type = 'expire'
  where type = 'earn'
    and expires_at is not null
    and expires_at < now();
end;
$$;

-- Get available runs for a user (resets daily)
create or replace function public.get_available_runs(p_user_id uuid)
returns int language plpgsql security definer as $$
declare
  v_profile public.profiles%rowtype;
  v_base_runs int := 5;
  v_total int;
begin
  select * into v_profile from public.profiles where id = p_user_id;

  -- Reset daily runs if needed
  if v_profile.runs_reset_at < date_trunc('day', now()) then
    update public.profiles
    set runs_today = 0,
        ig_story_bonus_used_today = false,
        runs_reset_at = now()
    where id = p_user_id;
    v_profile.runs_today := 0;
  end if;

  v_total := v_base_runs + v_profile.bonus_runs - v_profile.runs_today;
  return greatest(v_total, 0);
end;
$$;

-- ─── RLS POLICIES ────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.game_sessions enable row level security;
alter table public.coin_ledger enable row level security;
alter table public.bucks_ledger enable row level security;
alter table public.redemptions enable row level security;
alter table public.referrals enable row level security;
alter table public.leaderboard enable row level security;

-- Profiles: users can read/update their own
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id);

-- Game sessions: users can read their own, insert their own
create policy "sessions_self" on public.game_sessions
  for select using (auth.uid() = user_id);
create policy "sessions_insert" on public.game_sessions
  for insert with check (auth.uid() = user_id);

-- Coin ledger: users can read their own
create policy "coins_self" on public.coin_ledger
  for select using (auth.uid() = user_id);

-- Bucks ledger: users can read their own
create policy "bucks_self" on public.bucks_ledger
  for select using (auth.uid() = user_id);

-- Redemptions: users can read their own
create policy "redemptions_self" on public.redemptions
  for select using (auth.uid() = user_id);

-- Leaderboard: anyone can read
create policy "leaderboard_read" on public.leaderboard
  for select using (true);
create policy "leaderboard_self" on public.leaderboard
  for update using (auth.uid() = user_id);

-- Referrals: users can read their own
create policy "referrals_self" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referee_id);

-- ─── INDEXES ─────────────────────────────────────────────────
create index idx_game_sessions_user_id on public.game_sessions(user_id);
create index idx_game_sessions_created_at on public.game_sessions(created_at desc);
create index idx_coin_ledger_user_id on public.coin_ledger(user_id);
create index idx_coin_ledger_expires_at on public.coin_ledger(expires_at);
create index idx_bucks_ledger_user_id on public.bucks_ledger(user_id);
create index idx_leaderboard_all_time on public.leaderboard(all_time_best desc);
create index idx_leaderboard_weekly on public.leaderboard(weekly_best desc);
create index idx_referrals_code on public.referrals(code);
