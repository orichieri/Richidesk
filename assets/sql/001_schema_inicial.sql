-- ============================================================
-- 1. Tipos enumerados (prioridade e status)
-- ============================================================
create type prioridade_chamado as enum ('critico', 'normal', 'baixo');
create type status_chamado as enum ('aberto', 'em_andamento', 'resolvido', 'fechado');

-- ============================================================
-- 2. Tabela principal de chamados
-- ============================================================
create table chamados (
  id uuid primary key default gen_random_uuid(),
  numero_protocolo serial unique,           -- número sequencial amigável (ex: #47)
  nome_solicitante text not null,
  setor text not null,
  descricao text not null,
  prioridade prioridade_chamado not null default 'normal',
  status status_chamado not null default 'aberto',
  observacao_admin text,                     -- notas da equipe de TI
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. Trigger para atualizar "updated_at" automaticamente
-- ============================================================
create or replace function atualizar_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_atualizar_updated_at
before update on chamados
for each row execute function atualizar_updated_at();

-- ============================================================
-- 4. Segurança (Row Level Security)
-- ============================================================
alter table chamados enable row level security;

-- Qualquer pessoa (mesmo sem login) pode ABRIR um chamado
create policy "Qualquer um pode criar chamado"
on chamados for insert
to anon
with check (true);

-- Só usuários autenticados (equipe de TI) podem VER todos os chamados
create policy "Autenticados podem ver chamados"
on chamados for select
to authenticated
using (true);

-- Só usuários autenticados podem ATUALIZAR (mudar status, adicionar observação)
create policy "Autenticados podem atualizar chamados"
on chamados for update
to authenticated
using (true)
with check (true);

-- NOTA: este script foi complementado depois pelos scripts 002, 003, 004 e 005.
-- Veja o README.md para a ordem de execução completa em um projeto novo.
