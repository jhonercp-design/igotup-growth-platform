# iGotUp Growth Platform · Documento Mestre de Organização

**Objetivo:** Organizar e eliminar a confusão entre as plataformas. Este é o documento de
referência único da estrutura.

---

## 🎯 VISÃO GERAL — UMA ÚNICA FONTE DE VERDADE

| Função | Onde está | Detalhe |
|---|---|---|
| **Código-fonte (FONTE DA VERDADE)** | `/home/user/igotup-netlify` | Onde editamos e desenvolvemos |
| **Versionamento** | GitHub `jhonercp-design/igotup-growth-platform` | Repositório oficial |
| **Hospedagem ATIVA (produção)** | **Cloudflare Pages** `https://igotup-growth-platform.pages.dev` | ✅ É AQUI que a plataforma está publicada |
| ~~Netlify~~ | `igotup-growth-platform.netlify.app` | ⚠️ **DESATIVADO** (créditos esgotados) |
| ~~GitHub Pages~~ | `jhonercp-design.github.io/...` | ⚠️ **DESATIVADO** (usuário via 404) |

> **REGRA:** toda edição é feita em `/home/user/igotup-netlify` → commit no GitHub → deploy no
> **Cloudflare Pages**. As outras plataformas NÃO são usadas (evita mistura).

---

## 📂 ESTRUTURA DO CÓDIGO-FONTE

```
/home/user/igotup-netlify/
├── index.html          ← Hub (login/cadastro + navegação)
├── app.js              ← Lógica do hub (login, RBAC, navegação)
├── styles.css          ← Estilo do hub
├── logo-clear.png
├── referral/           ← Módulo 1: Referral Engine
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── dic/                ← Módulo 2: Decision Intelligence Center
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── mgh/                ← Módulo 3: Marketing Growth Hub
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── supabase/           ← Integração com banco de dados
│   ├── config.js          (URL + publishable key)
│   ├── supabase-client.js (auth + dados)
│   ├── data-bridge.js     (camada de persistência)
│   ├── schema.sql         (tabelas do banco)
│   ├── seed-lojas-correto.sql
│   └── cadastro.html
└── docs/               ← Documentação
    └── rca/              (registro de incidentes, revisões)
```

---

## 🔑 CREDENCIAIS (por plataforma)

| Plataforma | Token/Chave | Status | Uso |
|---|---|---|---|
| **Cloudflare** | `cfut_N7w...` | ✅ Ativo | Deploy (fonte de hospedagem atual) |
| **GitHub** | `ghp_bEh...` | ✅ Ativo | Versionamento/push |
| **Netlify** | `nfp_9Yq...` | ⚠️ Créditos esgotados | ~~Não usar mais~~ |
| **Supabase** | publishable `sb_publishable_...` | ✅ | Frontend (dados) |
| **Supabase** | service_role | ❌ **NÃO fornecida** | Necessária p/ autenticação completa |

> 🔐 **SEGURANÇA:** todas as chaves/tokens acima foram compartilhados durante o projeto.
> **Recomenda-se fortemente ROTACIONAR/REVOGAR** todas após a conclusão.

---

## 🔄 FLUXO DE TRABALHO CORRETO (a partir de agora)

```
1. Editar código em  /home/user/igotup-netlify
2. Commit + Push → GitHub (jhonercp-design/igotup-growth-platform)
3. Deploy → Cloudflare Pages (wrangler)
4. Validar → https://igotup-growth-platform.pages.dev
```

**NUNCA** fazer deploy no Netlify ou GitHub Pages (evita duplicidade/confusão).

---

## ✅ ESTADO DAS PENDÊNCIAS (resumo)

### Concluído
- [x] Plataforma publicada (Cloudflare)
- [x] 3 módulos com data-bridge carregado
- [x] Loading nos botões de login/cadastro
- [x] Documentação organizada

### Pendente (depende do usuário)
- [ ] **Autenticação Supabase** (service_role key OU mailer_autoconfirm)
- [ ] Persistência de dados real nos módulos
- [ ] IA com dados reais
- [ ] UX/polimento final

---

## 📞 LINKS ÚTEIS

| Item | Link |
|---|---|
| **Plataforma (Cloudflare)** | https://igotup-growth-platform.pages.dev |
| **Repositório GitHub** | https://github.com/jhonercp-design/igotup-growth-platform |
| **Dashboard Supabase** | https://supabase.com/dashboard/project/awjasgentrutkntnlgkw |
| **Dashboard Cloudflare** | https://dash.cloudflare.com |

---

## 🚫 PLATAFORMAS DESATIVADAS (para não confundir)

| Plataforma | URL | Por que desativada |
|---|---|---|
| Netlify | igotup-growth-platform.netlify.app | Créditos esgotados |
| GitHub Pages | jhonercp-design.github.io/... | 404 no acesso do usuário |
