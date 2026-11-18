import { useState, type FormEvent } from 'react';
import { Check, Plus, Search, Trash2 } from 'lucide-react';
import { filterTasks } from '../lib/darvisLogic';
import type {
  CommitmentItem,
  FinanceEntry,
  ShoppingItem,
  TaskItem,
  TaskPriority,
  TaskStatus,
} from '../types/darvis';
import { MaturityTag } from './MaturityTag';

interface ManagementViewProps {
  tasks: TaskItem[];
  commitments: CommitmentItem[];
  shopping: ShoppingItem[];
  finances: FinanceEntry[];
  onAddTask: (input: {
    title: string;
    category: string;
    priority: TaskPriority;
    dueDate: string;
  }) => void;
  onUpdateTaskStatus: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onToggleShopping: (id: string) => void;
  onAddShopping: (name: string, category: string, estimatedCost: number) => void;
  onAddFinance: (input: {
    description: string;
    amount: number;
    type: 'receita' | 'despesa';
    category: string;
  }) => void;
}

export function ManagementView({
  tasks,
  commitments,
  shopping,
  finances,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onToggleShopping,
  onAddShopping,
  onAddFinance,
}: ManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'tarefas' | 'compromissos' | 'financas'>('tarefas');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [priorityFilter, setPriorityFilter] = useState('todas');
  const [query, setQuery] = useState('');

  // New task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('D.A.R.V.I.S.');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('media');
  const [taskDue, setTaskDue] = useState('2026-11-24');

  // Shopping form
  const [shopName, setShopName] = useState('');
  const [shopCost, setShopCost] = useState('');

  // Finance form
  const [finDesc, setFinDesc] = useState('');
  const [finAmount, setFinAmount] = useState('');
  const [finType, setFinType] = useState<'receita' | 'despesa'>('despesa');

  const filteredTasks = filterTasks(tasks, statusFilter, priorityFilter, query);

  const totalReceitas = finances
    .filter((f) => f.type === 'receita')
    .reduce((acc, f) => acc + f.amount, 0);
  const totalDespesas = finances
    .filter((f) => f.type === 'despesa')
    .reduce((acc, f) => acc + f.amount, 0);
  const saldo = totalReceitas - totalDespesas;

  const handleTaskSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    onAddTask({
      title: taskTitle,
      category: taskCategory,
      priority: taskPriority,
      dueDate: taskDue,
    });
    setTaskTitle('');
  };

  const handleShoppingSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    onAddShopping(shopName, 'Equipamento', Number(shopCost) || 0);
    setShopName('');
    setShopCost('');
  };

  const handleFinanceSubmit = (e: FormEvent) => {
    e.preventDefault();
    const val = Number(finAmount);
    if (!finDesc.trim() || !Number.isFinite(val) || val <= 0) return;
    onAddFinance({
      description: finDesc,
      amount: val,
      type: finType,
      category: 'Pessoal',
    });
    setFinDesc('');
    setFinAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">
              Gestão Pessoal
            </h2>
            <MaturityTag
              maturity="simulated"
              labelOverride="Persistência Local · Dados Demo"
            />
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Tarefas operacionais, compromissos, lista de compras e controle financeiro.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-surface border border-edge rounded-lg self-start">
          {[
            { id: 'tarefas', label: 'Tarefas' },
            { id: 'compromissos', label: 'Compromissos' },
            { id: 'financas', label: 'Compras & Finanças' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-accent-soft text-accent-text'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'tarefas' && (
        <div className="space-y-6">
          {/* Quick Add Task */}
          <form
            onSubmit={handleTaskSubmit}
            className="rounded-xl bg-surface border border-edge p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
          >
            <div className="md:col-span-5">
              <label htmlFor="new-task-title" className="block text-xs text-ink-muted mb-1">
                Nova Tarefa
              </label>
              <input
                id="new-task-title"
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Descreva a tarefa..."
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="new-task-cat" className="block text-xs text-ink-muted mb-1">
                Categoria
              </label>
              <input
                id="new-task-cat"
                type="text"
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="new-task-prio" className="block text-xs text-ink-muted mb-1">
                Prioridade
              </label>
              <select
                id="new-task-prio"
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              >
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="new-task-due" className="block text-xs text-ink-muted mb-1">
                Prazo
              </label>
              <input
                id="new-task-due"
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="w-full bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div className="md:col-span-1">
              <button
                type="submit"
                disabled={!taskTitle.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-ink text-sm font-medium hover:bg-accent-hover disabled:opacity-45 transition-colors"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search
                className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <label htmlFor="task-search" className="sr-only">
                Buscar tarefas
              </label>
              <input
                id="task-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar tarefa ou categoria..."
                className="w-full bg-surface border border-edge rounded-lg pl-9 pr-4 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <select
                aria-label="Filtrar por status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-surface border border-edge rounded-lg px-3 py-2 text-ink-secondary"
              >
                <option value="todas">Todos os status</option>
                <option value="pendente">Pendentes</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluida">Concluídas</option>
              </select>

              <select
                aria-label="Filtrar por prioridade"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-surface border border-edge rounded-lg px-3 py-2 text-ink-secondary"
              >
                <option value="todas">Todas prioridades</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="rounded-xl bg-surface border border-edge overflow-hidden">
            {filteredTasks.length === 0 ? (
              <p className="p-8 text-center text-sm text-ink-muted">
                Nenhuma tarefa corresponde aos filtros selecionados.
              </p>
            ) : (
              <ul className="divide-y divide-edge">
                {filteredTasks.map((task) => {
                  const isDone = task.status === 'concluida';
                  return (
                    <li
                      key={task.id}
                      className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-hover-surface transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateTaskStatus(
                              task.id,
                              isDone ? 'pendente' : 'concluida'
                            )
                          }
                          aria-label={
                            isDone
                              ? `Reabrir tarefa ${task.title}`
                              : `Concluir tarefa ${task.title}`
                          }
                          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isDone
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 [[data-theme=minimalist-light]_&]:text-emerald-700'
                              : 'border-edge-strong text-transparent hover:border-accent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-sm truncate ${
                              isDone ? 'line-through text-ink-subtle' : 'text-ink'
                            }`}
                          >
                            {task.title}
                          </p>
                          <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                            {task.category} · Prioridade {task.priority} · Prazo {task.dueDate}
                            {task.isDemo ? ' · Demo' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <select
                          aria-label={`Status de ${task.title}`}
                          value={task.status}
                          onChange={(e) =>
                            onUpdateTaskStatus(task.id, e.target.value as TaskStatus)
                          }
                          className="bg-inset border border-edge-strong rounded-md px-2.5 py-1 text-xs text-ink-secondary"
                        >
                          <option value="pendente">Pendente</option>
                          <option value="em_andamento">Em andamento</option>
                          <option value="concluida">Concluída</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          aria-label={`Excluir tarefa ${task.title}`}
                          className="p-1.5 text-ink-subtle hover:text-red-400 [[data-theme=minimalist-light]_&]:hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === 'compromissos' && (
        <div className="rounded-xl bg-surface border border-edge divide-y divide-edge">
          {commitments.map((item) => (
            <div
              key={item.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="text-sm font-medium text-ink">{item.title}</p>
                <p className="text-xs text-ink-muted mt-1">
                  {item.category} · {item.location}
                  {item.isDemo ? ' · Demo' : ''}
                </p>
              </div>
              <span className="font-mono text-xs text-accent-text tabular-nums shrink-0">
                {item.dateTime}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'financas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shopping List */}
          <section className="rounded-xl bg-surface border border-edge p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-ink">
              Lista de Compras & Aquisições
            </h3>
            <form onSubmit={handleShoppingSubmit} className="flex gap-2">
              <input
                type="text"
                aria-label="Nome do item de compra"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Item..."
                className="flex-1 bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-subtle"
              />
              <input
                type="number"
                aria-label="Custo estimado"
                value={shopCost}
                onChange={(e) => setShopCost(e.target.value)}
                placeholder="R$"
                className="w-24 bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-subtle tabular-nums"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-accent text-accent-ink text-sm font-medium hover:bg-accent-hover"
              >
                Add
              </button>
            </form>
            <ul className="divide-y divide-edge">
              {shopping.map((item) => (
                <li
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => onToggleShopping(item.id)}
                    className="flex items-center gap-3 text-left min-w-0"
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        item.purchased
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 [[data-theme=minimalist-light]_&]:text-emerald-700'
                          : 'border-edge-strong'
                      }`}
                    >
                      {item.purchased && <Check className="w-3 h-3" />}
                    </span>
                    <span
                      className={`truncate ${
                        item.purchased ? 'line-through text-ink-subtle' : 'text-ink-secondary'
                      }`}
                    >
                      {item.name}
                    </span>
                  </button>
                  <span className="font-mono text-xs text-ink-muted tabular-nums shrink-0">
                    R$ {item.estimatedCost.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Personal Finance */}
          <section className="rounded-xl bg-surface border border-edge p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-base font-semibold text-ink">
                Finanças Pessoais (Ciclo Atual)
              </h3>
              <span
                className={`font-mono text-sm font-semibold tabular-nums ${
                  saldo >= 0
                    ? 'text-emerald-400 [[data-theme=minimalist-light]_&]:text-emerald-700'
                    : 'text-red-400 [[data-theme=minimalist-light]_&]:text-red-600'
                }`}
              >
                Saldo: R$ {saldo.toFixed(2)}
              </span>
            </div>

            <form onSubmit={handleFinanceSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                aria-label="Descrição financeira"
                value={finDesc}
                onChange={(e) => setFinDesc(e.target.value)}
                placeholder="Descrição..."
                className="sm:col-span-2 bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-subtle"
              />
              <input
                type="number"
                aria-label="Valor"
                value={finAmount}
                onChange={(e) => setFinAmount(e.target.value)}
                placeholder="Valor"
                className="bg-inset border border-edge-strong rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-subtle tabular-nums"
              />
              <div className="flex gap-2">
                <select
                  aria-label="Tipo de lançamento"
                  value={finType}
                  onChange={(e) => setFinType(e.target.value as 'receita' | 'despesa')}
                  className="flex-1 bg-inset border border-edge-strong rounded-lg px-2 py-2 text-xs text-ink"
                >
                  <option value="despesa">Despesa</option>
                  <option value="receita">Receita</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-accent text-accent-ink text-xs font-medium hover:bg-accent-hover"
                >
                  Add
                </button>
              </div>
            </form>

            <ul className="divide-y divide-edge">
              {finances.map((entry) => (
                <li
                  key={entry.id}
                  className="py-3 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-ink-secondary truncate">{entry.description}</p>
                    <p className="text-xs text-ink-subtle tabular-nums">
                      {entry.category} · {entry.date}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-xs font-medium tabular-nums shrink-0 ${
                      entry.type === 'receita'
                        ? 'text-emerald-400 [[data-theme=minimalist-light]_&]:text-emerald-700'
                        : 'text-ink-secondary'
                    }`}
                  >
                    {entry.type === 'receita' ? '+' : '-'} R$ {entry.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
