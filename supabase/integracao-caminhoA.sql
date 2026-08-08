-- ============================================================
-- iGotUp · INTEGRAÇÃO AO MODELO EXISTENTE (Caminho A)
-- Remove as tabelas duplicadas criadas pelo schema iGotUp
-- e faz a evolução do modelo original. NÃO toca nas originais.
-- ============================================================

-- ---------- 1) REMOVER TABELAS REDUNDANTES CRIADAS PELO MEU SCHEMA ----------
-- (todas vazias — drop seguro)
drop table if exists public.referrals cascade;

-- ---------- 2) EVOLUÇÃO: vincular indicador ao login (auth) ----------
-- Adiciona user_id à tabela original `indicadores` para ligar ao auth
alter table public.indicadores
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Índice para busca por usuário
create index if not exists idx_indicadores_user_id on public.indicadores(user_id);

-- ---------- 3) RLS e políticas para o app (integração) ----------

-- INDICADORES: usuário autenticado pode ver/criar os próprios
alter table public.indicadores enable row level security;
drop policy if exists "indicador own read insert" on public.indicadores;
create policy "indicador own read insert" on public.indicadores
  for select using (auth.uid() = user_id);
drop policy if exists "indicador own insert" on public.indicadores;
create policy "indicador own insert" on public.indicadores
  for insert with check (auth.uid() = user_id OR auth.uid() is null);

-- LOJAS: autenticados podem ler (para o campo "loja que fez a compra")
alter table public.lojas enable row level security;
drop policy if exists "lojas read" on public.lojas;
create policy "lojas read" on public.lojas
  for select using (true);
-- ADM pode gerenciar lojas
drop policy if exists "lojas admin" on public.lojas;
create policy "lojas admin" on public.lojas
  for all using (auth.email() = 'jhonercp@gmail.com')
  with check (auth.email() = 'jhonercp@gmail.com');

-- INDICACOES: indicador vê/gera as próprias (via user_id do indicador)
alter table public.indicacoes enable row level security;
drop policy if exists "indicacoes own" on public.indicacoes;
create policy "indicacoes own" on public.indicacoes
  for select using (
    auth.uid() = (select user_id from public.indicadores where id = indicador_id)
  );

-- LANCAMENTOS: indicador vê os próprios
alter table public.lancamentos enable row level security;
drop policy if exists "lancamentos own" on public.lancamentos;
create policy "lancamentos own" on public.lancamentos
  for select using (
    auth.uid() = (select user_id from public.indicadores where id = indicador_id)
  );

-- EVENTOS: autenticados leem (trilha do funil)
alter table public.eventos enable row level security;
drop policy if exists "eventos read" on public.eventos;
create policy "eventos read" on public.eventos
  for select using (auth.role() = 'authenticated');
