# iGotUp Growth Platform · Revisão Geral Completa

**Data:** 2026-08-10
**Objetivo:** Panorama completo do estado da plataforma — infraestrutura, dados, autenticação,
funcionalidade e pendências.

---

## 🟢 ESTADO ATUAL — O QUE FUNCIONA

### 1. Hospedagem (no ar)
| Plataforma | Link | Status |
|---|---|---|
| **Cloudflare Pages** | https://igotup-growth-platform.pages.dev | ✅ **ATIVO** (produção) |
| ~~Netlify~~ | — | ❌ Desativado (créditos) |
| ~~GitHub Pages~~ | — | ❌ Desativado (404) |

### 2. Autenticação Supabase (funcionando)
- ✅ Email provider: **ativado**
- ✅ Confirmação de email: **desativada** (`mailer_autoconfirm: True`) → cadastros ativos imediatamente
- ✅ Login/cadastro funcionando (usuário conseguiu entrar)

### 3. Banco de dados (populado)
| Tabela | Registros | Uso |
|---|---|---|
| `lojas` | **29** | ✅ Unidades reais |
| `indicadores` | **12** | ✅ Perfis de indicadores criados no cadastro |
| `indicacoes` | **9** | ✅ Indicações criadas |
| `lancamentos` | **6** | ✅ Comissões |
| `eventos` | **11** | ✅ Trilha de status |

### 4. Fluxo funcional (testado)
- ✅ Cadastro cria usuário + indicador
- ✅ Login funciona
- ✅ Criar indicação salva no banco
- ✅ Referral lê as indicações do indicador

---

## 🟡 PENDÊNCIAS — O QUE PRECISA ATENÇÃO

### UI/UX (problema visual em análise)
- ⚠️ **Centralização** — diagnosticado como OK via renderização automatizada (login e Referral
  centralizados em 1280px), mas usuário relata deslocamento no seu dispositivo. Provável causa:
  resolução/zoom do dispositivo, ou cache.

### Módulos DIC e MGH (dados demo)
- ⚠️ **DIC** — carrega scripts Supabase, mas **usa dados demo** (não lê métricas reais do banco)
- ⚠️ **MGH** — carrega scripts Supabase, mas **usa dados demo** (MPS/campanhas não lêem reais)

### Integração
- ⚠️ **`user_id` nos indicadores** — alguns indicadores antigos não têm `user_id` ligado
- ⚠️ **Domínio no Supabase** — verificar se `.pages.dev` está em URL Configuration (login via
  `signInWithPassword` não exige redirect, mas bom confirmar)

---

## 🔴 RECOMENDAÇÕES DE SEGURANÇA (importante)

Várias chaves foram compartilhadas durante o desenvolvimento:
| Chave | Ação recomendada |
|---|---|
| Supabase publishable | Pode manter (é pública) |
| **Supabase service_role** | Se fornecida em algum momento, **ROTACIONAR** |
| **Cloudflare token** | **Rotacionar** |
| **GitHub token** | **Revogar/Rotacionar** |
| **Netlify token** | Revogar (não usa mais) |

---

## 📋 CHECKLIST DE CONTINUIDADE (próximos passos)

### Prioridade Alta
1. [ ] **Resolver centralização no dispositivo do usuário** (verificar resolução/zoom)
2. [ ] **Conectar DIC ao Supabase** (ler `indicacoes`/`lancamentos` reais)
3. [ ] **Conectar MGH ao Supabase** (campanhas/MPS reais)

### Prioridade Média
4. [ ] Corrigir `user_id` dos indicadores antigos
5. [ ] Rotacionar chaves de segurança
6. [ ] Limpar dados de teste do banco

### Prioridade Baixa
7. [ ] UX refinada (máscaras, acessibilidade)
8. [ ] IA baseada em dados reais (scores, insights)

---

## ✅ CONCLUSÃO

A **estrutura core está funcional**: hospedagem ativa, autenticação OK, banco populado, cadastro
e indicações funcionando. As pendências principais são a **centralização no dispositivo do
usuário** (visual) e a **conexão dos módulos DIC/MGH aos dados reais** (integração).
