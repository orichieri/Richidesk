-- ============================================================
-- Correção: function para abertura de chamado por usuário anônimo
-- Evita precisar liberar SELECT público na tabela inteira
-- ============================================================

create or replace function abrir_chamado(
  p_nome text,
  p_setor text,
  p_descricao text,
  p_prioridade prioridade_chamado
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero integer;
begin
  insert into chamados (nome_solicitante, setor, descricao, prioridade)
  values (p_nome, p_setor, p_descricao, p_prioridade)
  returning numero_protocolo into v_numero;

  return v_numero;
end;
$$;

-- Libera para o público (anon) executar essa function específica
grant execute on function abrir_chamado(text, text, text, prioridade_chamado) to anon;
