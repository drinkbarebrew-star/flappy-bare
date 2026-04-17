-- ============================================================
-- Flappy Bare v3 — RPC Functions
-- ============================================================

-- Atomically increment runs_today for a user.
-- Called server-side after every completed run (valid or not) to
-- prevent quota bypass via invalid-run submissions.
create or replace function public.increment_runs_today(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set runs_today = runs_today + 1,
      updated_at = now()
  where id = p_user_id;
end;
$$;

-- Atomically increment bonus_runs for a user.
-- Called when a referral is claimed so the referrer gets extra plays.
create or replace function public.increment_bonus_runs(p_user_id uuid, p_amount int)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set bonus_runs = bonus_runs + p_amount,
      updated_at = now()
  where id = p_user_id;
end;
$$;
