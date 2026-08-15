# Richidesk - Sistema de Help Desk para uso interno em IIS.

Sistema interno de abertura e gestão de chamados de suporte técnico da Farmaderm.

- **Frontend:** HTML + CSS + JavaScript puro (sem build, sem framework) — publicado como site estático no IIS.
- **Backend:** [Supabase](https://supabase.com) (Postgres + API automática + Auth + Edge Functions).
- **Hospedagem:** servidor Windows Server interno, via IIS.

---

## Índice

1. [Arquitetura](#arquitetura)
2. [Estrutura de pastas](#estrutura-de-pastas)
3. [Como rodar localmente](#como-rodar-localmente)
4. [Setup do zero (novo ambiente Supabase)](#setup-do-zero-novo-ambiente-supabase)
5. [Deploy no IIS](#deploy-no-iis)
6. [Funcionalidades já implementadas](#funcionalidades-já-implementadas)
7. [Segurança (RLS)](#segurança-rls)
8. [Notificação por e-mail](#notificação-por-e-mail)
9. [Roadmap / próximos passos](#roadmap--próximos-passos)

---

## Arquitetura

```
Navegador (usuário ou equipe de TI)
        │
        ├── Site estático (HTML/CSS/JS) servido pelo IIS
        │
        ▼
   Supabase (Postgres + API REST/RPC + Auth)
        │
        ▼
   Edge Function (Deno) ──► SMTP Localweb ──► suporte@farmaderm.com.br
```

O frontend fala **diretamente** com o Supabase pelo navegador (não existe um backend próprio rodando no servidor). A segurança de quem pode ler/escrever o quê é garantida por **Row Level Security (RLS)** no banco — não pelo frontend, que é só interface.

Todo evento de novo chamado dispara automaticamente um e-mail de notificação através de uma **Supabase Edge Function**, acionada por um **Database Webhook**.

---

## Estrutura de pastas

```
richidesk-helpdesk/
├── index.html                     # Formulário público de abertura de chamado
├── consulta.html                  # Consulta pública de status por número de protocolo
│
├── admin/
│   ├── login.html                 # Login da equipe de TI
│   └── painel.html                # Painel de gestão (abas, filtros, histórico)
│
├── assets/
│   ├── css/style.css              # Estilo único, compartilhado por todas as páginas
│   └── js/
│       ├── supabase-client.js     # Conexão com o projeto Supabase (URL + anon key)
│       ├── novo-chamado.js        # Lógica do formulário de abertura
│       ├── consulta.js            # Lógica da consulta pública por protocolo
│       ├── auth.js                # Login, logout e proteção de sessão
│       └── painel.js              # Listagem, abas, filtros, modal e histórico
│
├── sql/                           # Scripts SQL, em ordem de execução (ver abaixo)
│   ├── 001_schema_inicial.sql
│   ├── 002_fix_abertura_chamado.sql
│   ├── 003_historico_eventos.sql
│   ├── 004_consulta_publica.sql
│   └── 005_validacao_rate_limit.sql
│
└── supabase/
    └── functions/
        └── notificar-novo-chamado/
            └── index.ts            # Edge Function: envia e-mail via SMTP a cada novo chamado
```

---

## Como rodar localmente

Não há build nem servidor de desenvolvimento — é só abrir o arquivo:

1. Baixe/clone o repositório.
2. Abra `index.html` diretamente no navegador (duplo clique).
3. Pronto — como o frontend conecta direto no Supabase (via `assets/js/supabase-client.js`), já funciona contra o banco real de produção. **Não existe ambiente de "staging" separado ainda** — veja a seção de Roadmap sobre isso.

Para testar o painel admin localmente, abra `admin/login.html` e entre com um usuário cadastrado no Supabase (Authentication → Users).

---

## Setup do zero (novo ambiente Supabase)

Caso um dia seja necessário recriar o backend do zero (novo projeto Supabase, ambiente de testes separado, etc.), rode os scripts da pasta `sql/` **nesta ordem**, no SQL Editor do Supabase:

1. `001_schema_inicial.sql` — cria a tabela `chamados`, enums de prioridade/status, e as políticas de RLS base.
2. `002_fix_abertura_chamado.sql` — cria a function `abrir_chamado`, usada pelo formulário público (evita expor SELECT geral a usuários anônimos).
3. `003_historico_eventos.sql` — cria a tabela `chamado_eventos` (histórico/timeline) e a trigger que registra mudanças de status automaticamente.
4. `004_consulta_publica.sql` — cria a function `consultar_chamado`, usada pela página `consulta.html`.
5. `005_validacao_rate_limit.sql` — **substitui** a function `abrir_chamado` do passo 2, adicionando validação de tamanho de campos e limite de 5 chamados a cada 2 minutos (proteção contra spam/duplicidade).

Depois, configure:

- **Authentication → Users**: cadastre ao menos um usuário para a equipe de TI logar no painel.
- **Project Settings → Edge Functions → Secrets**: cadastre `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (credenciais da caixa `suporte@farmaderm.com.br` na Localweb).
- Faça o deploy da Edge Function: `supabase functions deploy notificar-novo-chamado --no-verify-jwt`.
- **Database → Webhooks**: crie um webhook de `INSERT` na tabela `chamados`, apontando para a Edge Function `notificar-novo-chamado`.
- Atualize `assets/js/supabase-client.js` com a nova URL e `anon key` do projeto.

---

## Deploy no IIS

*(Seção a ser detalhada quando fizermos o deploy real — ainda não realizado até o momento desta versão do README.)*

Resumo do que será necessário:
1. Copiar todos os arquivos do projeto (exceto as pastas `sql/` e `supabase/`, que não vão para o navegador) para a pasta do site no servidor.
2. Criar um site no IIS Manager apontando para essa pasta, com binding na porta desejada.
3. Como é um site 100% estático, **não é necessário instalar nenhum runtime** (sem .NET Hosting Bundle, sem Node) — o IIS só precisa servir arquivos.

---

## Funcionalidades já implementadas

- [x] Abertura de chamado público (nome, setor, descrição, prioridade)
- [x] Consulta pública de status por número de protocolo
- [x] Login da equipe de TI (Supabase Auth)
- [x] Painel admin com abas por status (Aberto / Em andamento / Resolvido / Fechado)
- [x] Filtro por prioridade no painel
- [x] Histórico/timeline automático de mudanças de status
- [x] Anotações internas da TI por chamado (não visíveis ao solicitante)
- [x] Notificação por e-mail (SMTP Localweb) a cada novo chamado
- [x] Validação de tamanho de campos (frontend + backend)
- [x] Rate limiting básico contra spam de chamados
- [x] Sessão expirada redireciona automaticamente para o login
- [x] Confirmação antes de marcar chamado como "Fechado"
- [x] Painel admin responsivo (mobile)

---

## Segurança (RLS)

Toda a segurança de acesso a dados vive no banco, via Row Level Security — não no frontend (que é código público, visível a qualquer um). Resumo das regras atuais:

| Tabela | Quem pode ler | Quem pode escrever |
|---|---|---|
| `chamados` | Só autenticados (equipe de TI) veem a lista completa. Público só consulta via function `consultar_chamado`, que retorna campos limitados. | Público pode **criar** (via function `abrir_chamado`). Só autenticados podem **atualizar** status. |
| `chamado_eventos` | Só autenticados | Só autenticados |

**Ponto de atenção:** hoje, qualquer usuário autenticado no projeto Supabase é tratado como "admin" — não existe diferenciação de papéis (ex: TI Nível 1 vs Gestor). Ver Roadmap.

---

## Notificação por e-mail

- Serviço usado: SMTP da Localweb (`email-ssl.com.br`, porta 465), reaproveitando a caixa `suporte@farmaderm.com.br` já existente.
- Disparo: Database Webhook no Supabase, configurado para o evento `INSERT` na tabela `chamados`, chamando a Edge Function `notificar-novo-chamado`.
- Credenciais SMTP ficam nos **Secrets** do projeto Supabase — nunca no código do repositório.
- Logs de erro de envio: painel do Supabase → Edge Functions → `notificar-novo-chamado` → aba Logs.

---

## Roadmap / próximos passos

Itens já mapeados e priorizados, ainda não implementados:

**Quick wins (alto impacto, baixo esforço):**
- Busca por texto/protocolo no painel admin
- Campo de e-mail/telefone do solicitante no formulário
- Categoria do chamado (Hardware, Software, Rede, Acesso, etc.)
- Indicador de tempo em aberto na listagem

**Versão 2.0 (maior esforço):**
- Papéis de usuário (RBAC) — diferenciar TI Nível 1 de Gestor
- Upload de anexos/prints (via Supabase Storage)
- SLA com escalonamento automático
- Dashboard de métricas (tempo médio de resolução, volume por setor)
- Base de conhecimento / FAQ

**Ainda pendente de decisão/execução:**
- Deploy real no IIS (documentado apenas em resumo acima)
- Ambiente de testes separado do banco de produção
