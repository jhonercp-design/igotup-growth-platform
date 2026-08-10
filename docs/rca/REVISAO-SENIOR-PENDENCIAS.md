# iGotUp Growth Platform · Revisão Sênior Completa

**Equipe:** Time de Agentes Sêniores (Arquitetura, Frontend, Backend/Dados, IA, Segurança, QA)
**Data:** 2026-08-10
**Objetivo:** Mapear TODAS as pendências da **Parte Humana** e da **Parte IA**

---

## RESUMO EXECUTIVO

A plataforma está **publicada e no ar** (Cloudflare Pages), com os 3 módulos acessíveis.
Porém, há uma **lacuna crítica de integração**: o login/cadastro está parcialmente conectado
ao Supabase, mas os **3 módulos (Referral, DIC, MGH) NÃO estão conectados ao banco de dados**
— operam com **dados demo (localStorage)**. Isso significa que a "máquina de crescimento"
ainda não funciona com dados reais de ponta a ponta.

---

## PARTE 1 — PENDÊNCIAS DA PARTE HUMANA (Experiência do Usuário)

### 🔴 Críticas (bloqueiam o uso real)

| # | Pendência | Status | Detalhe |
|---|---|---|---|
| H1 | **Login ADM não funciona** | ❌ ABERTO | Usuário `jhonercp@gmail.com` criado, mas `mailer_autoconfirm=false` impede login. Requer service_role key ou desativar confirmação |
| H2 | **Confirmação de email pendente** | ❌ ABERTO | Novo cadastro cria usuário não confirmado → login falha |
| H3 | **Módulos não conectados ao banco** | ❌ ABERTO | Referral/DIC/MGH usam `localStorage` (demo), não os dados reais do Supabase |
| H4 | **Cadastro não cria indicador completo** | ⚠️ PARCIAL | Cria usuário auth, mas o fluxo completo para `indicadores` depende de sessão confirmada |

### 🟠 Médias (experiência)

| # | Pendência | Status | Detalhe |
|---|---|---|---|
| H5 | **Redefinição de senha** | ❌ | Sem fluxo "esqueci minha senha" funcional |
| H6 | **Confirmação de cadastro visual** | ⚠️ | Mensagens podem não cobrir todos os casos de erro |
| H7 | **Perfil do usuário** | ❌ | Sem tela de edição de perfil/dados |
| H8 | **Feedback de carregamento** | ⚠️ | Alguns botões não mostram estado de loading |

### 🟢 Baixas (refino)

| # | Pendência | Status |
|---|---|---|
| H9 | Validação de campos com máscaras (CPF/WhatsApp) | ⚠️ |
| H10 | Acessibilidade (contraste, foco) | ⚠️ |
| H11 | Responsividade em telas menores | ⚠️ |
| H12 | Mensagens de erro amigáveis | ⚠️ |

---

## PARTE 2 — PENDÊNCIAS DA PARTE IA (Dados, Inteligência, Integração)

### 🔴 Críticas (bloqueiam o valor real)

| # | Pendência | Status | Detalhe |
|---|---|---|---|
| IA1 | **DIC (20 dashboards) com dados demo** | ❌ | Não lê métricas reais do Supabase (`metricas`, `indicacoes`, `lancamentos`) |
| IA2 | **IA executiva não conectada a dados reais** | ❌ | Insights/previsões são estáticos, não baseados em dados reais |
| IA3 | **MGH (Marketing Hub) com dados demo** | ❌ | MPS, campanhas não lêem do Supabase |
| IA4 | **Referral com dados demo** | ❌ | Indicações/carteira não persistem no banco real |
| IA5 | **Scores (Lead, Fraud, Growth, Partner)** | ❌ | Não há modelos de IA implementados — só valores estáticos |

### 🟠 Médias (capacidade de IA)

| # | Pendência | Status |
|---|---|---|
| IA6 | Priorização de leads por score | ❌ |
| IA7 | Detecção de fraude | ❌ |
| IA8 | Previsão de conversão/forecast | ❌ |
| IA9 | Recomendações personalizadas | ❌ |
| IA10 | Chat IA / assistente virtual | ❌ |

### 🟢 Estruturais (fundações)

| # | Pendência | Status |
|---|---|---|
| IA11 | Eventos de produto → Supabase | ⚠️ |
| IA12 | Pipeline de dados (eventos → métricas) | ❌ |
| IA13 | Modelos ML (requer dados históricos) | ❌ |
| IA14 | Governança de dados / LGPD | ⚠️ |

---

## PARTE 3 — INTEGRAÇÃO ATUAL (o que está conectado)

| Camada | Conectado ao Supabase? | Detalhe |
|---|---|---|
| **Hub (login/cadastro)** | ⚠️ PARCIAL | Cria usuário auth; login depende de confirmação |
| **Referral Engine** | ❌ NÃO | `localStorage` |
| **DIC** | ❌ NÃO | Dados estáticos |
| **MGH** | ❌ NÃO | Dados estáticos |
| **Tabelas do banco** | ✅ Existem | lojas, indicadores, indicacoes, lancamentos, eventos, parceiros |
| **Data Bridge** | ⚠️ Criado | `data-bridge.js` existe mas não é carregado pelos módulos |

---

## PRIORIZAÇÃO RECOMENDADA (para resolver de forma organizada)

### Fase 1 — Destravar Autenticação (bloqueia tudo)
- [ ] Resolver login ADM (service_role key OU desativar confirmação corretamente)
- [ ] Garantir `mailer_autoconfirm=true` (novos cadastros ativos)

### Fase 2 — Conectar os Módulos ao Supabase (dados reais)
- [ ] Referral → usar `data-bridge.js` (indicacoes, lancamentos)
- [ ] DIC → ler métricas reais (metricas, indicacoes)
- [ ] MGH → ler campanhas/MPS reais

### Fase 3 — IA com dados reais
- [ ] Construir pipeline de eventos → métricas
- [ ] Implementar scores básicos (lead, fraude)
- [ ] IA executiva baseada em dados reais

### Fase 4 — UX e Polimento
- [ ] Fluxo "esqueci senha"
- [ ] Perfil do usuário
- [ ] Feedback de carregamento
- [ ] Acessibilidade e responsividade

---

## DEPENDÊNCIA CRÍTICA

Para Fase 1 e 2, é **necessário**:
- **service_role key** do Supabase (para confirmar emails, definir senhas, e algumas operações de dados)
- **OU** desativar corretamente o `mailer_autoconfirm` no painel

Sem isso, o login/cadastro não funciona de ponta a ponta.
