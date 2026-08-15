-- ============================================================
-- Histórico de eventos do chamado (notas da TI + trocas de status)
-- ============================================================

create type tipo_evento as enum ('nota', 'status');

create table chamado_eventos (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null references chamados(id) on delete cascade,
  tipo tipo_evento not null,
  descricao text not null,
  autor_email text,                 -- e-mail de quem fez a ação (equipe de TI)
  created_at timestamptz not null default now()
);

create index idx_chamado_eventos_chamado_id on chamado_eventos(chamado_id);

-- Segurança: só autenticados (equipe de TI) leem e criam eventos
alter table chamado_eventos enable row level security;

create policy "Autenticados podem ver eventos"
on chamado_eventos for select
to authenticated
using (true);

create policy "Autenticados podem criar eventos"
on chamado_eventos for insert
to authenticated
with check (true);

-- ============================================================
-- Trigger: toda vez que o status de um chamado mudar,
-- registra automaticamente um evento no histórico
-- ============================================================
create or replace function log_mudanca_status()
returns trigger as $$
begin
  if new.status is distinct from old.status then
    insert into chamado_eventos (chamado_id, tipo, descricao, autor_email)
    values (
      new.id,
      'status',
      'Status alterado de "' || old.status || '" para "' || new.status || '"',
      auth.email()
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_log_mudanca_status
after update on chamados
for each row execute function log_mudanca_status();
