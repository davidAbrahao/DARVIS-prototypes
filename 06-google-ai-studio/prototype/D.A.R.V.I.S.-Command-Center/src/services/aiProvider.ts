import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { parseDailyFocusPayload } from '../lib/dailyFocus';

export interface AiChatRequest {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemContext: string;
  persona: 'conciso' | 'analitico' | 'estrategico';
  thinkingLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requireHumanApproval: boolean;
}

export interface AiChatResponse {
  text: string;
  provider: string;
  model: string;
}

export interface DailyFocusRequest {
  userName: string;
  pendingTasksCount: number;
  activeProjectsCount: number;
  dateKey: string;
}

export interface DailyFocusResponse {
  affirmation: string;
  focusTag: string;
  dateKey: string;
  provider: string;
  model: string;
}

export interface AiProvider {
  id: string;
  name: string;
  model: string;
  isConfigured(): boolean;
  generateReply(request: AiChatRequest): Promise<AiChatResponse>;
  generateDailyFocus(request: DailyFocusRequest): Promise<DailyFocusResponse>;
}

const PERSONA_GUIDANCE: Record<AiChatRequest['persona'], string> = {
  conciso: 'Responda de forma direta, objetiva e estruturada, evitando rodeios.',
  analitico: 'Responda com profundidade técnica, raciocínio passo a passo e considerações de trade-off.',
  estrategico: 'Responda como um diretor técnico e estrategista pessoal, conectando decisões ao impacto de médio e longo prazo.',
};

function mapThinkingLevel(level: AiChatRequest['thinkingLevel']): ThinkingLevel {
  if (level === 'HIGH') return ThinkingLevel.HIGH;
  if (level === 'MEDIUM') return ThinkingLevel.MEDIUM;
  return ThinkingLevel.LOW;
}

export class GeminiProvider implements AiProvider {
  id = 'gemini';
  name = 'Google Gemini';
  model = 'gemini-4-hydrogen';

  isConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY?.trim();
    return Boolean(key && key !== 'MY_GEMINI_API_KEY');
  }

  async generateReply(request: AiChatRequest): Promise<AiChatResponse> {
    if (!this.isConfigured()) {
      throw new Error(
        'GEMINI_API_KEY não configurada no servidor. Configure a chave no painel Settings > Secrets para ativar respostas reais do Gemini.'
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = [
      'Você é o D.A.R.V.I.S. (David Abrahão Rodrigues Virtual Intelligence System), um sistema de inteligência pessoal avançado.',
      'Idioma padrão: Português do Brasil.',
      PERSONA_GUIDANCE[request.persona],
      'Regra de transparência: Nunca finja que integrações externas (Telegram, Obsidian GitHub Sync, Google Calendar, GitHub) estão conectadas se o usuário perguntar sobre elas — informe que estão em status Planejado nas fases futuras do D.A.R.V.I.S.',
      request.requireHumanApproval
        ? [
            'Quando o usuário pedir explicitamente para criar uma tarefa, registrar uma memória ou criar uma nota de conhecimento, além da resposta em texto, inclua NO MÁXIMO UM bloco estruturado no final usando exatamente esta marcação para aprovação humana:',
            '[DARVIS_ACTION]{"type":"create_task|create_memory|create_note","label":"Resumo curto da ação","payload":{"title":"Título","content":"Descrição ou conteúdo","category":"Categoria","priority":"alta|media|baixa","dueDate":"YYYY-MM-DD"}}[/DARVIS_ACTION]',
          ].join('\n')
        : 'Não emita blocos [DARVIS_ACTION].',
      '',
      '--- CONTEXTO ATUAL DO USUÁRIO ---',
      request.systemContext,
    ].join('\n');

    const transcript = request.history
      .slice(-8)
      .map((item) => `${item.role === 'user' ? 'Usuário' : 'D.A.R.V.I.S.'}: ${item.content}`)
      .join('\n');

    const fullPrompt = transcript
      ? `Histórico recente da conversa:\n${transcript}\n\nNova mensagem do usuário:\n${request.message}`
      : request.message;

    const response = await ai.models.generateContent({
      model: this.model,
      contents: fullPrompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: mapThinkingLevel(request.thinkingLevel),
        },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('O provedor Gemini retornou uma resposta vazia.');
    }

    return {
      text,
      provider: this.name,
      model: this.model,
    };
  }

  async generateDailyFocus(request: DailyFocusRequest): Promise<DailyFocusResponse> {
    if (!this.isConfigured()) {
      const err = new Error(
        'GEMINI_API_KEY não configurada no servidor para gerar o Daily Focus.'
      ) as Error & { status?: number };
      err.status = 503;
      throw err;
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        timeout: 12000,
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const firstName = request.userName.trim().split(/\s+/)[0] || 'David';
    const prompt = [
      `Data de hoje: ${request.dateKey}.`,
      `Usuário: ${firstName}.`,
      `Contexto operacional: ${request.pendingTasksCount} tarefas pendentes e ${request.activeProjectsCount} projetos ativos.`,
      'Gere uma afirmação diária breve (1 ou 2 frases curtas, máximo 180 caracteres), inspiradora e orientada à produtividade prática em Português do Brasil.',
      'Evite clichês vazios ou jargões de ficção científica. Seja claro, humano e direto.',
    ].join(' ');

    try {
      const response = await ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          systemInstruction:
            'Você cria mensagens curtas de foco diário e produtividade prática para o sistema pessoal D.A.R.V.I.S., retornando estritamente JSON válido.',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              affirmation: {
                type: Type.STRING,
                description:
                  'Frase inspiradora e prática de produtividade para o dia, em Português do Brasil.',
              },
              focusTag: {
                type: Type.STRING,
                description:
                  'Tema curto de 2 a 3 palavras que sintetiza o foco do dia (ex.: Execução Intencional).',
              },
            },
            required: ['affirmation', 'focusTag'],
          },
        },
      });

      const parsed = parseDailyFocusPayload(response.text ?? '');
      if (!parsed) {
        throw new Error('O provedor Gemini retornou um Daily Focus inválido.');
      }

      return {
        affirmation: parsed.affirmation,
        focusTag: parsed.focusTag,
        dateKey: request.dateKey,
        provider: this.name,
        model: this.model,
      };
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      const isTimeout =
        raw.includes('DEADLINE_EXCEEDED') ||
        raw.includes('504') ||
        raw.toLowerCase().includes('timeout') ||
        raw.toLowerCase().includes('abort');
      const friendly = new Error(
        isTimeout
          ? 'Tempo limite excedido ao consultar o Gemini.'
          : 'Não foi possível gerar o foco diário pelo Gemini no momento.'
      ) as Error & { status?: number };
      friendly.status = isTimeout ? 504 : 502;
      throw friendly;
    }
  }
}

export function getActiveAiProvider(): AiProvider {
  return new GeminiProvider();
}
