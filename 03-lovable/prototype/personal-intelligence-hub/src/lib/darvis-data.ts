// Dados fictícios do protótipo (Fase 1). Nada aqui vem de serviços reais.
export type Status = "implementado" | "simulado" | "planejado";

export const tasks = [
  { id: 1, title: "Revisar arquitetura do backend FastAPI", due: "Hoje, 14:00", priority: "alta", done: false, project: "D.A.R.V.I.S." },
  { id: 2, title: "Definir esquema de memória no PostgreSQL", due: "Hoje, 18:00", priority: "alta", done: false, project: "D.A.R.V.I.S." },
  { id: 3, title: "Comprar café e filtros", due: "Amanhã", priority: "baixa", done: false, project: "Pessoal" },
  { id: 4, title: "Ler capítulo 4 — Designing Data-Intensive Apps", due: "Sex", priority: "média", done: false, project: "Estudos" },
  { id: 5, title: "Pagar fatura do cartão", due: "Ontem", priority: "alta", done: true, project: "Finanças" },
];

export const events = [
  { time: "10:00", title: "Call de alinhamento — projeto cliente" },
  { time: "15:30", title: "Academia" },
  { time: "20:00", title: "Sessão de estudo: agentes de IA" },
];

export const projects = [
  { id: "darvis", name: "D.A.R.V.I.S.", desc: "Ecossistema de inteligência pessoal", progress: 18, phase: "Fase 1 — Protótipo", open: 12 },
  { id: "vault", name: "Obsidian Vault", desc: "Reorganização da base de conhecimento", progress: 42, phase: "Estruturação", open: 5 },
  { id: "fit", name: "Rotina de saúde", desc: "Treino, sono e alimentação", progress: 65, phase: "Em andamento", open: 3 },
  { id: "study", name: "Estudos de IA", desc: "LLMs, RAG e agentes", progress: 30, phase: "Contínuo", open: 7 },
];

export const memories = [
  { id: 1, cat: "Preferência", text: "Prefere reuniões pela manhã, antes das 11h.", date: "12 nov", links: 3 },
  { id: 2, cat: "Projeto", text: "D.A.R.V.I.S. deve usar Gemini inicialmente, com camada multi-provedor.", date: "15 nov", links: 5 },
  { id: 3, cat: "Pessoa", text: "Marina — contato do projeto cliente, prefere e-mail.", date: "10 nov", links: 2 },
  { id: 4, cat: "Ideia", text: "Captura rápida de notas por Telegram com classificação automática.", date: "16 nov", links: 4 },
  { id: 5, cat: "Conhecimento", text: "Busca semântica com pgvector planejada para fase posterior.", date: "17 nov", links: 1 },
  { id: 6, cat: "Rotina", text: "Revisão semanal aos domingos às 19h.", date: "08 nov", links: 2 },
];

export const activity = [
  { t: "há 5 min", text: "Memória registrada: captura rápida via Telegram" },
  { t: "há 1 h", text: "Tarefa concluída: Pagar fatura do cartão" },
  { t: "há 3 h", text: "Projeto atualizado: Obsidian Vault (42%)" },
  { t: "ontem", text: "Nova ideia vinculada a D.A.R.V.I.S." },
];

export const integrations = [
  { name: "Google Gemini", desc: "Modelo de IA principal", phase: "Fase 4" },
  { name: "Telegram", desc: "Captura rápida e conversa", phase: "Fase 4" },
  { name: "Google Calendar", desc: "Compromissos e agenda", phase: "Fase 5" },
  { name: "Gmail", desc: "Leitura e rascunhos", phase: "Fase 5" },
  { name: "GitHub", desc: "Repositórios e sync do Vault", phase: "Fase 6" },
  { name: "Obsidian", desc: "Vault Markdown", phase: "Fase 6" },
];

export const automations = [
  { name: "Resumo matinal", desc: "Briefing diário às 07:00", phase: "Fase 5" },
  { name: "Classificador de capturas", desc: "Categoriza notas recebidas", phase: "Fase 5" },
  { name: "Revisão semanal", desc: "Domingo, 19:00", phase: "Fase 5" },
];
