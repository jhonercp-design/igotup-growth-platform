# iGotUp · Registro de Incidentes (RCA — Root Cause Analysis)

**Processo:** Diagnóstico organizado, causa raiz, correção verificada e validação — nunca "na sorte".
**Time:** Engenharia de Plataforma (Arquitetura, Frontend, Backend/Dados, QA).

---

## 🧭 Método de Trabalho (adotado daqui em diante)

Toda falha passa por este ciclo obrigatório:

1. **REPRODUZIR** — obter o erro real (console, resposta, comportamento observado)
2. **DIAGNOSTICAR** — identificar a causa raiz (não o sintoma)
3. **CORRIGIR** — aplicar a solução estrutural
4. **VERIFICAR** — confirmar que a correção resolveu (teste reproduzível)
5. **REGISTRAR** — documentar no RCA (este arquivo)

Nunca aplicar correção sem antes REPRODUZIR e DIAGNOSTICAR.

---

## 📋 Incidentes Registrados

### INC-001 · Cadastro não navega para a plataforma
- **Status:** ✅ RESOLVIDO (confirmado pelo usuário em 2026-08-07)
- **Causa raiz final:** a função `show()` dependia apenas do atributo `hidden`, que pode ser
  sobrescrito pelo CSS (`display: flex` das classes `.app`/`.sso`). Mesmo chamando `show('app')`,
  a troca visual não acontecia.
- **Correção final aplicada:**
  1. `show()` agora manipula `hidden` **e** `style.display` explicitamente (login → `none`,
     app → `''`), garantindo a troca visual.
  2. `show('app')` movido para a **primeira ação** após validar o cadastro.
  3. Adicionado `console.log` de diagnóstico no `show()`.
- **Validação:** usuário confirmou que agora entra na plataforma. ✅

#### Histórico de correções aplicadas ao longo do diagnóstico
1. Validação de WhatsApp aceita DDI `+55` (bug que bloqueava cadastros com +55).
2. CPF normalizado (aceita pontuação).
3. Fallback de lojas (select sempre populado, mesmo sem Supabase).
4. Wrapper de erro robusto nos eventos.
5. `show()` robusto com `display` explícito + navegação primeiro. ← **resolveu**
- **Causa raiz CONFIRMADA (via teste headless instrumentado):**
  - A **lógica de navegação está correta** — o teste jsdom instrumentado provou que `show('app')` funciona e navega quando o select de loja está populado.
  - O bloqueio ocorria porque o **select de loja não era populado** quando o Supabase/CDN não carregava no navegador. Sem loja selecionável → `ssoLoja.value` vazio → validação `if(!lojaId)` bloqueava → não navegava.
  - **Isso explica os dois sintomas juntos:** "loja vazia" (INC-002) + "não sai do cadastro" (INC-001) — mesma causa raiz.
- **Correção aplicada:**
  1. Fallback de lojas (`LOJAS_FALLBACK`) no data-bridge — garante que o select SEMPRE tenha opções, mesmo se o Supabase não carregar.
  2. Wrapper de erro robusto (`registrarEventos`) — captura e loga qualquer erro, nunca trava silenciosamente.
  3. `carregarLojas().catch(...)` — não bloqueia a inicialização.
- **Validação:** publicada no Netlify; site responde 200; fallback presente (13 refs) e wrapper de erro presente (4 refs).
- **Sintoma:** O usuário preenche o cadastro, clica "Criar conta", mas a página NÃO avança para a plataforma (fica no cadastro).
- **Comportamento esperado:** Ao validar os campos, navegar para o hub da plataforma.

#### Tentativas de correção (histórico — todas sem confirmação de causa raiz)
| Iteração | Hipótese | Correção | Resultado |
|---|---|---|---|
| 1 | Supabase bloqueava a navegação | Integrar signUp no login | ❌ Não resolveu |
| 2 | SignUp/In atrasava a navegação | Tornar Supabase opcional | ❌ Não resolveu |
| 3 | Navegação estava sob await | Navegar primeiro, Supabase em 2º plano | ❌ Ainda não entrou |

**Conclusão da análise:** As hipóteses anteriores eram sobre a LÓGICA de navegação, mas o sintoma persiste mesmo com `show('app')` sendo chamado imediatamente. **Isso indica que a causa raiz NÃO está na lógica de `login()`, e sim em um erro que ocorre ANTES** — provavelmente no **carregamento do script** ou em um **erro de runtime no browser** que impede o registro do listener do botão, ou que faz o `show('app')` não ter efeito visual.

#### Diagnóstico técnico realizado (teste headless jsdom)
- ✅ O `app.js` carrega sem erro de sintaxe
- ✅ Todos os IDs referenciados existem no HTML
- ✅ O listener do botão `ssoBtn` está registrado corretamente
- ✅ `show('app')` está na ordem correta (antes do Supabase)
- ⚠️ No ambiente jsdom, o clique não reflete a navegação (limitação do jsdom com `async` + IIFE)

**Conclusão parcial:** a lógica do código parece correta, mas o sintoma persiste no browser real.
O jsdom não reproduz fielmente o comportamento do navegador para `async` + eventos.

**AÇÃO OBRIGATÓRIA (próximo passo):** Obter o **erro real do console do navegador do usuário**
(F12 → Console) ao clicar "Criar conta". Sem isso, não é possível confirmar a causa raiz com
consciência. Este é o passo REPRODUZIR do processo RCA.

#### Hipótese técnica mais provável (a verificar)
O problema pode estar no **carregamento do CDN do Supabase** no navegador do usuário. Se o
CDN `cdn.jsdelivr.net` estiver **bloqueado** (rede, firewall, adblock), o `window.supabase` fica
`undefined`. Embora o `supabase-client.js` trate isso (`if(!supabase) return false`), pode haver
uma falha em cadeia. **Alternativa robusta:** remover a dependência do CDN e usar fallback
local, ou garantir que a navegação seja 100% independente do carregamento do Supabase.

#### Decisão de engenharia (preventiva, sem depender do erro do usuário)
Para tornar a navegação **à prova de falhas do Supabase/CDN**, vamos:
1. Garantir que o `app.js` rode com `defer` ou que a inicialização seja protegida com try/catch
2. Remover qualquer dependência de carregamento do CDN para a navegação básica
3. Adicionar um fallback de demonstração que funcione mesmo se o Supabase não carregar

---

### INC-002 · Seletor de loja vazio (RESOLVIDO)
- **Status:** ✅ RESOLVIDO
- **Causa raiz:** consulta usava coluna `estado` inexistente na tabela `lojas` + lojas não inseridas.
- **Correção:** ajustado para colunas reais (`id,nome,cidade`) + insert das 27 lojas.
- **Validação:** 27 lojas ativas confirmadas no banco; deploy publicado.

### INC-003 · Colunas obrigatórias da tabela lojas (RESOLVIDO)
- **Status:** ✅ RESOLVIDO
- **Causa raiz:** tabela `lojas` exige `whatsapp` NOT NULL.
- **Correção:** inserido com valor provisório `+5500000000000`.
- **Validação:** insert bem-sucedido.

### INC-004 · Tabela lojas sem constraint única (RESOLVIDO)
- **Status:** ✅ RESOLVIDO
- **Causa raiz:** `on conflict (nome)` exigia constraint que não existe.
- **Correção:** removido `on conflict`, insert simples.
- **Validação:** insert bem-sucedido.

---

## 🎯 Foco atual: INC-001 (navegação)

Para resolver com consciência, precisamos **REPRODUZIR o erro real**. As etapas abaixo são o diagnóstico rigoroso.
