# iGotUp Growth Platform · Checklist de Segurança — Rotação de Chaves

**Data:** 2026-08-10
**Motivo:** Várias chaves/tokens foram compartilhados durante o desenvolvimento (via conversa).
Com a plataforma em produção, é **CRÍTICO** rotacionar todas para evitar acesso indevido.

---

## ⚠️ POR QUE ROTACIONAR

- Todas as chaves abaixo foram **expostas na conversa** de desenvolvimento.
- Qualquer pessoa com acesso ao histórico poderia utilizá-las.
- Rotacionar = invalidar a antiga e gerar uma nova. É a prática correta de segurança.

---

## 🔐 CHAVES A ROTACIONAR (em ordem de prioridade)

### 1. 🔴 SUPABASE — ANON / PUBLISHABLE KEY (prioridade MÁXIMA)
**Onde:** Supabase → Settings → API → **anon public**
**Como:** clicar em **"Regenerate" / "Rotate"** ao lado da anon key.

**IMPORTANTE:** após regenerar, atualizar o arquivo:
```
igotup-netlify/supabase/config.js
  → trocar o valor de "anonKey"
```
E fazer novo deploy no Cloudflare.

> A publishable key está no frontend (é pública por design), mas como foi exposta na
> conversa, regenerar garante que versões antigas do site não funcionem.

### 2. 🔴 CLOUDFLARE TOKEN (prioridade MÁXIMA)
**Onde:** dash.cloudflare.com → My Profile → API Tokens
**Como:** encontrar o token usado (permissão Pages) → **Delete** → criar um **novo token**
com as mesmas permissões (Cloudflare Pages → Edit).

> Sem esse token, ninguém mais consegue fazer deploy no Pages (além de você).

### 3. 🔴 GITHUB TOKEN (prioridade MÁXIMA)
**Onde:** github.com → Settings → Developer settings → Personal access tokens
**Como:** **Delete/Revoke** o token `ghp_...` usado → criar um novo se necessário.

> Esse token dava acesso de push ao repositório `igotup-growth-platform`.

### 4. 🟠 NETLIFY TOKEN (média — não está mais em uso)
**Onde:** app.netlify.com → User settings → Applications → Personal access tokens
**Como:** **Revoke** o token `nfp_...`.

> O Netlify foi desativado (créditos esgotados), mas revogar elimina risco.

### 5. 🟠 SUPABASE SERVICE_ROLE (se chegou a ser fornecida)
- A service_role **NÃO foi fornecida** neste projeto (bom!).
- Se em algum momento for fornecida, **rotacionar imediatamente** (Settings → API → service_role → Regenerate).
- Nunca usar service_role no frontend.

---

## 🔑 CREDENCIAIS DE ACESSO (recomendação)

### 6. 🟠 SENHA DO ADM (`jhonercp@gmail.com`)
- A senha `181818@` foi usada durante o desenvolvimento e **mencionada na conversa**.
- **Recomendação:** trocar para uma senha forte via:
  ```
  Supabase → Authentication → Users → jhonercp@gmail.com → Reset password
  ```
- Ou, se preferir, manter e apenas garantir que ninguém acessou a conversa.

---

## ✅ APÓS ROTACIONAR

1. **Atualizar** o `supabase/config.js` com a nova anon key.
2. **Re-deploy** no Cloudflare Pages (com o novo token).
3. **Testar** o login/cadastro na plataforma.
4. Atualizar o `README` / `ORGANIZACAO-MASTER.md` com as novas chaves.

---

## 🛡️ BOAS PRÁTICAS DAQUI EM DIANTE

- **NUNCA** compartilhar chaves/tokens na conversa.
- Usar variáveis de ambiente / secrets (Cloudflare Pages permite secrets).
- Revogar qualquer chave que seja exposta acidentalmente.
- Service_role e chaves secretas **nunca** no frontend.
- Revisar periodicamente as permissões dos tokens.
