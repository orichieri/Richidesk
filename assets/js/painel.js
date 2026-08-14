// ============================================================
// Painel Admin - Listagem, filtros e atualização de status
// ============================================================

const tabelaCorpo = document.getElementById("tabela-corpo");
const contadorEl = document.getElementById("contador");
const filtroStatus = document.getElementById("filtro-status");
const filtroPrioridade = document.getElementById("filtro-prioridade");

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

async function carregarChamados() {
  tabelaCorpo.innerHTML = `<tr><td colspan="7">Carregando chamados...</td></tr>`;

  let query = supabaseClient
    .from("chamados")
    .select("*")
    .order("created_at", { ascending: false });

  if (filtroStatus.value) {
    query = query.eq("status", filtroStatus.value);
  }
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

  contadorEl.textContent = `${chamados.length} chamado(s)`;

  if (chamados.length === 0) {
    tabelaCorpo.innerHTML = `
      <tr><td colspan="7">
        <div class="painel-vazio">
          <div class="emoji-grande">✅</div>
          Nenhum chamado encontrado com esse filtro.
        </div>
      </td></tr>`;
    return;
  }

  tabelaCorpo.innerHTML = chamados.map((chamado) => {
    const prio = LABELS_PRIORIDADE[chamado.prioridade];
    return `
      <tr>
        <td class="protocolo">#${chamado.numero_protocolo}</td>
        <td>${escapeHtml(chamado.nome_solicitante)}</td>
        <td>${escapeHtml(chamado.setor)}</td>
        <td style="max-width: 280px;">${escapeHtml(chamado.descricao)}</td>
        <td><span class="badge ${prio.classe}">${prio.texto}</span></td>
        <td>${formatarData(chamado.created_at)}</td>
        <td>
          <select class="select-status" data-id="${chamado.id}">
            ${Object.entries(LABELS_STATUS).map(([valor, texto]) =>
              `<option value="${valor}" ${chamado.status === valor ? "selected" : ""}>${texto}</option>`
            ).join("")}
          </select>
        </td>
      </tr>
    `;
  }).join("");

  // Liga o evento de troca de status em cada select recém-criado
  document.querySelectorAll(".select-status").forEach((select) => {
    select.addEventListener("change", async (evento) => {
      const id = evento.target.dataset.id;
      const novoStatus = evento.target.value;

      const { error } = await supabaseClient
        .from("chamados")
        .update({ status: novoStatus })
        .eq("id", id);

      if (error) {
        alert("Não foi possível atualizar o status. Verifique sua conexão.");
        console.error(error);
        carregarChamados(); // reverte visualmente recarregando
      }
    });
  });
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

filtroStatus.addEventListener("change", carregarChamados);
filtroPrioridade.addEventListener("change", carregarChamados);

// ------------------------------------------------------------
// Inicialização: exige login e carrega a lista
// ------------------------------------------------------------
(async () => {
  await exigirLogin();
  await carregarChamados();
})();
