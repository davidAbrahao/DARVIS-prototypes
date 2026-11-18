import type { CommitmentItem, ProjectItem, TaskItem } from '../types/darvis';
import { calculateProjectProgress } from './darvisLogic';

export interface DigestCompletedTask {
  id: string;
  title: string;
  category: string;
}

export interface DigestActiveProjectMilestone {
  projectId: string;
  projectName: string;
  phase: string;
  completedCount: number;
  totalCount: number;
  percentage: number;
  remainingCount: number;
  nextMilestone: string | null;
}

export interface DigestPriorityItem {
  id: string;
  title: string;
  kind: 'task' | 'commitment';
  metaLabel: string;
  scheduleLabel: string;
  isUrgent: boolean;
}

export interface DailyDigest {
  dateKey: string;
  dateLabel: string;
  userName: string;
  summaryHeadline: string;
  completedTasks: {
    count: number;
    total: number;
    items: DigestCompletedTask[];
  };
  activeMilestones: {
    activeProjectsCount: number;
    completedMilestones: number;
    totalMilestones: number;
    pendingMilestones: number;
    items: DigestActiveProjectMilestone[];
  };
  upcomingPriorities: {
    count: number;
    urgentCount: number;
    items: DigestPriorityItem[];
  };
}

export interface ComputeDailyDigestInput {
  tasks: TaskItem[];
  projects: ProjectItem[];
  commitments: CommitmentItem[];
  userName: string;
  referenceDate?: Date;
}

const PRIORITY_RANK: Record<TaskItem['priority'], number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date): string {
  const months = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()] ?? 'jan';
  return `${day} ${month} ${date.getFullYear()}`;
}

