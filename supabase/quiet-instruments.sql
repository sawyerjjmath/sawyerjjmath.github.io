-- The Quiet Instruments (Puzzle 2, November 2026)
-- Server side for sign-in, seal limits and the leaderboard.
--
-- Run this whole file in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It is safe to run again; it recreates the functions and leaves stored progress alone.
--
-- This file holds no answers and no hidden content: those are loaded separately from a
-- private seed file that is never committed (see README.md). Answers, hidden content and
-- progress live in the private schema "qi_private", which the browser cannot read. The page
-- talks to the database only through the functions marked "the page calls" below.

create schema if not exists qi_private;
revoke all on schema qi_private from public, anon, authenticated;

-- ---------------------------------------------------------------- tables

create table if not exists qi_private.answers (
  instrument text primary key,
  ord        int  not null unique,
  answer     text not null,
  max_seals  int  not null check (max_seals > 0)
);

-- one row per signed-in email
create table if not exists qi_private.progress (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  started_at   timestamptz not null default now(),
  sealed       jsonb not null default '{}'::jsonb,   -- {"I": "2005", ...}
  used         jsonb not null default '{}'::jsonb,   -- {"I": 2, ...} seal attempts spent
  solved_at    timestamptz,
  display_name text check (display_name is null or char_length(display_name) between 1 and 24)
);

-- every seal attempt, for your own records
create table if not exists qi_private.guesses (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  instrument text not null,
  guess      text not null,
  correct    boolean not null,
  at         timestamptz not null default now()
);

-- the fifth instrument: stages are served one at a time, only to players who solved I–IV
create table if not exists qi_private.v_stages (
  stage     int  primary key check (stage > 0),
  title     text not null,
  body      jsonb not null,                                   -- what the page shows
  kind      text not null check (kind in ('move', 'fraction', 'integer')),
  answer    text not null,
  max_seals int  not null check (max_seals > 0)
);

alter table qi_private.progress add column if not exists v_sealed   jsonb not null default '{}'::jsonb;
alter table qi_private.progress add column if not exists v_used     jsonb not null default '{}'::jsonb;
alter table qi_private.progress add column if not exists crowned_at timestamptz;

revoke all on all tables in schema qi_private from public, anon, authenticated;

-- ---------------------------------------------------------------- helpers

create or replace function qi_private.state_for(uid uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'sealed',       coalesce(p.sealed, '{}'::jsonb),
    'remaining',    (select jsonb_object_agg(a.instrument,
                       a.max_seals - coalesce((p.used ->> a.instrument)::int, 0))
                     from qi_private.answers a),
    'limits',       (select jsonb_object_agg(a.instrument, a.max_seals) from qi_private.answers a),
    'solved_at',    p.solved_at,
    'display_name', p.display_name
  )
  from (select 1) as one
  left join qi_private.progress p on p.user_id = uid;
$$;

-- canonical form of a guess, or null if it is not a well-formed answer
create or replace function qi_private.normalize(p_instrument text, p_guess text)
returns text
language plpgsql immutable set search_path = ''
as $$
declare g text;
begin
  if p_guess is null or char_length(p_guess) > 100 then return null; end if;
  g := replace(regexp_replace(p_guess, '\s', '', 'g'), '−', '-');
  if p_instrument = 'IV' then
    if g !~ '^[01]+$' then return null; end if;
    g := ltrim(g, '0');
    return case when g = '' then '0' else g end;
  end if;
  if g !~ '^[+-]?[0-9]{1,30}$' then return null; end if;
  return (g::numeric)::text;
end;
$$;

-- ---------------------------------------------------------------- functions the page calls

-- current player's state; also records when they first opened the puzzle
create or replace function public.qi_state()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  insert into qi_private.progress (user_id) values (uid) on conflict do nothing;
  return qi_private.state_for(uid);
end;
$$;

