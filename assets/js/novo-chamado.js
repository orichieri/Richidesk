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
    mensagemEl.textContent = "Não foi possível abrir o chamado. Tente novamente ou contate a TI diretamente.";
    return;
  }

  mensagemEl.className = "msg sucesso";
  mensagemEl.textContent = `Chamado #${numeroProtocolo} aberto com sucesso! Anote esse número para acompanhamento.`;
  form.reset();
});
