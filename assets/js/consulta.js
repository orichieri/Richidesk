// ============================================================
// Consulta pública de chamado por número de protocolo
// ============================================================

const formConsulta = document.getElementById("form-consulta");
const btnConsultar = document.getElementById("btn-consultar");
const mensagemConsultaEl = document.getElementById("mensagem");
const resultadoEl = document.getElementById("resultado-consulta");

const LABELS_PRIORIDADE = {
  critico: { texto: "🔴 Crítico / Máquina parada", classe: "badge-critico" },
  normal:  { texto: "🟡 Normal",  classe: "badge-normal" },
  baixo:   { texto: "🟢 Baixa / Verificar posteriormente", classe: "badge-baixo" }
};

const LABELS_STATUS = {
  aberto:        { texto: "Aberto",        classe: "status-aberto" },
  em_andamento:  { texto: "Em andamento",  classe: "status-em_andamento" },
  resolvido:     { texto: "Resolvido",     classe: "status-resolvido" },
  fechado:       { texto: "Fechado",       classe: "status-fechado" }
};

function formatarData(isoString) {
  const data = new Date(isoString);
  return data.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

formConsulta.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const numero = document.getElementById("numero-protocolo").value.trim();
  resultadoEl.innerHTML = "";
  mensagemConsultaEl.className = "msg";

  if (!numero || isNaN(numero)) {
    mensagemConsultaEl.className = "msg erro";
    mensagemConsultaEl.textContent = "Digite um número de protocolo válido.";
    return;
  }

  btnConsultar.disabled = true;
  btnConsultar.textContent = "Consultando...";

  const { data, error } = await supabaseClient.rpc("consultar_chamado", {
    p_numero_protocolo: Number(numero)
  });

  btnConsultar.disabled = false;
  btnConsultar.textContent = "Consultar";

  if (error) {
    console.error(error);
    mensagemConsultaEl.className = "msg erro";
    mensagemConsultaEl.textContent = "Não foi possível consultar. Tente novamente.";
    return;
  }

  if (!data || data.length === 0) {
    mensagemConsultaEl.className = "msg erro";
    mensagemConsultaEl.textContent = "Nenhum chamado encontrado com esse número de protocolo.";
    return;
  }

  const chamado = data[0];
  const prio = LABELS_PRIORIDADE[chamado.prioridade];
  const status = LABELS_STATUS[chamado.status];

  resultadoEl.innerHTML = `
    <div class="card" style="margin-top: 20px; background: #fbfcfc;">
      <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 14px;">
        <span class="protocolo" style="font-size:1.2rem;">#${chamado.numero_protocolo}</span>
        <span class="badge badge-status ${status.classe}">${status.texto}</span>
      </div>
      <p style="margin: 6px 0;"><strong>Solicitante:</strong> ${escapeHtml(chamado.nome_solicitante)}</p>
      <p style="margin: 6px 0;"><strong>Setor:</strong> ${escapeHtml(chamado.setor)}</p>
      <p style="margin: 6px 0;"><strong>Prioridade:</strong> <span class="badge ${prio.classe}">${prio.texto}</span></p>
      <p style="margin: 6px 0; color: var(--cor-texto-suave); font-size: 0.85rem;">
        Aberto em ${formatarData(chamado.created_at)} · Última atualização em ${formatarData(chamado.updated_at)}
      </p>
    </div>
  `;
});

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
