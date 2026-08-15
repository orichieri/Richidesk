-- ============================================================
-- Robustez: validação de tamanho + rate limiting na abertura
-- de chamados (proteção contra spam/duplicidade acidental)
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
  v_chamados_recentes integer;
begin
  -- Validação de tamanho (segunda camada, o front-end já valida também)
  if length(trim(p_nome)) < 2 or length(p_nome) > 100 then
    raise exception 'Nome inválido.';
  end if;

  if length(trim(p_setor)) < 2 or length(p_setor) > 60 then
    raise exception 'Setor inválido.';
  end if;

  if length(trim(p_descricao)) < 5 or length(p_descricao) > 2000 then
    raise exception 'Descrição inválida.';
  end if;

  -- Rate limiting simples: no máximo 5 chamados abertos por qualquer
  -- pessoa nos últimos 2 minutos. Protege contra clique duplicado,
  -- bots ou erro de integração, sem precisar rastrear IP/usuário.
  select count(*) into v_chamados_recentes
  from chamados
  where created_at > now() - interval '2 minutes';

  if v_chamados_recentes >= 5 then
    raise exception 'Muitos chamados abertos em um curto período. Aguarde alguns minutos e tente novamente.';
  end if;

  insert into chamados (nome_solicitante, setor, descricao, prioridade)
  values (trim(p_nome), trim(p_setor), trim(p_descricao), p_prioridade)
  returning numero_protocolo into v_numero;

  return v_numero;
end;
$$;

grant execute on function abrir_chamado(text, text, text, prioridade_chamado) to anon;
