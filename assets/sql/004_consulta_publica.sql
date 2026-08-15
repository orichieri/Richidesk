-- ============================================================
-- Consulta pública de chamado por número de protocolo
-- Retorna apenas os dados necessários para o solicitante
-- acompanhar o próprio chamado, sem abrir SELECT geral na tabela
-- ============================================================

create or replace function consultar_chamado(p_numero_protocolo integer)
returns table (
  numero_protocolo integer,
  nome_solicitante text,
  setor text,
  prioridade prioridade_chamado,
  status status_chamado,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      c.numero_protocolo,
      c.nome_solicitante,
      c.setor,
      c.prioridade,
      c.status,
      c.created_at,
      c.updated_at
    from chamados c
    where c.numero_protocolo = p_numero_protocolo;
end;
$$;

grant execute on function consultar_chamado(integer) to anon;
