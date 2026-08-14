// ============================================================
// Configuração de conexão com o Supabase
// Farmaderm - Sistema de Help Desk
// ============================================================

const SUPABASE_URL = "https://beahofkeuxuglyocbwnk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlYWhvZmtldXh1Z2x5b2Nid25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTUxMzQsImV4cCI6MjEwMjI5MTEzNH0.KOuVMOvtY5bzOfka8Rtwb6yHDrlAOb-Osp0N1GKM7eA";

// Cria o cliente global do Supabase (a biblioteca é carregada via CDN no HTML)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
