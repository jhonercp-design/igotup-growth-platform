-- ============================================================
-- iGotUp · LIMPEZA DOS INDICADORES DE TESTE
-- Executar no Supabase: SQL Editor > New query > Run
-- Remove APENAS os 10 indicadores de teste (por ID explícito).
-- NÃO toca nos indicadores reais: Joao Neves, Luana e Lenir.
-- ============================================================

BEGIN;

-- 1) Remove lançamentos vinculados aos indicadores de teste (se sobrar algum)
DELETE FROM lancamentos
WHERE indicador_id IN (
  '6cd9b94f-eec4-4001-847b-b18952c6c878',
  'df08a5e6-e7ed-47c0-a44f-2fd757947c6c',
  'a1eeae76-5c21-4f69-9e06-b436d64d5364',
  '50433fdf-2e1f-4556-a226-a5ff3c9b3d76',
  'ed420160-0784-4381-bdfe-96c867b3662f',
  '7896d94c-e6a5-42b4-b2bd-0d8eb85b3972',
  '7968d9ac-ecca-405a-873e-ee0dfa138ce7',
  'fd9db4d6-5f03-4632-8e53-18bec990bab0',
  'bfce31e2-6374-46fc-955b-774ef6aad9f4',
  'a8aa0ffc-011c-4d83-b459-113cc74ce0fa'
);

-- 2) Remove eventos das indicações desses indicadores
DELETE FROM eventos
WHERE indicacao_id IN (
  SELECT id FROM indicacoes WHERE indicador_id IN (
    '6cd9b94f-eec4-4001-847b-b18952c6c878',
    'df08a5e6-e7ed-47c0-a44f-2fd757947c6c',
    'a1eeae76-5c21-4f69-9e06-b436d64d5364',
    '50433fdf-2e1f-4556-a226-a5ff3c9b3d76',
    'ed420160-0784-4381-bdfe-96c867b3662f',
    '7896d94c-e6a5-42b4-b2bd-0d8eb85b3972',
    '7968d9ac-ecca-405a-873e-ee0dfa138ce7',
    'fd9db4d6-5f03-4632-8e53-18bec990bab0',
    'bfce31e2-6374-46fc-955b-774ef6aad9f4',
    'a8aa0ffc-011c-4d83-b459-113cc74ce0fa'
  )
);

-- 3) Remove as indicações desses indicadores
DELETE FROM indicacoes
WHERE indicador_id IN (
  '6cd9b94f-eec4-4001-847b-b18952c6c878',
  'df08a5e6-e7ed-47c0-a44f-2fd757947c6c',
  'a1eeae76-5c21-4f69-9e06-b436d64d5364',
  '50433fdf-2e1f-4556-a226-a5ff3c9b3d76',
  'ed420160-0784-4381-bdfe-96c867b3662f',
  '7896d94c-e6a5-42b4-b2bd-0d8eb85b3972',
  '7968d9ac-ecca-405a-873e-ee0dfa138ce7',
  'fd9db4d6-5f03-4632-8e53-18bec990bab0',
  'bfce31e2-6374-46fc-955b-774ef6aad9f4',
  'a8aa0ffc-011c-4d83-b459-113cc74ce0fa'
);

-- 4) Remove os indicadores de teste
DELETE FROM indicadores
WHERE id IN (
  '6cd9b94f-eec4-4001-847b-b18952c6c878',
  'df08a5e6-e7ed-47c0-a44f-2fd757947c6c',
  'a1eeae76-5c21-4f69-9e06-b436d64d5364',
  '50433fdf-2e1f-4556-a226-a5ff3c9b3d76',
  'ed420160-0784-4381-bdfe-96c867b3662f',
  '7896d94c-e6a5-42b4-b2bd-0d8eb85b3972',
  '7968d9ac-ecca-405a-873e-ee0dfa138ce7',
  'fd9db4d6-5f03-4632-8e53-18bec990bab0',
  'bfce31e2-6374-46fc-955b-774ef6aad9f4',
  'a8aa0ffc-011c-4d83-b459-113cc74ce0fa'
);

COMMIT;

-- Confirme o resultado: deve sobrar apenas 3 indicadores (Joao Neves, Luana, Lenir)
SELECT id, nome, cidade FROM indicadores ORDER BY nome;
