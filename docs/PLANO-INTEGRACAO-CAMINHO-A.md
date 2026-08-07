# iGotUp · Plano de Integração ao Modelo Existente (Caminho A)

**Objetivo:** Integrar a iGotUp Growth Platform ao **modelo de dados que já existe** no Supabase,
removendo duplicações e conectando o frontend às tabelas reais.

---

## 1. Modelo Original (já existia — sistema de indicação da iGotUp)

```
lojas          (id, nome, cidade, whatsapp, endereco, ativa)      ← 26 unidades
indicadores    (id, nome, whatsapp_norm, cidade, loja_id, codigo, token, cpf, aceite_lgpd_em, criado_em)
indicacoes     (id, indicador_id, nome, whatsapp_norm, cidade,
                status[enum status_indicacao], loja_id, pedido_num, chassi,
                score_risco, risco_flags, validado_por, validado_em,
                comissao_paga_em, criado_em)
lancamentos    (id, indicador_id, indicacao_id, tipo, valor, status, liberavel_em, pago_em, criado_em)
eventos        (id, indicacao_id, de_status, para_status, por, em)
parceiros      (id, nome, cidade, estado, regiao, receita, conversoes, xp, status, created_at)

enum status_indicacao = nova, em_contato, test_ride, comprou, comissao_paga,
                        nao_converteu, expirada, rejeitada
```

## 2. Tabelas que EU criei (schema.sql) e sua destinação

| Tabela criada | Status | Decisão (Caminho A) |
|---|---|---|
| `profiles` | redundante c/ `indicadores` (indicação) | **Integrar** — usar `indicadores` como perfil de indicador; `profiles` p/ auth/RBAC (C1-C5) |
| `referrals` | redundante c/ `indicacoes` | **Remover/ignorar** — usar `indicacoes` como fonte de verdade |
| `wallets` + `wallet_movements` | redundante c/ `lancamentos` | **Integrar** — usar `lancamentos` como carteira/comissões |
| `lojas` (criada) | duplicada | **Usar a original** (com whatsapp/endereco); ajustar minha versão |
| `parceiros` (criada) | duplica a original | **Usar a original** |
| `mps`, `gamificacao`, `campanhas`, `campanhas_criadas`, `metricas`, `auditoria` | não duplicam | **Manter** (são novas) |

## 3. Estratégia de Integração

### Decisão-chave: `indicadores` como perfil de indicador
- **`profiles`** continua existindo para **autenticação e RBAC** (login, camadas C1–C5, ACL ADM).
- **`indicadores`** é o **perfil de negócio** de quem indica (nome, whatsapp_norm, cidade, loja_id, codigo, token, cpf, LGPD).
- Relacionamento: `profiles.id` ↔ `indicadores` (via campo `user_id` a adicionar, ou pelo `email`).

### `indicacoes` como fonte de verdade do funil
- O frontend (Referral Engine) passa a criar/atualizar registros em `indicacoes` com o **enum correto**:
  `nova → em_contato → test_ride → comprou → comissao_paga` (e os negativos).
- O `chassi` e `score_risco` são campos específicos do negócio de mobilidade — o frontend os alimenta quando aplicável.

### `lancamentos` como carteira
- Comissões e valores são registrados em `lancamentos` (tipo, valor, status, liberavel_em, pago_em).
- A Wallet do usuário passa a ler de `lancamentos` (saldo = soma de valores liberados).

### `eventos` como trilha
- Cada mudança de status gera registro em `eventos` (de_status, para_status, por, em) — **auditoria do funil**.

### `lojas` / `parceiros`
- Usar as tabelas originais (26 unidades em `lojas`; `parceiros` p/ gestão).

## 4. Campos a ADICIONAR no modelo original (evolução, sem quebrar)

Para conectar ao auth (Supabase Auth), recomendo adicionar à `indicadores`:
```sql
alter table public.indicadores add column if not exists user_id uuid references auth.users(id);
```

Para vincular indicação à unidade já existe (`loja_id`).

## 5. Tabelas que NÃO vão existir mais (remover as duplicadas que criei)
- `referrals` → substituída por `indicacoes`
- Minha versão de `lojas` → usar a original
- Minha versão de `parceiros` → usar a original

## 6. Impacto no frontend
- Referral Engine: passa a ler `indicadores` + `indicacoes` + `lancamentos` (em vez de `referrals` + `wallets`).
- Data Bridge: ajustar mapeamento das tabelas.
- Cadastro: criar em `indicadores` (nome, whatsapp_norm, cidade, loja_id, cpf) + `profiles` (auth).

---

## ✅ Resumo da decisão (Caminho A)
1. **Manter** o modelo original (`indicadores`, `indicacoes`, `lancamentos`, `eventos`, `lojas`, `parceiros`) como **fonte de verdade** do programa de indicação.
2. **Manter** `profiles` só para **auth + RBAC** (login/camadas/ACL).
3. **Remover** tabelas duplicadas que criei (`referrals`, minha `lojas`/`parceiros`).
4. **Manter** as novas (`mps`, `gamificacao`, `campanhas`, `metricas`, `auditoria`).
5. **Conectar** o frontend ao modelo original.
