-- ============================================================
-- iGotUp Growth Platform · Supabase Schema (PostgreSQL)
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---------- 1) PERFIS / USUÁRIOS (todos os módulos) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  layer text not null default 'cliente',      -- C1..C5 (padrão: cliente)
  role text,
  partner_id text,
  -- campos obrigatórios de cadastro
  loja text,               -- loja que fez a compra
  whats text,              -- whatsapp
  cpf text,                -- CPF
  slug text unique,
  cupom text unique,
  xp integer default 0,
  nivel text default 'Bronze',
  mps integer default 0,
  avatar_url text,
  created_at timestamptz default now()
);

-- ---------- 1b) LOJAS (referência para cadastro) ----------
create table if not exists public.lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  cidade text,
  estado text,
  ativa boolean default true,
  created_at timestamptz default now()
);

-- ---------- 2) PARCEIROS (referral + DIC) ----------
create table if not exists public.parceiros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text,
  estado text,
  regiao text,
  receita numeric default 0,
  conversoes integer default 0,
  xp integer default 0,
  status text default 'ativo',
  created_at timestamptz default now()
);

-- ---------- 3) INDICAÇÕES (referral) ----------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  indicador_id uuid references public.profiles (id) on delete cascade,
  nome_convidado text,
  contato text,
  tipo text default 'cliente',           -- cliente | revendedor
  status text default 'pendente',        -- pendente | aprovado | premiado
  valor_compra numeric,
  recompensa numeric default 0,
  cupom text,
  created_at timestamptz default now()
);

-- ---------- 4) CARTEIRA / WALLET (referral) ----------
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade unique,
  saldo numeric default 0,
  updated_at timestamptz default now()
);

create table if not exists public.wallet_movements (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references public.wallets (id) on delete cascade,
  tipo text,                             -- crédito | débito | bônus | resgate
  descricao text,
  valor numeric default 0,
  ref_referral uuid,
  created_at timestamptz default now()
);

-- ---------- 5) GAMIFICAÇÃO ----------
create table if not exists public.gamificacao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  xp integer default 0,
  level integer default 1,
  temporada text,
  conquistas text[] default '{}',
  updated_at timestamptz default now()
);

-- ---------- 6) MPS · MARKETING GROWTH HUB ----------
create table if not exists public.mps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade unique,
  score integer default 0,
  alcance bigint default 0,
  leads integer default 0,
  conversoes integer default 0,
  receita numeric default 0,
  updated_at timestamptz default now()
);

-- ---------- 7) CONTEÚDO / CAMPANHAS (MGH) ----------
create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text,
  periodo text,
  alcance bigint default 0,
  conversoes integer default 0,
  roi numeric default 0,
  materiais text[] default '{}',
  hashtags text[] default '{}',
  cta text,
  created_at timestamptz default now()
);

-- ---------- 8) CAMPANHAS CRIADAS (admin) ----------
create table if not exists public.campanhas_criadas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text,
  criado_por uuid references public.profiles (id),
  tenant text,
  created_at timestamptz default now()
);

-- ---------- 9) DIC · MÉTRICAS / KPI (executivo) ----------
create table if not exists public.metricas (
  id uuid primary key default gen_random_uuid(),
  data date default current_date,
  receita numeric default 0,
  cac numeric default 0,
  ltv numeric default 0,
  roi numeric default 0,
  indicacoes integer default 0,
  conversoes integer default 0,
  nps integer default 0,
  viral_k numeric default 0,
  created_at timestamptz default now()
);

-- ---------- 10) AUDITORIA ----------
create table if not exists public.auditoria (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  actor_layer text,
  acao text,
  tenant text,
  payload jsonb,
  created_at timestamptz default now()
);

-- ---------- TRIGGER: criar wallet quando perfil é criado ----------
create or replace function public.handle_new_profile()
returns trigger language plpgsql security definer as $$
begin
  insert into public.wallets (user_id, saldo) values (new.id, 0);
  insert into public.gamificacao (user_id) values (new.id);
  insert into public.mps (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();

-- ---------- RLS (segurança básica) ----------
alter table public.profiles enable row level security;
alter table public.referrals enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_movements enable row level security;
alter table public.gamificacao enable row level security;
alter table public.mps enable row level security;

-- usuários podem ver e editar o próprio perfil
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id);

-- usuários veem as próprias indicações
drop policy if exists "own referrals" on public.referrals;
create policy "own referrals" on public.referrals
  for all using (auth.uid() = indicador_id);

-- usuários veem a própria carteira
drop policy if exists "own wallet" on public.wallets;
create policy "own wallet" on public.wallets
  for all using (auth.uid() = user_id);

-- auditoria: somente leitura para autenticados (escrita via backend)
drop policy if exists "read audit" on public.auditoria;
create policy "read audit" on public.auditoria
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- REGRA DE NEGÓCIO: ACL DE CAMADA (ADM MASTER)
-- Apenas o email jhonercp@gmail.com pode alterar a camada (layer)
-- para qualquer valor. Demais usuários ficam travados em 'cliente'.
-- ============================================================
create or replace function public.can_set_layer()
returns boolean language sql stable security definer as $$
  select coalesce((select email from auth.users where id = auth.uid()), '') = 'jhonercp@gmail.com';
$$;

-- Usuários comuns: SÓ podem manter layer = 'cliente' (não alteram camada)
drop policy if exists "non_admin fixed client layer" on public.profiles;
create policy "non_admin fixed client layer" on public.profiles
  for update
  using (auth.uid() = id AND public.can_set_layer() = false AND coalesce(layer,'cliente') = 'cliente')
  with check (auth.uid() = id AND public.can_set_layer() = false AND layer = 'cliente');

-- ADM Master: pode alterar a própria camada livremente
drop policy if exists "admin full layer" on public.profiles;
create policy "admin full layer" on public.profiles
  for update
  using (auth.uid() = id AND public.can_set_layer() = true)
  with check (auth.uid() = id AND public.can_set_layer() = true);

-- Somente o ADM Master pode CRIAR perfis de qualquer camada;
-- os demais são criados via trigger/backend sempre como 'cliente'
drop policy if exists "only admin creates profiles" on public.profiles;
create policy "only admin creates profiles" on public.profiles
  for insert
  with check (public.can_set_layer() = true OR layer = 'cliente');

-- ---------- TRIGGER: garantir cadastro completo (campos obrigatórios) ----------
create or replace function public.validate_required_profile()
returns trigger language plpgsql security definer as $$
begin
  if new.loja is null or new.loja = '' then
    raise exception 'Campo obrigatório: loja';
  end if;
  if new.whats is null or new.whats = '' then
    raise exception 'Campo obrigatório: WhatsApp';
  end if;
  if new.cpf is null or new.cpf = '' then
    raise exception 'Campo obrigatório: CPF';
  end if;
  if new.full_name is null or new.full_name = '' then
    raise exception 'Campo obrigatório: nome completo';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_required_profile_trg on public.profiles;
create trigger validate_required_profile_trg
  before insert or update on public.profiles
  for each row execute procedure public.validate_required_profile();
