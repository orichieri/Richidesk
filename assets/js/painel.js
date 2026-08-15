// ============================================================
// Painel Admin - Abas por status, detalhes e histórico
// ============================================================

const tabelaCorpo = document.getElementById("tabela-corpo");
const contadorEl = document.getElementById("contador");
const filtroPrioridade = document.getElementById("filtro-prioridade");
const abasStatusEl = document.getElementById("abas-status");

let abaAtiva = "aberto";
let chamadoAtualId = null;

const LABELS_PRIORIDADE = {
  critico: { texto: "🔴 Crítico", classe: "badge-critico" },
  normal:  { texto: "🟡 Normal",  classe: "badge-normal" },
  baixo:   { texto: "🟢 Baixo",   classe: "badge-baixo" }
};

const LABELS_STATUS = {
  aberto:        "Aberto",
  em_andamento:  "Em andamento",
  resolvido:     "Resolvido",
  fechado:       "Fechado"
};

function formatarData(isoString) {
  const data = new Date(isoString);
  return data.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

abasStatusEl.addEventListener("click", (evento) => {
  const botao = evento.target.closest(".aba-status");
  if (!botao) return;

  document.querySelectorAll(".aba-status").forEach(b => b.classList.remove("ativa"));
  botao.classList.add("ativa");
  abaAtiva = botao.dataset.status;
  carregarChamados();
});

filtroPrioridade.addEventListener("change", carregarChamados);

async function carregarContadoresAbas() {
  for (const status of Object.keys(LABELS_STATUS)) {
    const { count } = await supabaseClient
      .from("chamados")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
    document.getElementById(`contador-${status}`).textContent = count ?? 0;
  }
}

async function carregarChamados() {
  tabelaCorpo.innerHTML = `<tr><td colspan="7">Carregando chamados...</td></tr>`;
  carregarContadoresAbas();

  let query = supabaseClient
    .from("chamados")
    .select("*")
    .eq("status", abaAtiva)
    .order("created_at", { ascending: false });

  if (filtroPrioridade.value) {
    query = query.eq("prioridade", filtroPrioridade.value);
  }

  const { data: chamados, error } = await query;

  if (error) {
    console.error(error);
    tabelaCorpo.innerHTML = `<tr><td colspan="7">Erro ao carregar chamados. Verifique o console.</td></tr>`;
    contadorEl.textContent = "";
    return;
  }

  contadorEl.textContent = `${chamados.length} chamado(s) nesta aba`;

  if (chamados.length === 0) {
    tabelaCorpo.innerHTML = `
      <tr><td colspan="7">
        <div class="painel-vazio">
          <div class="emoji-grande">✅</div>
          Nenhum chamado nesta aba.
        </div>
      </td></tr>`;
    return;
  }

  tabelaCorpo.innerHTML = chamados.map((chamado) => {
    const prio = LABELS_PRIORIDADE[chamado.prioridade];
    return `
      <tr class="linha-chamado" data-id="${chamado.id}">
        <td class="protocolo">#${chamado.numero_protocolo}</td>
        <td>${escapeHtml(chamado.nome_solicitante)}</td>
        <td>${escapeHtml(chamado.setor)}</td>
        <td style="max-width: 280px;">${escapeHtml(chamado.descricao)}</td>
        <td><span class="badge ${prio.classe}">${prio.texto}</span></td>
        <td>${formatarData(chamado.created_at)}</td>
        <td><button class="btn-secundario btn-abrir-detalhe" data-id="${chamado.id}">Ver detalhes</button></td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll(".btn-abrir-detalhe").forEach((btn) => {
    btn.addEventListener("click", () => abrirModal(btn.dataset.id));
  });
}

const modalOverlay = document.getElementById("modal-overlay");

async function abrirModal(chamadoId) {
  chamadoAtualId = chamadoId;

  const { data: chamado, error } = await supabaseClient
    .from("chamados")
    .select("*")
    .eq("id", chamadoId)
    .single();

  if (error) {
    alert("Não foi possível carregar os detalhes do chamado.");
    console.error(error);
    return;
  }

  const prio = LABELS_PRIORIDADE[chamado.prioridade];

  document.getElementById("modal-protocolo").textContent = `#${chamado.numero_protocolo}`;
  document.getElementById("modal-badge-prioridade").textContent = prio.texto;
  document.getElementById("modal-badge-prioridade").className = `badge ${prio.classe}`;
  document.getElementById("modal-nome").textContent = chamado.nome_solicitante;
  document.getElementById("modal-setor").textContent = chamado.setor;
  document.getElementById("modal-descricao").textContent = chamado.descricao;
  document.getElementById("modal-select-status").value = chamado.status;
  document.getElementById("modal-nova-nota").value = "";

  await carregarTimeline(chamadoId);

  modalOverlay.classList.add("aberto");
}

function fecharModal() {
  modalOverlay.classList.remove("aberto");
  chamadoAtualId = null;
}

modalOverlay.addEventListener("click", (evento) => {
  if (evento.target === modalOverlay) fecharModal();
});

async function carregarTimeline(chamadoId) {
  const timelineEl = document.getElementById("modal-timeline");
  timelineEl.innerHTML = `<div class="timeline-vazio">Carregando histórico...</div>`;

  const { data: eventos, error } = await supabaseClient
    .from("chamado_eventos")
    .select("*")
    .eq("chamado_id", chamadoId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    timelineEl.innerHTML = `<div class="timeline-vazio">Erro ao carregar histórico.</div>`;
    return;
  }

  if (eventos.length === 0) {
    timelineEl.innerHTML = `<div class="timeline-vazio">Nenhum evento registrado ainda.</div>`;
    return;
  }

  timelineEl.innerHTML = eventos.map((evento) => `
    <div class="timeline-item timeline-${evento.tipo}">
      <div class="timeline-icone">${evento.tipo === "status" ? "🔄" : "📝"}</div>
      <div class="timeline-conteudo">
        <div class="timeline-texto">${escapeHtml(evento.descricao)}</div>
        <div class="timeline-meta">
          ${evento.autor_email ? escapeHtml(evento.autor_email) + " · " : ""}${formatarData(evento.created_at)}
        </div>
      </div>
    </div>
  `).join("");
}

document.getElementById("modal-select-status").addEventListener("change", async (evento) => {
  const novoStatus = evento.target.value;

  const { error } = await supabaseClient
    .from("chamados")
    .update({ status: novoStatus })
    .eq("id", chamadoAtualId);

  if (error) {
    alert("Não foi possível atualizar o status.");
    console.error(error);
    return;
  }

  await carregarTimeline(chamadoAtualId);
  await carregarContadoresAbas();
  carregarChamados();
});

document.getElementById("modal-btn-salvar-nota").addEventListener("click", async () => {
  const textoNota = document.getElementById("modal-nova-nota").value.trim();
  if (!textoNota) return;

  const btn = document.getElementById("modal-btn-salvar-nota");
  btn.disabled = true;
  btn.textContent = "Salvando...";

  const { data: sessao } = await supabaseClient.auth.getSession();
  const autorEmail = sessao.session?.user?.email ?? null;

  const { error } = await supabaseClient
    .from("chamado_eventos")
    .insert([{
      chamado_id: chamadoAtualId,
      tipo: "nota",
      descricao: textoNota,
      autor_email: autorEmail
    }]);

  btn.disabled = false;
  btn.textContent = "Registrar anotação";

  if (error) {
    alert("Não foi possível salvar a anotação.");
    console.error(error);
    return;
  }

  document.getElementById("modal-nova-nota").value = "";
  await carregarTimeline(chamadoAtualId);
});

(async () => {
  await exigirLogin();
  await carregarChamados();
})();
