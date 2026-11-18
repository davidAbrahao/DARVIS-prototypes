# ADR-0003 — Conversas persistentes e provedores de IA

- **Estado:** adotada para a primeira entrega textual; requer validação operacional e revisão de privacidade antes de produção.
- **Data:** 18/11/2026.
- **Contexto:** o D.A.R.V.I.S. precisa oferecer conversas retomáveis sem acoplar o domínio a um SDK específico ou permitir que o modelo execute ações diretamente.

## Decisão

### Persistência e isolamento

- Conversas e mensagens são registros operacionais no PostgreSQL.
- Cada conversa pertence a um usuário. As rotas e consultas aplicam a identidade autenticada.
- A tabela de mensagens usa uma FK composta para garantir que conversa e proprietário correspondam.
- Excluir uma conversa remove suas mensagens vinculadas.
- O conteúdo do histórico não é duplicado em localStorage ou sessionStorage.

### Idempotência e concorrência

- Cada envio inclui um UUID gerado pelo cliente.
- O UUID é único por conversa e proprietário. Depois que o turno é persistido, repetir a mesma solicitação devolve o resultado sem chamar novamente o modelo. O controle de versão otimista permite apenas um turno ser persistido quando há chamadas simultâneas; nesta versão, duas chamadas literalmente simultâneas com o mesmo UUID ainda podem executar duas gerações externas antes da disputa de versão ser resolvida.
- A versão da conversa é incrementada por comparação otimista.
- Se a conversa mudar durante a geração, a API não persiste um turno fora de ordem e responde com HTTP 409.
- O rate limit de geração é persistente por usuário e coordenado no PostgreSQL.

### Abstração de provedor

- O serviço de conversas depende de um protocolo comum `ChatProvider`, não diretamente de um SDK.
- O primeiro adaptador é o Google Gemini, por meio do SDK oficial `google-genai`.
- O provedor permanece desativado por padrão. `AI_PROVIDER=gemini` e `GEMINI_API_KEY` precisam ser configurados somente no ambiente/gerenciador de segredos da API.
- Nenhuma credencial de provedor é enviada ao navegador ou registrada em logs.
- O estado da configuração não é tratado como teste de saúde externa do provedor.
- O histórico enviado é limitado às 20 mensagens anteriores e a 48.000 caracteres, além da mensagem atual, cujo limite é de 16.000 caracteres.

### Limites da primeira versão

- Somente texto. Sem tools/function calling, execução de ferramentas, tarefas automáticas, voz, anexos ou sincronização externa.
- A conversa recebe apenas o histórico daquela conversa. O sistema não anexa automaticamente tarefas, projetos, notas, dados do dispositivo ou outras informações pessoais.
- O modelo é instruído a não declarar ações executadas. A instrução de sistema não substitui controles de segurança do servidor; a segurança atual decorre também da ausência de ferramentas registradas.
- A interface permite criar, selecionar, renomear e excluir conversas, sempre utilizando os endpoints autenticados. A exclusão é confirmada pelo usuário na interface.
- A política inicial mantém o histórico até exclusão explícita da conversa. Política de retenção automática, exportação e exclusão abrangente deve ser decidida antes da produção.
- Falhas do provedor não persistem uma mensagem parcial; a API registra o evento sem gravar o prompt no log e devolve erro genérico.

## Alternativas rejeitadas

- **SDK Gemini chamado diretamente pelos endpoints:** cria acoplamento e dificulta substituição de provedor.
- **Histórico só no navegador:** impede retomada em dispositivos diferentes e não oferece autorização central.
- **Execução automática de chamadas de ferramenta pelo modelo:** não atende aos requisitos de autorização, aprovação e rastreabilidade.
- **Habilitar IA por padrão:** faria o sistema tentar usar um provedor sem consentimento/configuração explícita.

## Consequências e próximos passos

A aplicação precisa validar cookies/CORS, migrations, persistência, limites e concorrência em PostgreSQL real antes de usar o assistente em produção. Streaming, exportação, limpeza por retenção, seleção de contexto e ferramentas aprovadas permanecem fora da primeira versão.

## Critérios mínimos de aceite

- O provedor desativado retorna estado explícito e não realiza chamadas externas.
- Chaves de API nunca aparecem nos contratos, respostas ou logs.
- Conversas e mensagens são isoladas por proprietário.
- Repetir um UUID devolve o mesmo turno sem gerar uma segunda resposta.
- Falhas de provedor não gravam turnos incompletos nem detalhes internos.
- Duas gerações concorrentes não gravam respostas fora de ordem.
- Nenhuma ferramenta é executada pelo modelo nesta etapa.
