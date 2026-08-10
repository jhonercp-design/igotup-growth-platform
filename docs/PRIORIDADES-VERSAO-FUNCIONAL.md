# iGotUp Growth Platform · Prioridades para Versão Funcional Real (teste de ponta)

**Objetivo:** Estruturar uma versão REAL, sem dados fake, para ser testada de ponta a ponta
pelo time hoje.

---

## 🎯 CENÁRIO ALVO (o que o time real precisa fazer)

1. **Cliente/parceiro acessa** a plataforma e faz **cadastro/login** (com loja, nome, WhatsApp, CPF)
2. **Cliente indicador vê seu painel** com:
   - Suas **indicações feitas** (nome, status, loja, data)
   - **Status de cada indicação** (nova → em_contato → test_ride → comprou → comissao_paga)
   - Suas **comissões/carteira** (valores liberados/pagos)
3. **Parceiro/ADM vê** os dashboards com os **dados reais** dessas indicações

---

## 🔴 PRIORIDADE 1 — Destravar Autenticação (BLOQUEIA TUDO)

Sem isso, nenhum usuário consegue entrar de forma consistente.

| Ação | Quem | Detalhe |
|---|---|---|
| P1.1 | **Desativar confirmação de email** | **Você (painel)** | Supabase → Authentication → Settings → garantir "Confirm email" desmarcado (`mailer_autoconfirm=true`) |
| P1.2 | Definir senha/confirmar ADM | **Você ou service_role** | Para `jhonercp@gmail.com` conseguir logar como admin |
| P1.3 | Adicionar domínio `.pages.dev` ao Supabase | **Você (painel)** | Authentication → URL Configuration → `https://igotup-growth-platform.pages.dev/**` |

> **Resultado:** cadastro cria usuário ativo; login funciona.

---

## 🟠 PRIORIDADE 2 — Conectar o Referral ao Supabase (núcleo operacional)

O Referral hoje é isolado (demo). Precisa virar o painel real do indicador.

| Ação | Quem | Detalhe |
|---|---|---|
| P2.1 | Referral usa o **usuário logado no hub** | **Eu** | Passar user_id/sessão do hub para o Referral (via URL/localStorage) |
| P2.2 | Referral **lê indicações** do Supabase | **Eu** | `getIndicacoes(indicador_id)` de `indicacoes` |
| P2.3 | Referral **cria indicação** no Supabase | **Eu** | `criarIndicacao()` em `indicacoes` |
| P2.4 | Referral **lê comissões** | **Eu** | `getLancamentos()` de `lancamentos` |
| P2.5 | **Remover dados demo** | **Eu** | Eliminar localStorage/fake do Referral |

> **Resultado:** o cliente indicador vê suas indicações reais e status.

---

## 🟡 PRIORIDADE 3 — Dados mínimos para o time testar

| Ação | Quem | Detalhe |
|---|---|---|
| P3.1 | Garantir **lojas carregadas** no cadastro | ✅ já existe (29 lojas) |
| P3.2 | Criar **indicador real** no cadastro | **Eu** | No cadastro, criar em `indicadores` (já parcial) |
| P3.3 | Ter alguns **registros de teste** de indicações | **Você ou eu** | Para o time ver dados no painel |

---

## 🟢 PRIORIDADE 4 — DIC e MGH com dados reais (depois do Referral)

| Ação | Quem | Detalhe |
|---|---|---|
| P4.1 | DIC lê métricas reais de `indicacoes`/`lancamentos` | **Eu** |
| P4.2 | MGH lê campanhas/MPS reais | **Eu** |
| P4.3 | IA (scores, insights) baseada em dados reais | **Eu** (depois) |

---

## 📊 O QUE EXISTE HOJE (estado real)

| Tabela | Registros | Uso |
|---|---|---|
| `lojas` | 29 | ✅ Cadastro (já funciona) |
| `indicadores` | 0 | ❌ precisa ser populado no cadastro |
| `indicacoes` | 0 | ❌ precisa ser criado/lido pelo Referral |
| `lancamentos` | 0 | ❌ comissões |
| `eventos` | 0 | ❌ trilha de status |

---

## ✅ O QUE EU POSSO FAZER AGORA (sem depender de você)

1. **Reescrever o Referral** para ler/escrever no Supabase (usando o user_id do hub)
2. **Remover dados demo** do Referral
3. **Conectar o cadastro** para criar `indicadores` reais
4. Preparar o DIC/MGH para leitura real
5. Publicar tudo no Cloudflare

---

## ⚠️ O QUE DEPENDE DE VOCÊ (não consigo sozinho)

1. **Desativar confirmação de email** (P1.1) — sem isso, cadastro cria usuário inativo
2. **service_role key** OU confirmação manual do ADM (P1.2) — para admin logar
3. **Adicionar domínio `.pages.dev`** (P1.3) — para o auth funcionar

---

## 🎯 PRÓXIMO PASSO RECOMENDADO

**Eu executo agora a Prioridade 2 (integrar Referral ao Supabase) + remover dados fake**, pois não depende de você. Depois você resolve a Prioridade 1 (autenticação no painel) para destravar o acesso completo.

**Quer que eu comece a reescrever o Referral para a versão real?**
