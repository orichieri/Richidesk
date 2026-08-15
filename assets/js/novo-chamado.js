// ============================================================
// Envio do formulário de abertura de chamado
// ============================================================

const form = document.getElementById("form-chamado");
const btnEnviar = document.getElementById("btn-enviar");
const mensagemEl = document.getElementById("mensagem");

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const setor = document.getElementById("setor").value.trim();
  const descricao = document.getElementById("descricao").value.trim();
  const prioridade = document.querySelector('input[name="prioridade"]:checked').value;

  // Validações básicas antes de gastar uma chamada de rede
  if (nome.length < 2 || nome.length > 100) {
    mensagemEl.className = "msg erro";
    mensagemEl.textContent = "Informe um nome válido (entre 2 e 100 caracteres).";
    return;
  }
  if (setor.length < 2 || setor.length > 60) {
    mensagemEl.className = "msg erro";
    mensagemEl.textContent = "Informe um setor válido (entre 2 e 60 caracteres).";
    return;
  }
  if (descricao.length < 5 || descricao.length > 2000) {
    mensagemEl.className = "msg erro";
    mensagemEl.textContent = "Descreva o problema com pelo menos 5 caracteres (máximo 2000).";
    return;
  }

  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviando...";
  mensagemEl.className = "msg";
  mensagemEl.textContent = "";

  const { data: numeroProtocolo, error } = await supabaseClient.rpc("abrir_chamado", {
    p_nome: nome,
    p_setor: setor,
    p_descricao: descricao,
    p_prioridade: prioridade
  });

  btnEnviar.disabled = false;
  btnEnviar.textContent = "Abrir chamado";

  if (error) {
    console.error(error);
    mensagemEl.className = "msg erro";
    // Exibe a mensagem específica vinda da validação do banco (ex: rate limit),
    // com uma mensagem genérica de fallback para erros inesperados de rede/conexão.
    mensagemEl.textContent = error.message && error.message.length < 200
      ? error.message
      : "Não foi possível abrir o chamado. Tente novamente ou contate a TI diretamente.";
    return;
  }

  mensagemEl.className = "msg sucesso";
  mensagemEl.textContent = `Chamado #${numeroProtocolo} aberto com sucesso! Anote esse número — você pode consultar o status a qualquer momento na página "Consultar chamado".`;
  form.reset();
});