-- one seal attempt; returns the new state plus "result":
--   sealed | wrong | exhausted | already | out_of_order | malformed
create or replace function public.qi_seal(p_instrument text, p_guess text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  uid  uuid := auth.uid();
  a    qi_private.answers;
  p    qi_private.progress;
  prev text;
  n    int;
  g    text;
  ok   boolean;
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;

  select * into a from qi_private.answers where instrument = p_instrument;
  if not found then raise exception 'no such instrument' using errcode = '22023'; end if;

  insert into qi_private.progress (user_id) values (uid) on conflict do nothing;
  select * into p from qi_private.progress where user_id = uid for update;  -- serialises attempts

  select instrument into prev from qi_private.answers where ord = a.ord - 1;
  if prev is not null and not (p.sealed ? prev) then
    return qi_private.state_for(uid) || '{"result":"out_of_order"}';
  end if;
  if p.sealed ? p_instrument then
    return qi_private.state_for(uid) || '{"result":"already"}';
  end if;

  n := coalesce((p.used ->> p_instrument)::int, 0);
  if n >= a.max_seals then
    return qi_private.state_for(uid) || '{"result":"exhausted"}';
  end if;

  g := qi_private.normalize(p_instrument, p_guess);
  if g is null then
    -- a malformed entry does not spend an attempt
    return qi_private.state_for(uid) || '{"result":"malformed"}';
  end if;

  ok := (g = a.answer);
  update qi_private.progress set
    used      = used || jsonb_build_object(p_instrument, n + 1),
    sealed    = case when ok then sealed || jsonb_build_object(p_instrument, g) else sealed end,
    solved_at = case when ok and p_instrument = 'IV' then now() else solved_at end
  where user_id = uid;

  insert into qi_private.guesses (user_id, instrument, guess, correct) values (uid, p_instrument, g, ok);

  return qi_private.state_for(uid)
      || jsonb_build_object('result', case when ok then 'sealed' else 'wrong' end);
end;
$$;

-- solvers choose the name shown on the leaderboard (never their email)
create or replace function public.qi_set_name(p_name text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare uid uuid := auth.uid(); nm text := btrim(p_name);
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  if nm is null or char_length(nm) not between 1 and 24 or nm !~ '^[[:alnum:] ._''-]+$' then
    raise exception 'names are 1–24 letters, numbers, spaces or . _ '' -' using errcode = '22023';
  end if;
  update qi_private.progress set display_name = nm where user_id = uid and solved_at is not null;
  if not found then raise exception 'only solvers can be named' using errcode = '42501'; end if;
  return qi_private.state_for(uid);
end;
$$;

-- public leaderboard: named solvers in order (crowned ones marked), plus counts
create or replace function public.qi_leaderboard()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'solvers', (select count(*) from qi_private.progress where solved_at is not null),
    'board',   coalesce((
      select jsonb_agg(jsonb_build_object('name', display_name, 'solved_at', solved_at,
                                          'crowned', crowned_at is not null) order by solved_at)
      from (select display_name, solved_at, crowned_at from qi_private.progress
            where solved_at is not null and display_name is not null
            order by solved_at limit 50) top
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------- the fifth instrument

-- canonical form of a guess for a stage kind, or null if it is not well formed
create or replace function qi_private.v_normalize(p_kind text, p_guess text)
returns text
language plpgsql immutable set search_path = ''
as $$
declare
  g text; sq text[]; m text[]; num bigint; den bigint; d bigint;
begin
  if p_guess is null or char_length(p_guess) > 60 then return null; end if;
  g := lower(replace(regexp_replace(p_guess, '[\s,_]', '', 'g'), '−', '-'));
  if p_kind = 'move' then
    select array_agg(x[1]) into sq from regexp_matches(g, '([a-h][1-8])', 'g') as x;
    if sq is null or array_length(sq, 1) <> 2 then return null; end if;
    return sq[1] || sq[2];
  elsif p_kind = 'fraction' then
    m := regexp_match(g, '^([+-]?)([0-9]{1,12})(?:/([0-9]{1,12}))?$');
    if m is null then return null; end if;
    num := m[2]::bigint;
    den := coalesce(m[3], '1')::bigint;
    if den = 0 then return null; end if;
    d := gcd(num, den);
    if d = 0 then return '0'; end if;
    num := num / d; den := den / d;
    return case when m[1] = '-' and num <> 0 then '-' else '' end
        || num::text || case when den = 1 then '' else '/' || den::text end;
  elsif p_kind = 'integer' then
    if g !~ '^[0-9]{1,15}$' then return null; end if;
    return (g::numeric)::text;
  end if;
  return null;
end;
$$;

-- the fifth instrument as this player may see it
create or replace function qi_private.v_state_for(uid uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case
    when p.solved_at is null then jsonb_build_object('open', false)
    else jsonb_build_object(
      'open',       true,
      'crowned_at', p.crowned_at,
      'stages',     coalesce((
        select jsonb_agg(jsonb_build_object(
                 'stage',     s.stage,
                 'title',     s.title,
                 'body',      s.body,
                 'kind',      s.kind,
                 'max',       s.max_seals,
                 'remaining', s.max_seals - coalesce((p.v_used ->> s.stage::text)::int, 0),
                 'sealed',    p.v_sealed ->> s.stage::text
               ) order by s.stage)
        from qi_private.v_stages s
        -- every sealed stage, plus the first unsealed one; nothing beyond it is ever sent
        where s.stage <= coalesce((select min(t.stage) from qi_private.v_stages t
                                   where not (p.v_sealed ? t.stage::text)),
                                  (select max(t.stage) from qi_private.v_stages t))
      ), '[]'::jsonb))
  end
  from qi_private.progress p
  where p.user_id = uid;
$$;

-- the page calls: state of the fifth instrument (closed until I–IV are solved)
create or replace function public.qi_v_state()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare uid uuid := auth.uid(); r jsonb;
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  r := qi_private.v_state_for(uid);
  return coalesce(r, jsonb_build_object('open', false));
end;
$$;

-- the page calls: one seal attempt on the current stage; returns the new state plus "result":
--   sealed | crowned | wrong | exhausted | closed | malformed
create or replace function public.qi_v_seal(p_guess text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  p   qi_private.progress;
  s   qi_private.v_stages;
  n   int;
  g   text;
  ok  boolean;
  fin boolean;
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;

  select * into p from qi_private.progress where user_id = uid for update;  -- serialises attempts
  if not found or p.solved_at is null then
    return jsonb_build_object('open', false, 'result', 'closed');
  end if;

  select * into s from qi_private.v_stages t where not (p.v_sealed ? t.stage::text) order by t.stage limit 1;
  if not found then
    return qi_private.v_state_for(uid) || '{"result":"crowned"}';
  end if;

  n := coalesce((p.v_used ->> s.stage::text)::int, 0);
  if n >= s.max_seals then
    return qi_private.v_state_for(uid) || '{"result":"exhausted"}';
  end if;

  g := qi_private.v_normalize(s.kind, p_guess);
  if g is null then
    return qi_private.v_state_for(uid) || '{"result":"malformed"}';   -- costs nothing
  end if;

  ok  := (g = s.answer);
  fin := ok and not exists (select 1 from qi_private.v_stages t where t.stage > s.stage);

  update qi_private.progress set
    v_used     = v_used || jsonb_build_object(s.stage::text, n + 1),
    v_sealed   = case when ok  then v_sealed || jsonb_build_object(s.stage::text, g) else v_sealed end,
    crowned_at = case when fin then now() else crowned_at end
  where user_id = uid;

  insert into qi_private.guesses (user_id, instrument, guess, correct) values (uid, 'V.' || s.stage, g, ok);

  return qi_private.v_state_for(uid)
      || jsonb_build_object('result', case when fin then 'crowned' when ok then 'sealed' else 'wrong' end);
end;
$$;

-- ---------------------------------------------------------------- permissions

revoke all on function qi_private.state_for(uuid)          from public, anon, authenticated;
revoke all on function qi_private.normalize(text, text)    from public, anon, authenticated;
revoke all on function qi_private.v_state_for(uuid)        from public, anon, authenticated;
revoke all on function qi_private.v_normalize(text, text)  from public, anon, authenticated;
revoke all on function public.qi_state()                   from public, anon;
revoke all on function public.qi_seal(text, text)          from public, anon;
revoke all on function public.qi_set_name(text)            from public, anon;
revoke all on function public.qi_v_state()                 from public, anon;
revoke all on function public.qi_v_seal(text)              from public, anon;
revoke all on function public.qi_leaderboard()             from public;

grant execute on function public.qi_state()          to authenticated;
grant execute on function public.qi_seal(text, text) to authenticated;
grant execute on function public.qi_set_name(text)   to authenticated;
grant execute on function public.qi_v_state()        to authenticated;
grant execute on function public.qi_v_seal(text)     to authenticated;
grant execute on function public.qi_leaderboard()    to anon, authenticated;
