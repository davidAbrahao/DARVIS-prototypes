# ADR-0005 — Seleção explícita de contexto para o assistente

- **Status:** Proposta aprovada para orientar a próxima implementação
- **Data:** 18/11/2026
- **Escopo:** assistente textual, dados do próprio D.A.R.V.I.S. e provedor externo
- **Pré-requisitos:** ADR-0003 e ADR-0004

## Contexto

O assistente atual envia ao provedor o histórico recente da conversa e a mensagem atual. Projetos, tarefas e registros da Central de Memória não são anexados automaticamente. A próxima evolução deve permitir que o usuário escolha dados específicos para enriquecer uma mensagem sem transformar o banco inteiro em contexto implícito.

Contexto pessoal pode conter informação privada. A seleção precisa ser compreensível, revisável, limitada e validada no servidor. O cliente não pode enviar texto arbitrário fingindo ser um registro pertencente ao usuário, nem escolher registros de outra conta.

## Decisão

### 1. Padrão de privacidade

- Projetos, tarefas e memórias ficam **fora** do contexto por padrão.
- O histórico recente da conversa ativa continua sendo o contexto conversacional padrão desta versão; a interface deve informar que ele será enviado junto da mensagem.
- A seleção de dados do domínio é feita por mensagem, não fica habilitada permanentemente na conversa.
- Nenhuma memória é inferida, recuperada semanticamente ou anexada silenciosamente.
- Não haverá execução de ferramentas nem ações no domínio como consequência da seleção.

### 2. Fontes permitidas na primeira entrega

A allowlist inicial contém somente:

| Tipo | Campos enviados |
|---|---|
| Memória | título, conteúdo, categoria e etiquetas |
| Projeto | nome, descrição e situação |
| Tarefa | título, descrição, situação, prioridade, prazo e nome do projeto relacionado, quando existir |

Não entram nesta entrega: notas Obsidian/Markdown, arquivos, anexos, eventos de agenda, integrações externas, credenciais, dados de autenticação, auditoria ou conteúdo de outras conversas.

### 3. Seleção e autorização

- O cliente envia somente pares tipados `source_type` e `source_id`; nunca envia um bloco de texto para ser tratado como dado oficial.
- Tipos desconhecidos, campos extras, IDs malformados, seleções duplicadas ou acima do limite são rejeitados.
- O servidor resolve cada item com filtro obrigatório pelo `user_id` autenticado. Um ID inexistente ou pertencente a outro usuário não pode revelar sua existência.
- O servidor constrói o texto de contexto a partir dos campos allowlisted. Instruções encontradas no conteúdo selecionado são dados não confiáveis, nunca instruções de sistema.
- Limite inicial proposto: até 8 itens selecionados e até 24.000 caracteres de contexto normalizado por mensagem, além dos limites já existentes para mensagem e histórico. Os limites ficam centralizados e testados, não espalhados pela interface.

### 4. Prévia vinculada ao envio

O fluxo será em duas etapas:

1. **Prévia:** a API recebe a seleção tipada, resolve os registros autorizados e devolve uma representação legível com nome, tipo, conteúdo que será compartilhado, contagem de caracteres e um hash da representação normalizada. A prévia não chama o provedor e não persiste conteúdo.
2. **Envio:** a mensagem inclui a mesma seleção e o hash recebido. A API resolve os registros novamente, revalida a propriedade e recalcula o hash. Se os registros mudaram, foram removidos ou a seleção não corresponde à prévia, responde HTTP 409 e exige nova prévia. Só depois dessa verificação o conteúdo entra no contexto enviado ao provedor.

Isso evita confiar em uma prévia fabricada pelo navegador e reduz a janela entre consentimento e envio (TOCTOU).

### 5. Persistência e auditoria

- A mensagem do usuário guarda metadados mínimos do contexto efetivamente selecionado: tipo, ID da origem e hash do conteúdo normalizado. Não duplica o texto completo dos registros em uma segunda tabela nesta etapa.
- A auditoria registra quantidade, tipos e resultado da seleção, sem armazenar conteúdo de memórias, projetos ou tarefas.
- O conteúdo da conversa e a mensagem continuam sujeitos às regras de retenção/exclusão já definidas para conversas.
- A exclusão de uma fonte não apaga mensagens antigas nem altera o histórico; os metadados preservam a referência histórica sem recriar o conteúdo excluído.
- Exportação e retenção global de conversas permanecem pendentes e devem ser definidas antes de produção.

### 6. Experiência na interface

- Um controle explícito “Adicionar contexto” abre a seleção de memórias, projetos e tarefas do próprio usuário.
- Cada item mostra tipo e título, sem seleção pré-marcada.
- Antes do envio, a interface apresenta uma prévia fiel do conteúdo e informa quais dados serão enviados ao provedor.
- O usuário confirma o envio; cancelar a prévia não envia dados.
- A seleção é limpa após o envio bem-sucedido e não é reaplicada automaticamente à próxima mensagem.
- Se a API retornar conflito por alteração de fonte, a interface solicita nova prévia e confirmação.
- Estados de carregamento, vazio, erro e indisponibilidade devem ser explícitos e coerentes com o Cognitive Cockpit.

## Contrato de API proposto

- `POST /api/v1/assistant/context-preview`: recebe seleção tipada e devolve itens resolvidos, texto formatado para inspeção, contagem e hash.
- `POST /api/v1/assistant/conversations/{conversation_id}/messages`: passa a aceitar `context_items` e `context_hash` opcionais, mantendo compatibilidade com mensagens sem contexto.
- `context_items` ausente ou vazio significa nenhum contexto de domínio adicional.
- A prévia e o envio exigem autenticação Bearer. O endpoint de envio mantém idempotência por `request_id`; a identidade da seleção também participa da verificação de reuso do mesmo UUID.
- A seleção e o hash são validados no servidor; não são considerados prova de autorização.

## Critérios de aceite

1. Sem seleção, o payload enviado ao provedor permanece igual ao comportamento atual.
2. Uma memória, projeto ou tarefa do próprio usuário pode ser selecionado e visualizado antes do envio.
3. Um ID de outro usuário ou inexistente não expõe dados e impede o envio.
4. O cliente não consegue injetar campos não allowlisted nem texto arbitrário como contexto oficial.
5. Alterar ou excluir uma fonte depois da prévia invalida o hash e exige nova confirmação.
6. O provedor recebe somente o conteúdo exibido na prévia confirmada, além da mensagem e do histórico normal da conversa.
7. Cancelar a prévia não chama o provedor nem persiste a seleção.
8. Auditoria registra metadados mínimos, nunca o conteúdo privado.
9. Repetir o mesmo `request_id` com mensagem ou seleção diferente retorna conflito; repetir com o mesmo conteúdo e seleção devolve o turno persistido.
10. Testes cobrem limites, isolamento entre proprietários, concorrência, conteúdo alterado, exclusão da fonte, idempotência e sanitização de falhas do provedor.

## Consequências

A seleção explícita aumenta a transparência e reduz o envio involuntário de dados. Em contrapartida, exige uma etapa de prévia, um contrato de API adicional, validação de hash no servidor e persistência de metadados por mensagem. A primeira implementação será deliberadamente limitada a três tipos de fonte e não introduzirá busca vetorial, RAG automático ou ferramentas.

## Fora do escopo

- Contexto automático por relevância ou embeddings.
- Sincronização com Obsidian.
- Anexos e leitura de arquivos.
- Function calling e execução de ações.
- Memória gerada automaticamente pelo modelo.
- Compartilhamento de contexto entre conversas.