function parseLocalDate(dateStr: string): Date | null {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatShortDayMonth(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

function formatCommitmentSchedule(dateTime: string, todayKey: string): {
  label: string;
  isToday: boolean;
} {
  const [datePartRaw, timePartRaw] = dateTime.split('·').map((s) => s.trim());
  const isToday = datePartRaw === todayKey;
  if (isToday) {
    return {
      label: timePartRaw ? `Hoje · ${timePartRaw}` : 'Hoje',
      isToday: true,
    };
  }
  const shortDate = formatShortDayMonth(datePartRaw);
  return {
    label: timePartRaw ? `${shortDate} · ${timePartRaw}` : shortDate,
    isToday: false,
  };
}

export function computeDailyDigest({
  tasks,
  projects,
  commitments,
  userName,
  referenceDate = new Date(),
}: ComputeDailyDigestInput): DailyDigest {
  const refStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const dateKey = toLocalDateKey(refStart);
  const dateLabel = formatDateLabel(refStart);

  // 1. Completed Tasks
  const completed = tasks.filter((task) => task.status === 'concluida');
  const completedItems: DigestCompletedTask[] = completed.slice(0, 4).map((task) => ({
    id: task.id,
    title: task.title,
    category: task.category,
  }));

  // 2. Active Project Milestones
  const activeProjects = projects.filter((project) => project.status === 'ativo');
  let completedMilestones = 0;
  let totalMilestones = 0;

  const activeMilestoneItems: DigestActiveProjectMilestone[] = activeProjects
    .slice(0, 3)
    .map((project) => {
      const progress = calculateProjectProgress(project.milestones);
      completedMilestones += progress.completed;
      totalMilestones += progress.total;
      const next = project.milestones.find((m) => !m.completed) ?? null;

      return {
        projectId: project.id,
        projectName: project.name,
        phase: project.phase,
        completedCount: progress.completed,
        totalCount: progress.total,
        percentage: progress.percentage,
        remainingCount: Math.max(0, progress.total - progress.completed),
        nextMilestone: next ? next.title : null,
      };
    });

  // Include totals across all active projects even if > 3
  if (activeProjects.length > 3) {
    for (const project of activeProjects.slice(3)) {
      const progress = calculateProjectProgress(project.milestones);
      completedMilestones += progress.completed;
      totalMilestones += progress.total;
    }
  }

  const pendingMilestones = Math.max(0, totalMilestones - completedMilestones);

  // 3. Upcoming Priorities (Open tasks + commitments)
  const openTasks = tasks.filter((task) => task.status !== 'concluida');
  const scoredTasks = openTasks
    .map((task) => {
      const due = parseLocalDate(task.dueDate);
      const diffDays = due
        ? Math.round((due.getTime() - refStart.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const isUrgent = diffDays <= 1 || task.priority === 'alta';
      const scheduleLabel =
        diffDays < 0
          ? `Atrasada (${Math.abs(diffDays)}d)`
          : diffDays === 0
          ? 'Hoje'
          : diffDays === 1
          ? 'Amanhã'
          : formatShortDayMonth(task.dueDate);

      return {
        task,
        diffDays,
        isUrgent,
        scheduleLabel,
      };
    })
    .sort((a, b) => {
      const aUrgentBucket = a.diffDays <= 0 ? 0 : 1;
      const bUrgentBucket = b.diffDays <= 0 ? 0 : 1;
      if (aUrgentBucket !== bUrgentBucket) return aUrgentBucket - bUrgentBucket;

      const prioDiff = PRIORITY_RANK[a.task.priority] - PRIORITY_RANK[b.task.priority];
      if (prioDiff !== 0) return prioDiff;

      return a.diffDays - b.diffDays;
    });

  const sortedCommitments = [...commitments].sort((a, b) => {
    const aToday = a.dateTime.startsWith(dateKey) ? 0 : 1;
    const bToday = b.dateTime.startsWith(dateKey) ? 0 : 1;
    if (aToday !== bToday) return aToday - bToday;
    return a.dateTime.localeCompare(b.dateTime);
  });

  const taskPriorityItems: DigestPriorityItem[] = scoredTasks.slice(0, 3).map((entry) => ({
    id: entry.task.id,
    title: entry.task.title,
    kind: 'task',
    metaLabel: `${entry.task.category} · Prioridade ${entry.task.priority}`,
    scheduleLabel: entry.scheduleLabel,
    isUrgent: entry.isUrgent,
  }));

  const commitmentPriorityItems: DigestPriorityItem[] = sortedCommitments
    .slice(0, 2)
    .map((commitment) => {
      const schedule = formatCommitmentSchedule(commitment.dateTime, dateKey);
      return {
        id: commitment.id,
        title: commitment.title,
        kind: 'commitment',
        metaLabel: `Compromisso · ${commitment.location}`,
        scheduleLabel: schedule.label,
        isUrgent: schedule.isToday,
      };
    });

  const combinedPriorities = [...taskPriorityItems, ...commitmentPriorityItems].slice(0, 4);
  const totalOpenCount = openTasks.length + commitments.length;
  const urgentCount =
    scoredTasks.filter((entry) => entry.isUrgent).length +
    sortedCommitments.filter((c) => c.dateTime.startsWith(dateKey)).length;

  const summaryHeadline =
    tasks.length === 0 && activeProjects.length === 0 && commitments.length === 0
      ? 'Nenhuma atividade registrada para o resumo de hoje.'
      : `${pluralize(completed.length, 'tarefa concluída', 'tarefas concluídas')}, ${pluralize(
          pendingMilestones,
          'marco pendente',
          'marcos pendentes'
        )} em ${pluralize(activeProjects.length, 'projeto ativo', 'projetos ativos')} e ${pluralize(
          totalOpenCount,
          'prioridade no radar',
          'prioridades no radar'
        )}.`;

  return {
    dateKey,
    dateLabel,
    userName,
    summaryHeadline,
    completedTasks: {
      count: completed.length,
      total: tasks.length,
      items: completedItems,
    },
    activeMilestones: {
      activeProjectsCount: activeProjects.length,
      completedMilestones,
      totalMilestones,
      pendingMilestones,
      items: activeMilestoneItems,
    },
    upcomingPriorities: {
      count: totalOpenCount,
      urgentCount,
      items: combinedPriorities,
    },
  };
}

export function formatDailyDigestText(digest: DailyDigest): string {
  const lines: string[] = [
    `D.A.R.V.I.S. — Daily Digest (${digest.dateLabel})`,
    digest.summaryHeadline,
    '',
    `1. Tarefas Concluídas (${digest.completedTasks.count}/${digest.completedTasks.total}):`,
  ];

  if (digest.completedTasks.items.length === 0) {
    lines.push('  - Nenhuma tarefa concluída até o momento.');
  } else {
    for (const item of digest.completedTasks.items) {
      lines.push(`  - [x] ${item.title} (${item.category})`);
    }
  }

  lines.push(
    '',
    `2. Marcos de Projetos Ativos (${digest.activeMilestones.completedMilestones}/${digest.activeMilestones.totalMilestones}):`
  );

  if (digest.activeMilestones.items.length === 0) {
    lines.push('  - Nenhum projeto ativo em andamento.');
  } else {
    for (const project of digest.activeMilestones.items) {
      const nextText = project.nextMilestone
        ? `Próximo: ${project.nextMilestone}`
        : 'Todos os marcos concluídos';
      lines.push(
        `  - ${project.projectName} (${project.percentage}% · ${project.completedCount}/${project.totalCount}) — ${nextText}`
      );
    }
  }

  lines.push('', `3. Prioridades do Dia (${digest.upcomingPriorities.count}):`);

  if (digest.upcomingPriorities.items.length === 0) {
    lines.push('  - Nenhuma prioridade pendente.');
  } else {
    for (const priority of digest.upcomingPriorities.items) {
      lines.push(`  - ${priority.title} [${priority.scheduleLabel}] (${priority.metaLabel})`);
    }
  }

  return lines.join('\n');
}
