# Visão do produto

## Propósito

D.A.R.V.I.S. é um sistema de inteligência pessoal que ajuda seu proprietário a manter continuidade entre vida pessoal, trabalho, projetos, conhecimentos e decisões.

O sistema deve transformar conversas em resultados úteis: registrar informações, relacioná-las ao contexto, destacar prioridades, preparar decisões e realizar ações autorizadas.

## Pilares do produto

### 1. Cognitive Cockpit — Centro de comando cognitivo

Uma interface premium, escura e responsiva, inspirada no Cognitive Cockpit do Stitch. Ela oferece uma visão clara da situação sem fingir ser um centro de comando em tempo real quando os dados não estiverem disponíveis.

### 2. Contexto pessoal e memória

Uma camada de conhecimento controlada, que combina registros estruturados no PostgreSQL com documentos Markdown de maior extensão em um cofre compatível com Obsidian. O usuário deve poder consultar, corrigir, exportar e excluir seu contexto pessoal.

### 3. Assistente de IA

Uma interface conversacional com seleção explícita de contexto, arquitetura independente de provedor, atribuição transparente de fontes quando possível e separação clara entre sugestões do modelo e fatos do sistema.

### 4. Projetos e execução

Tarefas, projetos, objetivos, lembretes e fluxos de trabalho são elementos centrais do domínio. A API valida e autoriza as ações propostas pela IA antes de qualquer execução.

### 5. Integrações e agentes

Serviços externos são conectados por adaptadores com permissões delimitadas. Cada integração apresenta seu estado real de conexão, permissões concedidas, última operação bem-sucedida e informações de falha.

## Princípios da experiência

- Ser útil antes de ser impressionante.
- Ser calmo, legível e responsivo.
- Não apresentar telemetria, sincronização, IA ou sucesso fictícios.
- Toda ação importante deve apresentar um resultado visível.
- O usuário permanece no controle das permissões e execuções.
- Recursos avançados aparecem progressivamente, sem sobrecarregar o uso cotidiano.
- A experiência em dispositivos móveis é prioridade, não apenas uma versão reduzida do desktop.

## Organização inicial dos módulos

1. Central de Comando
2. Assistente de IA
3. Central de Memória
4. Projetos e Tarefas
5. Conhecimento
6. Integrações e Automações
7. Configurações e Segurança

## Limites da primeira versão (MVP)

O primeiro MVP comprova a fundação da aplicação e uma jornada completa de uso. Não tentará entregar todos os agentes e integrações imaginados.

Incluído na primeira fatia vertical: estrutura e navegação da aplicação web; saúde da API e identidade autenticada; persistência PostgreSQL; ciclo seguro de sessões; estado real do sistema e telas vazias; verificações automatizadas de qualidade.

Adiado até a fundação ser validada: conversas Gemini com contexto pessoal; sincronização e indexação do Obsidian; integrações com Telegram e Google Workspace; interação por voz; agentes autônomos ou agendados.
