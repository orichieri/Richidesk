# RichieriDesk

Sistema interno de Help Desk da Farmaderm para abertura de chamados de suporte técnico.

## Estrutura

- `index.html` — formulário de abertura de chamado
- `assets/css/` — estilos
- `assets/js/` — lógica e integração com Supabase
- farmaderm-helpdesk/
└── admin/
    ├── login.html      ← tela de login da equipe de TI
    └── painel.html     ← painel de gestão (lista + filtros + status)
└── assets/js/
    ├── auth.js         ← login, logout e proteção de página
    └── painel.js       ← listagem, filtros e troca de status

## Uso

Abra `index.html` em um navegador ou sirva os arquivos com um servidor HTTP estático.
