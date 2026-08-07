# iGotUp Growth Platform · Avaliação Executiva do Estado Atual

**Apresentado ao:** Conselho Executivo iGotUp
**Padrão:** Enterprise AI Framework
**Objetivo:** Alinhamento estratégico e caminho crítico para plataforma funcional de classe mundial

---

## 1. Visão Estratégica

A iGotUp Growth Platform integra 3 domínios de crescimento: **Referral Engine, Decision
Intelligence Center e Marketing Growth Hub** — unificados sob um shell corporativo com login
único (SSO). O objetivo estratégico é transformar a base de clientes e parceiros em um **canal
de aquisição autoescalável**, com governança total da Matriz.

## 2. Matriz de Maturidade por Pilar

| Pilar | Estado atual | Lacunas | Prioridade |
|---|---|---|---|
| **Segurança** | Credenciais via publishable key; ACL de ADM Master implementada no schema (RLS) | Tabelas ainda não criadas; revisar RBAC/ABAC por camada; auditoria completa pendente | 🔴 Alta |
| **Governança** | Regras de cadastro/ACL documentadas; auditoria modelada | Políticas de acesso por camada a confirmar; LGPD (consentimento, retenção) | 🟠 Média |
| **Arquitetura Enterprise** | Shell multi-módulo; schema modular (DDD por domínio); API First via Supabase | Persistência não conectada; telemetria/observabilidade a definir | 🟠 Média |
| **Maturidade Corporativa** | Framework normativo registrado; roadmap mental por fases | Documentar KPIs, riscos, critérios de aceite de cada entrega | 🟢 Progresso |
| **Planejamento Estratégico** | Priorização clara: banco → conexão → deploy aprovado | Definir metas numéricas e baseline de indicadores | 🟢 Progresso |

## 3. Caminho Crítico (gating para o deploy aprovado)

O deploy no Netlify está **condicionado** à conclusão destas etapas:

### Etapa 1 — Provisionar o banco (GATE 🔴)
- [ ] Aplicar `schema.sql` no Supabase (cria tabelas, RLS, ACL ADM, trigger de validação)
- [ ] Aplicar `seed.sql` (8 lojas parceiras)
- **Bloqueio atual:** publishable key não executa DDL → **aguarda service_role key ou aplicação manual no SQL Editor**

### Etapa 2 — Conectar os módulos (🟠)
- [ ] Integrar Referral Engine (login, indicações, wallet) ao Supabase
- [ ] Integrar DIC (métricas/KPIs) ao Supabase
- [ ] Integrar Marketing Hub (MPS, campanhas) ao Supabase
- [ ] Implementar página de cadastro com regras de ACL + campos obrigatórios

### Etapa 3 — Reforçar segurança e governança (🟠)
- [ ] Revisar RBAC/ABAC por camada (C1–C5)
- [ ] Garantir auditoria de toda ação crítica
- [ ] Política de consentimento LGPD

### Etapa 4 — Validar e aprovar (🟢)
- [ ] Testes de integração e de isolamento entre camadas
- [ ] Aprovação do Conselho
- [ ] **Deploy final no Netlify**

## 4. Riscos e Mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Publishable key sem DDL | Bloqueia provisionamento | Obter service_role ou SQL Editor |
| Exposição da service_role key | Vazamento de dados | Uso somente em ambiente seguro; nunca no frontend |
| Regra ADM por email (não imutável) | Comprometimento do ADM | Backup de ADM configurável; MFA; auditoria de login |
| Dados demo vs. produção | Confusão | Clear separation: tabelas reais + dados demo isolados |

## 5. Recomendações Adicionais (alinhadas ao framework)

1. **ADM Master configurável, não hardcoded** — hoje `jhonercp@gmail.com` é fixo no schema.
   Recomenda-se uma tabela `admins` ou variável de ambiente (via Edge Functions) para permitir
   recuperação e rotação sem alterar schema.
2. **Edge Functions (RPC)** para operações críticas (crédito de wallet, troca de camada) —
   garantindo validação no servidor e não só via RLS.
3. **Retrocompatibilidade** — o site publicado hoje usa dados demo (localStorage). A migração
   deve prever fallback elegante enquanto o banco não está populado.

## 6. Próxima Ação Requerida

Para destravar a Etapa 1, decidir:
- **Opção A:** usuário aplica `schema.sql` + `seed.sql` no SQL Editor (mais seguro)
- **Opção B:** fornecer a `service_role key` para provisionamento automático via API

**Recomendação do Conselho Técnico:** Opção A (SQL Editor) mantém a chave secreta no ambiente
do usuário, reduzindo superfície de risco — alinhado ao pilar Segurança.
