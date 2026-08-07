# iGotUp Growth Platform · Regras de Cadastro e Controle de Acesso (ACL)

> **Documento de especificação — regra de negócio oficial**
> Aprovado em: [data] · Autor: Jhoner (ADM Master)

---

## 1. Administrador Geral (ADM Master)

- **Único e exclusivo email administrador geral:** `jhonercp@gmail.com`
- **Somente este email pode** escolher/definir a **categoria (camada/perfil)** ao cadastrar
  novos usuários que **não sejam da categoria `cliente`**.
- **Nenhum outro email** tem essa capacidade.

### Regra prática de UI
- O campo/seletor de **categoria** **NUNCA aparece** no cadastro comum.
- O seletor de categoria **só aparece** quando o cadastro está sendo realizado **com a sessão
  do ADM Master** (`jhonercp@gmail.com`) logado.

---

## 2. Regra de Cadastro Padrão

- **Qualquer pessoa** que se cadastre pela **página de cadastro** (sem ser o ADM Master)
  será criada **sempre como `cliente` final**.
- Cliente final = **cliente que faz a indicação de novos clientes** (papel `cliente`).

### Fluxo
```
Usuário acessa página de cadastro
  ├─ Se NÃO é jhonercp@gmail.com (autenticado)  → cria como "cliente" (sem opção de categoria)
  └─ Se É jhonercp@gmail.com (autenticado)       → pode escolher a categoria ao cadastrar
```

---

## 3. Campos Obrigatórios no Cadastro Inicial

Todo cadastro exige **todos** os campos abaixo, sem exceção:

| Campo | Tipo | Obrigatório |
|---|---|---|
| **Loja que fez a compra** | texto/seletor de loja | ✅ |
| **Email** | email válido | ✅ |
| **WhatsApp** | telefone (formato brasileiro) | ✅ |
| **Nome completo (sem abreviação)** | texto | ✅ |
| **CPF** | CPF válido | ✅ |

> Regra: o cadastro **não é concluído** enquanto qualquer um destes campos estiver vazio.

---

## 4. Categorias (Camadas) Disponíveis para o ADM

As categorias/camadas possíveis (quando cadastradas pelo ADM Master):

| Camada | Perfil | Descrição |
|---|---|---|
| C1 | Administrador Matriz | Controle total da rede |
| C2 | Equipe Matriz | Operação iGotUp (perfis setoriais) |
| C3 | Gestor Parceiro | Operação da loja parceira |
| C4 | Equipe Parceiro | Usuários internos da loja |
| C5 | Cliente | Cliente que indica novos clientes (padrão) |

---

## 5. Garantias de Segurança (a implementar)

- **Validação no backend** (nunca confiar só no frontend): a alteração de categoria só é aceita
  se o `auth.uid()` corresponder ao email `jhonercp@gmail.com`.
- **RLS / policy** no Supabase para impedir que usuários comuns alterem a própria camada.
- **Auditoria** de toda troca de categoria (quem alterou, de/para qual camada).

---

## 6. Resumo

1. `jhonercp@gmail.com` = **ADM Master único**.
2. Cadastro comum → sempre **cliente**.
3. Só o ADM cadastra categorias ≠ cliente.
4. Cadastro exige: **loja, email, WhatsApp, nome completo, CPF** — todos obrigatórios.
