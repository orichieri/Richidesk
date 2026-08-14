// ============================================================
// Autenticação da equipe de TI
// ============================================================

const formLogin = document.getElementById("form-login");
const btnLogin = document.getElementById("btn-login");
const mensagemLoginEl = document.getElementById("mensagem");

if (formLogin) {
  formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    btnLogin.disabled = true;
    btnLogin.textContent = "Entrando...";
    mensagemLoginEl.className = "msg";

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: senha
    });

    if (error) {
      btnLogin.disabled = false;
      btnLogin.textContent = "Entrar";
      mensagemLoginEl.className = "msg erro";
      mensagemLoginEl.textContent = "E-mail ou senha inválidos.";
      return;
    }

    window.location.href = "painel.html";
  });
}

// ------------------------------------------------------------
// Função usada pelas páginas protegidas (painel.html) para
// garantir que só usuários logados acessem o conteúdo
// ------------------------------------------------------------
async function exigirLogin() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
  }
  return data.session;
}

async function sair() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}
