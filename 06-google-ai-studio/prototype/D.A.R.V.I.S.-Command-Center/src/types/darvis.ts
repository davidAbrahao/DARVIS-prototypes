export type ModuleId =
  | 'dashboard'
  | 'assistant'
  | 'memory'
  | 'management'
  | 'projects'
  | 'knowledge'
  | 'training'
  | 'automations'
  | 'integrations'
  | 'settings';

export type DarvisTheme = 'deep-space' | 'cyberpunk-neon' | 'minimalist-light';

export type FeatureMaturity = 'implemented' | 'simulated' | 'planned';

export type MemoryCategory =
  | 'Preferências'
  | 'Contexto Pessoal'
  | 'Decisões'
  | 'Conhecimento Técnico'
  | 'Projetos & Ideias';

export type MemorySource = 'Manual' | 'Assistente IA' | 'Demo Inicial';

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  category: MemoryCategory;
  tags: string[];
  projectId?: string;
  source: MemorySource;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export type TaskPriority = 'alta' | 'media' | 'baixa';
export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida';

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  projectId?: string;
  isDemo?: boolean;
}

export interface CommitmentItem {
  id: string;
  title: string;
  dateTime: string;
  location: string;
  category: string;
  isDemo?: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  estimatedCost: number;
  purchased: boolean;
  isDemo?: boolean;
}

export interface FinanceEntry {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  date: string;
  isDemo?: boolean;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectLogEntry {
  id: string;
  date: string;
  note: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  objective: string;
  status: 'ativo' | 'planejamento' | 'pausado' | 'concluido';
  phase: string;
  milestones: ProjectMilestone[];
  pendingItems: string[];
  history: ProjectLogEntry[];
  updatedAt: string;
  isDemo?: boolean;
}

export interface KnowledgeNote {
  id: string;
  title: string;
  folder: string;
  content: string;
  tags: string[];
  updatedAt: string;
  syncStatus: FeatureMaturity;
  isDemo?: boolean;
}

export interface AutomationRoutine {
  id: string;
  name: string;
  description: string;
  trigger: string;
  agent: string;
  requiresApproval: boolean;
  maturity: FeatureMaturity;
  lastRunAt: string | null;
  runCount: number;
}

export interface IntegrationService {
  id: string;
  name: string;
  category: string;
  description: string;
  maturity: FeatureMaturity;
  connected: boolean;
  targetPhase: string;
  architectureNote: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: 'Usuário' | 'D.A.R.V.I.S. IA' | 'Sistema';
  action: string;
  module: ModuleId;
  details: string;
  severity: 'info' | 'approval' | 'warning';
}

export type ProposedActionType = 'create_task' | 'create_memory' | 'create_note';

export interface ProposedAction {
  id: string;
  type: ProposedActionType;
  label: string;
  payload: {
    title: string;
    content?: string;
    category?: string;
    priority?: TaskPriority;
    dueDate?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: string;
  provider?: string;
  model?: string;
  proposedActions?: ProposedAction[];
}

export interface TrainingExercise {
  id: string;
  name: string;
  sets: string;
  load: string;
  completed: boolean;
}

export interface TrainingRoutine {
  id: string;
  name: string;
  focus: string;
  estimatedMinutes: number;
  exercises: TrainingExercise[];
}

export interface TrainingSessionLog {
  id: string;
  routineName: string;
  completedAt: string;
  durationSeconds: number;
  exercisesCompleted: number;
  totalExercises: number;
  notes?: string;
}

export interface DailyHabit {
  id: string;
  title: string;
  category: string;
  targetLabel: string;
  completedDates: string[];
  isDemo?: boolean;
}

export type GoalDomain =
  | 'Carreira & Projetos'
  | 'Saúde & Vitalidade'
  | 'Finanças'
  | 'Conhecimento';

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface LongTermGoal {
  id: string;
  title: string;
  domain: GoalDomain;
  horizon: string;
  linkedProjectId?: string;
  milestones: GoalMilestone[];
  isDemo?: boolean;
}

export interface SystemSettings {
  userName: string;
  userEmail: string;
  assistantPersona: 'conciso' | 'analitico' | 'estrategico';
  thinkingLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  injectMemoryContext: boolean;
  requireHumanApproval: boolean;
  activeProvider: 'gemini' | 'openai_planned' | 'anthropic_planned' | 'local_planned';
  theme: DarvisTheme;
}

export interface DarvisState {
  memories: MemoryItem[];
  tasks: TaskItem[];
  commitments: CommitmentItem[];
  shopping: ShoppingItem[];
  finances: FinanceEntry[];
  projects: ProjectItem[];
  notes: KnowledgeNote[];
  automations: AutomationRoutine[];
  auditLog: AuditLogEntry[];
  chatMessages: ChatMessage[];
  trainingRoutines: TrainingRoutine[];
  trainingHistory: TrainingSessionLog[];
  dailyHabits: DailyHabit[];
  longTermGoals: LongTermGoal[];
  settings: SystemSettings;
}
