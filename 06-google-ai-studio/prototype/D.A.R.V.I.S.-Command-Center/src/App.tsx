/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { AssistantView } from './components/AssistantView';
import { AutomationsView } from './components/AutomationsView';
import { CommandCenterView } from './components/CommandCenterView';
import { IntegrationsView } from './components/IntegrationsView';
import { KnowledgeView } from './components/KnowledgeView';
import { ManagementView } from './components/ManagementView';
import { MemoryView } from './components/MemoryView';
import { ProjectsView } from './components/ProjectsView';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { TrainingView } from './components/TrainingView';
import { buildAiContextPrompt, parseAiActionProposals } from './lib/darvisLogic';
import { useDarvisStore } from './state/useDarvisStore';
import type { DarvisTheme, ModuleId } from './types/darvis';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [systemInitializing, setSystemInitializing] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);

  const {
    state,
    addMemory,
    deleteMemory,
    addTask,
    updateTaskStatus,
    deleteTask,
    toggleShoppingItem,
    addShoppingItem,
    addFinanceEntry,
    toggleProjectMilestone,
    addProject,
    addProjectMilestone,
    saveNote,
    simulateAutomation,
    appendChatMessage,
    resolveProposedAction,
    toggleTrainingExercise,
    addTrainingExercise,
    resetTrainingRoutine,
    logTrainingSession,
    toggleDailyHabit,
    addDailyHabit,
    deleteDailyHabit,
    toggleLongTermGoalMilestone,
    addLongTermGoal,
    updateSettings,
    clearChat,
    resetDemoData,
  } = useDarvisStore();

  useEffect(() => {
    const activeTheme: DarvisTheme = state.settings.theme || 'deep-space';
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.style.colorScheme =
      activeTheme === 'minimalist-light' ? 'light' : 'dark';
  }, [state.settings.theme]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setAiConfigured(Boolean(data?.aiConfigured));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAiConfigured(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSystemInitializing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSendAiMessage = useCallback(
    async (text: string, navigateToAssistant = false) => {
      if (navigateToAssistant) {
        setActiveModule('assistant');
      }

      appendChatMessage({
        id: `msg-user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      });

      setAiThinking(true);
      try {
        const historyPayload = state.chatMessages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-8)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

        const systemContext = buildAiContextPrompt(state);

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: historyPayload,
            systemContext,
            persona: state.settings.assistantPersona,
            thinkingLevel: state.settings.thinkingLevel,
            requireHumanApproval: state.settings.requireHumanApproval,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          appendChatMessage({
            id: `msg-err-${Date.now()}`,
            role: 'error',
            content:
              data?.error ||
              'Não foi possível obter resposta do provedor Gemini neste momento.',
            timestamp: new Date().toISOString(),
            provider: data?.provider,
            model: data?.model,
          });
          return;
        }

        const { cleanText, actions } = parseAiActionProposals(data.text || '');

        appendChatMessage({
          id: `msg-ai-${Date.now()}`,
          role: 'assistant',
          content: cleanText || data.text,
          timestamp: new Date().toISOString(),
          provider: data.provider,
          model: data.model,
          proposedActions: actions.length > 0 ? actions : undefined,
        });
      } catch {
        appendChatMessage({
          id: `msg-err-${Date.now()}`,
          role: 'error',
          content:
            'Erro de rede ao conectar com o gateway /api/ai/chat. Verifique se o servidor está ativo.',
          timestamp: new Date().toISOString(),
        });
      } finally {
        setAiThinking(false);
      }
    },
    [appendChatMessage, state]
  );

  return (
    <div className="min-h-screen bg-canvas text-ink flex transition-colors duration-200">
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        userName={state.settings.userName}
        userEmail={state.settings.userEmail}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeModule={activeModule}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onQuickAssistant={() => setActiveModule('assistant')}
          aiThinking={aiThinking}
          aiConfigured={aiConfigured}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
          {activeModule === 'dashboard' && (
            <CommandCenterView
              state={state}
              isLoading={systemInitializing}
              aiConfigured={aiConfigured}
              aiThinking={aiThinking}
              onNavigate={setActiveModule}
              onSendCommand={(prompt) => handleSendAiMessage(prompt, true)}
              onUpdateTaskStatus={updateTaskStatus}
              onAddTask={addTask}
              onAddMemory={addMemory}
              onSaveNote={saveNote}
              onToggleHabit={toggleDailyHabit}
              onAddHabit={addDailyHabit}
              onDeleteHabit={deleteDailyHabit}
              onToggleGoalMilestone={toggleLongTermGoalMilestone}
              onAddGoal={addLongTermGoal}
              onSelectTheme={(theme) => updateSettings({ theme })}
            />
          )}

          {activeModule === 'assistant' && (
            <AssistantView
              messages={state.chatMessages}
              settings={state.settings}
              aiConfigured={aiConfigured}
              aiThinking={aiThinking}
              onSendMessage={(text) => handleSendAiMessage(text, false)}
              onResolveAction={resolveProposedAction}
              onUpdateSettings={updateSettings}
              onClearChat={clearChat}
            />
          )}

          {activeModule === 'memory' && (
            <MemoryView
              memories={state.memories}
              projects={state.projects}
              onAddMemory={addMemory}
              onDeleteMemory={deleteMemory}
            />
          )}

          {activeModule === 'management' && (
            <ManagementView
              tasks={state.tasks}
              commitments={state.commitments}
              shopping={state.shopping}
              finances={state.finances}
              onAddTask={addTask}
              onUpdateTaskStatus={updateTaskStatus}
              onDeleteTask={deleteTask}
              onToggleShopping={toggleShoppingItem}
              onAddShopping={addShoppingItem}
              onAddFinance={addFinanceEntry}
            />
          )}

          {activeModule === 'projects' && (
            <ProjectsView
              projects={state.projects}
              onToggleMilestone={toggleProjectMilestone}
              onAddMilestone={addProjectMilestone}
              onAddProject={addProject}
            />
          )}

          {activeModule === 'knowledge' && (
            <KnowledgeView notes={state.notes} onSaveNote={saveNote} />
          )}

          {activeModule === 'training' && (
            <TrainingView
              routines={state.trainingRoutines}
              history={state.trainingHistory}
              onToggleExercise={toggleTrainingExercise}
              onAddExercise={addTrainingExercise}
              onResetRoutine={resetTrainingRoutine}
              onLogSession={logTrainingSession}
            />
          )}

          {activeModule === 'automations' && (
            <AutomationsView
              automations={state.automations}
              onSimulateAutomation={simulateAutomation}
            />
          )}

          {activeModule === 'integrations' && (
            <IntegrationsView aiConfigured={aiConfigured} />
          )}

          {activeModule === 'settings' && (
            <SettingsView
              state={state}
              onUpdateSettings={updateSettings}
              onResetDemo={resetDemoData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
