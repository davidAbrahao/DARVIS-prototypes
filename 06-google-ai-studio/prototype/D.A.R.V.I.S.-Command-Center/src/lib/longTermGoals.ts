import type {
  GoalDomain,
  GoalMilestone,
  LongTermGoal,
  ProjectItem,
} from '../types/darvis';

export interface EvaluatedLongTermGoal {
  goal: LongTermGoal;
  milestones: GoalMilestone[];
  completedCount: number;
  totalCount: number;
  percentage: number;
  nextMilestone: string | null;
  isCompleted: boolean;
  isProjectLinked: boolean;
  linkedProjectName: string | null;
}

export interface LongTermGoalsSummary {
  totalGoals: number;
  completedGoals: number;
  completedMilestones: number;
  totalMilestones: number;
  overallPercentage: number;
  items: EvaluatedLongTermGoal[];
}

export const GOAL_DOMAINS: GoalDomain[] = [
  'Carreira & Projetos',
  'Finanças',
  'Saúde & Vitalidade',
  'Conhecimento',
];

export function evaluateLongTermGoals(
  goals: LongTermGoal[],
  projects: ProjectItem[],
  domainFilter: 'Todos' | GoalDomain = 'Todos'
): LongTermGoalsSummary {
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const evaluatedAll: EvaluatedLongTermGoal[] = goals.map((goal) => {
    const linkedProject = goal.linkedProjectId
      ? projectMap.get(goal.linkedProjectId)
      : undefined;

    const milestones: GoalMilestone[] = linkedProject
      ? linkedProject.milestones
      : goal.milestones;

    const totalCount = milestones.length;
    const completedCount = milestones.filter((m) => m.completed).length;
    const percentage =
      totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    const next = milestones.find((m) => !m.completed) ?? null;

    return {
      goal,
      milestones,
      completedCount,
      totalCount,
      percentage,
      nextMilestone: next ? next.title : null,
      isCompleted: totalCount > 0 && completedCount === totalCount,
      isProjectLinked: Boolean(linkedProject),
      linkedProjectName: linkedProject ? linkedProject.name : null,
    };
  });

  const filteredItems =
    domainFilter === 'Todos'
      ? evaluatedAll
      : evaluatedAll.filter((item) => item.goal.domain === domainFilter);

  const totalGoals = evaluatedAll.length;
  const completedGoals = evaluatedAll.filter((item) => item.isCompleted).length;
  const completedMilestones = evaluatedAll.reduce(
    (sum, item) => sum + item.completedCount,
    0
  );
  const totalMilestones = evaluatedAll.reduce(
    (sum, item) => sum + item.totalCount,
    0
  );
  const overallPercentage =
    totalMilestones === 0
      ? 0
      : Math.round((completedMilestones / totalMilestones) * 100);

  return {
    totalGoals,
    completedGoals,
    completedMilestones,
    totalMilestones,
    overallPercentage,
    items: filteredItems,
  };
}
