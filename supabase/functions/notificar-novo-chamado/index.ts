// ============================================================
// Edge Function: notificar-novo-chamado
// Dispara um e-mail para suporte@farmaderm.com.br sempre que
// um novo chamado é inserido na tabela `chamados`.
//
// Acionada por um Database Webhook (configurado no painel do
// Supabase), que envia o registro recém-criado no corpo da
// requisição no formato: { type, table, record, old_record }
// ============================================================

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const LABELS_PRIORIDADE: Record<string, string> = {
  critico: "🔴 CRÍTICO - Máquina parada",
  normal: "🟡 Normal",
  baixo: "🟢 Baixa - verificar posteriormente",
};

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const chamado = payload.record;

    if (!chamado) {
      return new Response(
        JSON.stringify({ ok: false, error: "Payload sem 'record'." }),
        { status: 400 }
      );
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Number(Deno.env.get("SMTP_PORT"));
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.error("Secrets SMTP não configurados corretamente.");
      return new Response(
        JSON.stringify({ ok: false, error: "Configuração SMTP ausente." }),
        { status: 500 }
      );
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    const prioridadeTexto = LABELS_PRIORIDADE[chamado.prioridade] ?? chamado.prioridade;

    await client.send({
      from: smtpUser,
      to: "suporte@farmaderm.com.br",
      subject: `Novo chamado #${chamado.numero_protocolo} — ${prioridadeTexto}`,
      content: "auto",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px;">
          <h2 style="color:#0e9b7a; margin-bottom: 4px;">Novo chamado aberto</h2>
          <p style="color:#666; margin-top:0;">Farmaderm Help Desk</p>

          <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding:6px 0; font-weight:bold; width:140px;">Protocolo</td>
              <td style="padding:6px 0;">#${chamado.numero_protocolo}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; font-weight:bold;">Solicitante</td>
              <td style="padding:6px 0;">${chamado.nome_solicitante}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; font-weight:bold;">Setor</td>
              <td style="padding:6px 0;">${chamado.setor}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; font-weight:bold;">Prioridade</td>
              <td style="padding:6px 0;">${prioridadeTexto}</td>
            </tr>
          </table>

          <p style="font-weight:bold; margin-top:16px; margin-bottom:4px;">Descrição:</p>
          <p style="background:#f4f6f7; padding:12px; border-radius:6px; white-space:pre-wrap;">${chamado.descricao}</p>

          <p style="color:#999; font-size:12px; margin-top:24px;">
            Este é um e-mail automático do sistema de Help Desk. Não responda diretamente a esta mensagem.
          </p>
        </div>
      `,
    });

    await client.close();

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("Erro ao enviar e-mail de notificação:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500 }
    );
  }
});
