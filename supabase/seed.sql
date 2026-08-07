-- ============================================================
-- iGotUp · Seed das UNIDADES reais da rede (26 unidades)
-- Dados extraídos de: unidades_2026-08-07_142915.pdf
-- ============================================================
-- Limpa a lista anterior (se aplicada) antes de inserir as reais
truncate table public.lojas restart identity cascade;

insert into public.lojas (nome, cidade, estado, ativa) values
  ('Alexandro Montadora Novo Hamburgo', 'Novo Hamburgo', 'RS', true),
  ('Business Company LTDA', 'Novo Hamburgo', 'RS', true),
  ('iGotUp - Online Porto Alegre/RS', 'Porto Alegre', 'RS', true),
  ('iGotUp - Bagé/RS', 'Bagé', 'RS', true),
  ('iGotUp - Barra Porto Alegre/RS', 'Porto Alegre', 'RS', true),
  ('iGotUp - Campo Bom/RS', 'Campo Bom', 'RS', true),
  ('iGotUp - Canoas/RS Loja', 'Canoas', 'RS', true),
  ('iGotUp - Canoas/RS Quiosque', 'Canoas', 'RS', true),
  ('iGotUp - Erechim/RS', 'Erechim', 'RS', false),
  ('iGotUp - Estância Velha/RS', 'Estância Velha', 'RS', true),
  ('iGotUp - Gravatai Sede / RS', 'Gravataí', 'RS', true),
  ('iGotUp - Gravataí/RS', 'Gravataí', 'RS', true),
  ('iGotUp - iGuatemi Porto Alegre/RS', 'Porto Alegre', 'RS', true),
  ('iGotUp - Jequié/BA', 'Jequié', 'BA', true),
  ('iGotUp - Parobé/RS', 'Parobé', 'RS', true),
  ('iGotUp - São Leopoldo', 'São Leopoldo', 'RS', true),
  ('iGotUp Cachoeirinha', 'Cachoeirinha', 'RS', true),
  ('iGotUp Capão', 'Capão da Canoa', 'RS', true),
  ('iGotUp Central - Doca 5 Santa Catarina', 'Navegantes', 'SC', true),
  ('iGotUp Central - Sede Rio Grande', 'Rio Grande', 'RS', true),
  ('iGotUp Central - Sede Santa', 'Santa Catarina', 'SC', true),
  ('iGotUp I Fashion Outlet Novo', 'Novo Hamburgo', 'RS', true),
  ('iGotUp Novo Hamburgo Loja - Rio', 'Novo Hamburgo', 'RS', true),
  ('iGotUp Penha/SC', 'Penha', 'SC', true),
  ('iGotUp RS - Portão', 'Portão', 'RS', true),
  ('iGotUp Santa Cruz Do Sul', 'Santa Cruz do Sul', 'RS', true),
  ('TESTE-EDU Novo', 'Novo Hamburgo', 'RS', false)
on conflict (nome) do nothing;
