import type { DarvisState, IntegrationService } from '../types/darvis';

function shiftLocalDateKey(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const PLANNED_INTEGRATIONS: IntegrationService[] = [
  {
    id: 'int-gemini',
    name: 'Google Gemini API',
    category: 'Motor de Inteligência',
    description:
      'Camada principal de raciocínio e linguagem natural via proxy server-side (/api/ai/chat) com abstração de provedor.',
    maturity: 'implemented',
    connected: true,
    targetPhase: 'Fase 1 / Fase 4',
    architectureNote: 'SDK @google/genai no backend Express · Modelo gemini-4-hydrogen.',
  },
  {
    id: 'int-telegram',
    name: 'Telegram Bot & Canal Rápido',
    category: 'Mensageria & Captura',
    description:
      'Canal móvel para captura rápida de notas, áudios, tarefas e consultas em linguagem natural via webhook.',
    maturity: 'planned',
    connected: false,
    targetPhase: 'Fase 4',
    architectureNote: 'Webhook via Cloudflare Workers -> Backend FastAPI.',
  },
  {
    id: 'int-obsidian',
    name: 'Obsidian Vault (GitHub Sync)',
    category: 'Memória & Conhecimento',
    description:
      'Sincronização bidirecional de arquivos Markdown com repositório privado no GitHub como fonte soberana de conhecimento.',
    maturity: 'planned',
    connected: false,
    targetPhase: 'Fase 6',
    architectureNote: 'Markdown + Git Sync + Indexação semântica posterior.',
  },
  {
    id: 'int-google',
    name: 'Google Workspace (Calendar & Gmail)',
    category: 'Produtividade & Agenda',
    description:
      'Leitura e criação assistida de compromissos e triagem de e-mails com aprovação humana explícita.',
    maturity: 'planned',
    connected: false,
    targetPhase: 'Fase 5',
    architectureNote: 'OAuth 2.0 client-side com escopos mínimos autorizados.',
  },
  {
    id: 'int-github',
    name: 'GitHub Repositories & Actions',
    category: 'Engenharia & Automação',
    description:
      'Monitoramento de repositórios, issues, pull requests e workflows de CI/CD.',
    maturity: 'planned',
    connected: false,
    targetPhase: 'Fase 5',
    architectureNote: 'GitHub App / Personal Token via backend seguro.',
  },
  {
    id: 'int-voice',
    name: 'Interface de Voz & Agente Windows',
    category: 'Multiplataforma',
    description:
      'Reconhecimento e síntese de voz com agente desktop local para comandos contextuais.',
    maturity: 'planned',
    connected: false,
    targetPhase: 'Fase 7',
    architectureNote: 'Live Audio API + Daemon local Windows.',
  },
];

export const INITIAL_DARVIS_STATE: DarvisState = {
  memories: [
    {
      id: 'mem-1',
      title: 'Princípio de Independência de Modelo de IA',
      content:
        'O modelo de IA (Gemini inicialmente) não é a memória permanente do D.A.R.V.I.S. Todo conhecimento durável deve residir em estrutura própria (PostgreSQL + Markdown/Obsidian).',
      category: 'Decisões',
      tags: ['arquitetura', 'ia', 'soberania'],
      projectId: 'proj-darvis',
      source: 'Demo Inicial',
      createdAt: '2026-11-10T14:20:00Z',
      updatedAt: '2026-11-10T14:20:00Z',
      isDemo: true,
    },
    {
      id: 'mem-2',
      title: 'Stack Alvo do Ecossistema D.A.R.V.I.S.',
      content:
        'Backend previsto em Python + FastAPI, banco PostgreSQL (Supabase inicial) com SQLAlchemy e Alembic, gateway em Cloudflare Workers e execução no Google Cloud Run.',
      category: 'Conhecimento Técnico',
      tags: ['fastapi', 'postgresql', 'cloud-run', 'obsidian'],
      projectId: 'proj-darvis',
      source: 'Demo Inicial',
      createdAt: '2026-11-12T09:15:00Z',
      updatedAt: '2026-11-12T09:15:00Z',
      isDemo: true,
    },
    {
      id: 'mem-3',
      title: 'Diretriz de Segurança: Aprovação Humana',
      content:
        'Ações sensíveis, destrutivas ou que enviem comunicações externas devem exigir confirmação explícita do usuário e gerar registro em trilha de auditoria.',
      category: 'Preferências',
      tags: ['seguranca', 'auditoria', 'governanca'],
      projectId: 'proj-darvis',
      source: 'Demo Inicial',
      createdAt: '2026-11-14T18:00:00Z',
      updatedAt: '2026-11-14T18:00:00Z',
      isDemo: true,
    },
    {
      id: 'mem-4',
      title: 'Organização de Vault no Obsidian',
      content:
        'Estrutura baseada em pastas temáticas (00-Inbox, 10-Projetos, 20-Áreas, 30-Conhecimento, 40-Arquivo) com metadados YAML frontmatter.',
      category: 'Projetos & Ideias',
      tags: ['obsidian', 'markdown', 'pkm'],
      projectId: 'proj-obsidian',
      source: 'Demo Inicial',
      createdAt: '2026-11-15T11:30:00Z',
      updatedAt: '2026-11-15T11:30:00Z',
      isDemo: true,
    },
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Validar protótipo navegável da Fase 1 do D.A.R.V.I.S.',
      category: 'D.A.R.V.I.S.',
      priority: 'alta',
      status: 'em_andamento',
      dueDate: '2026-11-18',
      projectId: 'proj-darvis',
      isDemo: true,
    },
    {
      id: 'task-2',
      title: 'Definir schema inicial PostgreSQL (usuários, memórias, logs)',
      category: 'Backend',
      priority: 'alta',
      status: 'pendente',
      dueDate: '2026-11-21',
      projectId: 'proj-darvis',
      isDemo: true,
    },
    {
      id: 'task-3',
      title: 'Estruturar repositório privado para sincronização Obsidian',
      category: 'Conhecimento',
      priority: 'media',
      status: 'pendente',
      dueDate: '2026-11-25',
      projectId: 'proj-obsidian',
      isDemo: true,
    },
    {
      id: 'task-4',
      title: 'Revisar orçamento mensal de infraestrutura Cloud',
      category: 'Finanças',
      priority: 'baixa',
      status: 'concluida',
      dueDate: '2026-11-16',
      isDemo: true,
    },
  ],
  commitments: [
    {
      id: 'comp-1',
      title: 'Revisão de Arquitetura — Fase 2 (FastAPI + Auth)',
      dateTime: '2026-11-19 · 19:30',
      location: 'Ambiente Local / Workspace',
      category: 'Planejamento',
      isDemo: true,
    },
    {
      id: 'comp-2',
      title: 'Consolidação Semanal da Base de Conhecimento',
      dateTime: '2026-11-22 · 10:00',
      location: 'Obsidian Vault',
      category: 'Rotina PKM',
      isDemo: true,
    },
  ],
  shopping: [
    {
      id: 'shop-1',
      name: 'SSD NVMe 1TB para backup local criptografado',
      category: 'Hardware',
      estimatedCost: 480,
      purchased: false,
      isDemo: true,
    },
    {
      id: 'shop-2',
      name: 'Domínio dedicado para gateway Cloudflare',
      category: 'Infraestrutura',
      estimatedCost: 65,
      purchased: true,
      isDemo: true,
    },
  ],
  finances: [
    {
      id: 'fin-1',
      description: 'Reserva mensal para infraestrutura & APIs',
      amount: 600,
      type: 'receita',
      category: 'Orçamento Tech',
      date: '2026-11-01',
      isDemo: true,
    },
    {
      id: 'fin-2',
      description: 'Cloud Run / Workers (Estimativa Sandbox)',
      amount: 45,
      type: 'despesa',
      category: 'Cloud',
      date: '2026-11-10',
      isDemo: true,
    },
    {
      id: 'fin-3',
      description: 'Registro de domínio anual',
      amount: 65,
      type: 'despesa',
      category: 'Infraestrutura',
      date: '2026-11-12',
      isDemo: true,
    },
  ],
  projects: [
    {
      id: 'proj-darvis',
      name: 'D.A.R.V.I.S. Core Platform',
      objective:
        'Construir o núcleo modular de inteligência pessoal com memória persistente, camada agnóstica de LLM e trilha de auditoria.',
      status: 'ativo',
      phase: 'Fase 1 · Protótipo Navegável',
      milestones: [
        { id: 'ms-1', title: 'Visão de produto e arquitetura conceitual', completed: true },
        { id: 'ms-2', title: 'Protótipo de interface Command Center & Módulos', completed: true },
        { id: 'ms-3', title: 'Integração inicial com Gemini via backend seguro', completed: true },
        { id: 'ms-4', title: 'Backend FastAPI + PostgreSQL (Fase 2/3)', completed: false },
        { id: 'ms-5', title: 'Agentes com ferramentas e aprovações (Fase 5)', completed: false },
      ],
      pendingItems: [
        'Modelar tabelas de auditoria e sessões no PostgreSQL',
        'Definir contrato OpenAPI entre frontend e FastAPI',
      ],
      history: [
        { id: 'h-1', date: '2026-11-17', note: 'Protótipo interativo inicializado com proxy Gemini.' },
        { id: 'h-2', date: '2026-11-12', note: 'Documento de visão e fases 1-7 consolidado.' },
      ],
      updatedAt: '2026-11-17',
      isDemo: true,
    },
    {
      id: 'proj-obsidian',
      name: 'Obsidian Vault & GitHub Sync',
      objective:
        'Integrar arquivos Markdown como memória de conhecimento durável com sincronização automática e futura busca semântica.',
      status: 'planejamento',
      phase: 'Fase 6 · Arquitetura PKM',
      milestones: [
        { id: 'ms-o1', title: 'Padronizar frontmatter YAML das notas', completed: true },
        { id: 'ms-o2', title: 'Criar repositório privado dedicado', completed: false },
        { id: 'ms-o3', title: 'Pipeline de indexação de embeddings', completed: false },
      ],
      pendingItems: ['Definir estratégia de resolução de conflitos Git'],
      history: [
        { id: 'h-o1', date: '2026-11-15', note: 'Taxonomia de pastas 00–40 definida.' },
      ],
      updatedAt: '2026-11-15',
      isDemo: true,
    },
  ],
  notes: [
    {
      id: 'note-1',
      title: 'Arquitetura Conceitual D.A.R.V.I.S.',
      folder: '10-Projetos',
      content: `# Arquitetura Conceitual — D.A.R.V.I.S.

## Princípio Central
O D.A.R.V.I.S. separa **raciocínio** (camada de provedores LLM) de **memória** (PostgreSQL + Vault Markdown).

## Camadas Previstas
1. **Interface Multiplataforma**: Web, PWA Android, Telegram e futuro agente Windows.
2. **Gateway & Webhooks**: Cloudflare Workers para roteamento e segurança de borda.
3. **Núcleo Backend**: Python + FastAPI rodando em Google Cloud Run.
4. **Persistência**: PostgreSQL (Supabase) para dados operacionais e trilha de auditoria.
5. **Base de Conhecimento**: Obsidian Vault sincronizado via GitHub privado.`,
      tags: ['arquitetura', 'visao', 'core'],
      updatedAt: '2026-11-17',
      syncStatus: 'simulated',
      isDemo: true,
    },
    {
      id: 'note-2',
      title: 'Política de Governança e Aprovação Humana',
      folder: '30-Conhecimento',
      content: `# Governança e Segurança

Toda ação sugerida por agentes ou pelo Assistente IA que modifique estado persistente ou dispare integrações externas segue o fluxo:

- **Proposta Estruturada**: O sistema apresenta o resumo exato da operação.
- **Confirmação Explícita**: O usuário aprova ou recusa a execução.
- **Registro Imutável**: Toda aprovação ou recusa é gravada no Log de Auditoria.`,
      tags: ['seguranca', 'governanca'],
      updatedAt: '2026-11-14',
      syncStatus: 'simulated',
      isDemo: true,
    },
  ],
  automations: [
    {
      id: 'auto-1',
      name: 'Briefing Matinal Operacional',
      description:
        'Consolida tarefas prioritárias, compromissos do dia e pendências de projetos ativos em um resumo único.',
      trigger: 'Agendado · Diário às 07:30 (Simulado)',
      agent: 'Agente Organizador',
      requiresApproval: false,
      maturity: 'simulated',
      lastRunAt: null,
      runCount: 0,
    },
    {
      id: 'auto-2',
      name: 'Extração de Memórias de Conversas',
      description:
        'Identifica decisões e preferências relevantes no histórico do assistente e propõe registro na Central de Memória.',
      trigger: 'Evento · Fim de Sessão (Simulado)',
      agent: 'Agente de Memória',
      requiresApproval: true,
      maturity: 'simulated',
      lastRunAt: null,
      runCount: 0,
    },
    {
      id: 'auto-3',
      name: 'Sincronização Noturna Obsidian -> Embeddings',
      description:
        'Varre arquivos Markdown alterados no repositório privado e atualiza o índice semântico no PostgreSQL.',
      trigger: 'Webhook GitHub · Push (Planejado)',
      agent: 'Agente de Conhecimento',
      requiresApproval: false,
      maturity: 'planned',
      lastRunAt: null,
      runCount: 0,
    },
  ],
  auditLog: [
    {
      id: 'log-1',
      timestamp: '2026-11-17T17:40:00Z',
      actor: 'Sistema',
      action: 'Inicialização do Protótipo D.A.R.V.I.S.',
      module: 'dashboard',
      details: 'Ambiente carregado com dados de demonstração claramente identificados.',
      severity: 'info',
    },
    {
      id: 'log-2',
      timestamp: '2026-11-17T17:42:00Z',
      actor: 'Sistema',
      action: 'Verificação de Integrações Externas',
      module: 'integrations',
      details: 'Telegram, Obsidian, Google e GitHub marcados como Não Conectados (Planejado).',
      severity: 'info',
    },
  ],
  chatMessages: [
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        'Sistema D.A.R.V.I.S. pronto. Estou conectado à camada de inteligência via proxy seguro e utilizando suas memórias, tarefas e projetos ativos como contexto.\n\nVocê pode conversar naturalmente, pedir análises de prioridades ou solicitar que eu proponha o registro de uma nova tarefa ou memória para sua aprovação.',
      timestamp: '2026-11-17T17:45:00Z',
      provider: 'Google Gemini',
      model: 'gemini-4-hydrogen',
    },
  ],
  trainingRoutines: [
    {
      id: 'tr-upper',
      name: 'Treino A — Força & Superiores',
      focus: 'Peito, Costas e Ombros',
      estimatedMinutes: 45,
      exercises: [
        { id: 'ex-1', name: 'Supino reto com halteres', sets: '4x10', load: '24 kg', completed: false },
        { id: 'ex-2', name: 'Remada curvada pronada', sets: '4x10', load: '50 kg', completed: false },
        { id: 'ex-3', name: 'Desenvolvimento militar', sets: '3x12', load: '16 kg', completed: false },
        { id: 'ex-4', name: 'Puxada frontal aberta', sets: '3x12', load: '45 kg', completed: false },
      ],
    },
    {
      id: 'tr-lower',
      name: 'Treino B — Inferiores & Core',
      focus: 'Quadríceps, Posterior e Estabilidade',
      estimatedMinutes: 50,
      exercises: [
        { id: 'ex-5', name: 'Agachamento livre', sets: '4x8', load: '70 kg', completed: false },
        { id: 'ex-6', name: 'Levantamento terra romeno', sets: '4x10', load: '60 kg', completed: false },
        { id: 'ex-7', name: 'Prancha isométrica', sets: '3x60s', load: 'Corporal', completed: false },
      ],
    },
    {
      id: 'tr-cardio',
      name: 'Treino C — Cardio & Mobilidade',
      focus: 'Condicionamento Zona 2 & Recuperação',
      estimatedMinutes: 35,
      exercises: [
        { id: 'ex-8', name: 'Corrida / Esteira Zona 2', sets: '1x25m', load: 'FC 135-145', completed: false },
        { id: 'ex-9', name: 'Mobilidade de quadril e torácica', sets: '3x8', load: 'Corporal', completed: false },
      ],
    },
  ],
  trainingHistory: [
    {
      id: 'tlog-1',
      routineName: 'Treino A — Força & Superiores',
      completedAt: '2026-11-16T07:45:00Z',
      durationSeconds: 2640,
      exercisesCompleted: 4,
      totalExercises: 4,
      notes: 'Boa progressão de carga na remada.',
    },
  ],
  dailyHabits: [
    {
      id: 'habit-hydration',
      title: 'Hidratação',
      category: 'Saúde',
      targetLabel: '2,5L / dia',
      completedDates: [shiftLocalDateKey(-4), shiftLocalDateKey(-3), shiftLocalDateKey(-2), shiftLocalDateKey(-1)],
      isDemo: true,
    },
    {
      id: 'habit-reading',
      title: 'Leitura',
      category: 'Conhecimento',
      targetLabel: '20 min',
      completedDates: [shiftLocalDateKey(-2), shiftLocalDateKey(-1)],
      isDemo: true,
    },
    {
      id: 'habit-exercise',
      title: 'Exercício',
      category: 'Treino',
      targetLabel: '45 min',
      completedDates: [shiftLocalDateKey(-3), shiftLocalDateKey(-2), shiftLocalDateKey(-1), shiftLocalDateKey(0)],
      isDemo: true,
    },
    {
      id: 'habit-review',
      title: 'Revisão D.A.R.V.I.S.',
      category: 'Produtividade',
      targetLabel: '10 min',
      completedDates: [shiftLocalDateKey(-1)],
      isDemo: true,
    },
  ],
  longTermGoals: [
    {
      id: 'goal-darvis-platform',
      title: 'Consolidar Ecossistema D.A.R.V.I.S. Multiplataforma',
      domain: 'Carreira & Projetos',
      horizon: '2026–2027',
      linkedProjectId: 'proj-darvis',
      milestones: [],
      isDemo: true,
    },
    {
      id: 'goal-financial-reserve',
      title: 'Reserva Estratégica & Independência Financeira',
      domain: 'Finanças',
      horizon: '12 meses',
      milestones: [
        { id: 'gm-fin-1', title: 'Mapear custos fixos e infraestrutura Cloud', completed: true },
        { id: 'gm-fin-2', title: 'Atingir 3 meses de reserva líquida', completed: true },
        { id: 'gm-fin-3', title: 'Atingir 6 meses de reserva líquida', completed: false },
        { id: 'gm-fin-4', title: 'Automatizar aportes mensais recorrentes', completed: false },
      ],
      isDemo: true,
    },
    {
      id: 'goal-health-vitality',
      title: 'Condicionamento & Saúde Metabólica Consistente',
      domain: 'Saúde & Vitalidade',
      horizon: 'Contínuo · 2026',
      milestones: [
        { id: 'gm-hlth-1', title: 'Estabelecer rotina semanal de 3+ treinos', completed: true },
        { id: 'gm-hlth-2', title: 'Manter hidratação diária de 2,5L', completed: true },
        { id: 'gm-hlth-3', title: 'Completar 12 semanas contínuas no Modo Treino', completed: false },
        { id: 'gm-hlth-4', title: 'Check-up e revisão biométrica semestral', completed: false },
      ],
      isDemo: true,
    },
    {
      id: 'goal-pkm-obsidian',
      title: 'Segundo Cérebro Obsidian + Busca Semântica',
      domain: 'Conhecimento',
      horizon: 'Q1 2027',
      linkedProjectId: 'proj-obsidian',
      milestones: [],
      isDemo: true,
    },
  ],
  settings: {
    userName: 'David Abrahão Rodrigues',
    userEmail: 'david.abrahao9@gmail.com',
    assistantPersona: 'estrategico',
    thinkingLevel: 'LOW',
    injectMemoryContext: true,
    requireHumanApproval: true,
    activeProvider: 'gemini',
    theme: 'deep-space',
  },
};
