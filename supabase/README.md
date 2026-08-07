# iGotUp · Integração Supabase — Estrutura Sólida

Esta pasta contém toda a estrutura de integração com o Supabase. **O deploy no Netlify só
acontecerá depois que tudo estiver configurado e aprovado.**

## Estado atual (avanço)

- ✅ **Data Bridge** criado (`data-bridge.js`) — camada unificada que usa Supabase quando
  disponível e faz **fallback para demo** (localStorage) caso contrário.
- ✅ **Hub** integrado: carrega SDK Supabase + config + client + bridge; mostra o **modo ativo**
  (Supabase ⚡ ou Demo 🧪) na tela de login e no header.
- ✅ `config.js` preenchido com URL + publishable key.
- ⏳ **Bloqueio:** as tabelas ainda não existem no Supabase (exige service_role key ou SQL Editor).
  Enquanto isso, a plataforma roda em **modo demo**.

## Configuração (arquivo `config.js`)

```js
window.SUPABASE_CONFIG = {
  url: 'https://awjasgentrutkntnlgkw.supabase.co',
  anonKey: 'sb_publishable_C26Cref0KHZ_8TLA3KodGw_WLxnUIY6',
};
```

## Passos para deixar funcional

### 1. Criar as tabelas
No **SQL Editor** do Supabase, execute na ordem:
1. `schema.sql` — cria todas as tabelas, trigger de wallet, RLS e a **regra de ACL do ADM Master**
2. `seed.sql` — popula a tabela de lojas parceiras

### 2. Regras de negócio implementadas (ver `docs/REGRAS-CADASTRO-ACL.md`)
- ADM Master único: `jhonercp@gmail.com`
- Só ele pode definir categoria ≠ cliente
- Cadastro comum → sempre `cliente`
- Cadastro exige: **loja, email, WhatsApp, nome completo, CPF** (todos obrigatórios)

### 3. Garantias no banco (RLS + trigger)
- `can_set_layer()`: só o email do ADM retorna true
- Policy de `insert`: não-admin só cria `layer='cliente'`
- Policy de `update`: não-admin fica travado em `cliente`
- Trigger `validate_required_profile_trg`: impede cadastro sem os campos obrigatórios

## Arquivos

| Arquivo | Função |
|---|---|
| `config.js` | Credenciais (URL + publishable key) |
| `schema.sql` | Tabelas + RLS + ACL do ADM + trigger de validação |
| `seed.sql` | Lojas parceiras iniciais |
| `supabase-client.js` | Cliente + helpers (auth, referral, wallet, MPS, auditoria) |
| `cadastro.html` | Página de cadastro (com regras de categoria) |
| `../docs/REGRAS-CADASTRO-ACL.md` | Especificação oficial das regras |

## Deploy
O deploy no Netlify será feito **somente após aprovação** de toda a estrutura.
