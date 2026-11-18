# Arquitetura-alvo

**Situação:** proposta inicial para o novo espaço do produto. Cada detalhe de implementação deverá ser validado com o código e o ambiente de implantação.

## Visão geral do sistema

O navegador executa a aplicação Next.js PWA e se comunica por HTTPS com a API FastAPI. A API aplica autenticação e autorização, aciona os serviços de domínio, persiste o estado operacional no PostgreSQL, grava eventos permanentes de auditoria e delega operações de conhecimento, IA e serviços externos a adaptadores isolados.

## Aplicações

### Aplicação web
- Next.js App Router, React e TypeScript.
- Tokens de design e componentes reutilizáveis derivados do Stitch.
- Limites entre servidor e navegador claramente definidos.
- Nenhum segredo de provedor ou credencial privilegiada no código enviado ao navegador.
- Acesso autenticado à API por meio de um cliente tipado único.

### API
- FastAPI com rotas versionadas.
- Esquemas de requisição e resposta com Pydantic.
- Modelos e repositórios SQLAlchemy.
- Migrações de banco com Alembic.
- Serviços de domínio separados dos controladores HTTP.
- Serviços centrais de autorização e auditoria.

## Responsabilidade pelos dados

| Dados | Fonte oficial |
|---|---|
| Usuários, sessões, tarefas, projetos e objetivos | PostgreSQL |
| Memórias estruturadas e metadados de conversas | PostgreSQL |
| Notas extensas e documentos de conhecimento | Cofre Markdown |
| Credenciais de integrações | Gerenciador de segredos / segredos da implantação |
| Histórico de aprovações e execuções | Registros de auditoria no PostgreSQL |

O PostgreSQL é a fonte oficial do estado operacional. O cofre é uma camada de documentos e conhecimento, não um substituto para registros transacionais.

## Domínio operacional inicial

A primeira fatia do domínio usa PostgreSQL para manter:

- **Projetos:** proprietário, nome, descrição, situação e timestamps de criação/atualização.
- **Tarefas:** proprietário, projeto opcional, título, descrição, situação, prioridade, prazo com fuso horário e data de conclusão.
- **Auditoria:** eventos de criação, atualização e exclusão com usuário responsável e identificação do recurso.

Todas as consultas de projeto e tarefa aplicam o `user_id` da identidade autenticada. O serviço valida a propriedade do projeto antes de criar ou vincular uma tarefa. O banco também impõe uma chave estrangeira composta de `(project_id, user_id)` para `(projects.id, projects.user_id)`, impedindo vínculos cruzados mesmo fora do serviço. Constraints SQL limitam estados e prioridades aos valores definidos pelos contratos. Listagens oferecem filtros e paginação limitados pela API. O resumo da Central de Comando é calculado por consultas agregadas no banco.

Situações de projeto: `active`, `on_hold`, `completed`, `archived`. Situações de tarefa: `todo`, `in_progress`, `blocked`, `done`, `cancelled`. Prioridades: `low`, `normal`, `high`, `urgent`.

A interface mantém o access token somente em memória. O refresh permanece no cookie HttpOnly. A renovação automática de chamadas protegidas compartilha uma promessa na aba e utiliza Web Locks para coordenar abas quando o navegador oferece essa API. Nenhum refresh token é copiado para JavaScript ou para armazenamento persistente do navegador. Login, refresh e logout usam a mesma trava. Quando o logout é confirmado, um evento BroadcastChannel sem credenciais notifica as outras abas para limpar o estado local.

## Memória estruturada — primeira implementação

A entidade `memory_entries` é um registro manual, pertencente a um usuário e persistido no PostgreSQL. Cada item possui título, conteúdo, categoria, etiquetas, origem, estado fixado/arquivado e timestamps. A API oferece pesquisa parcial, filtro de categoria, inclusão opcional de arquivados e paginação.

A origem é limitada no serviço e no banco a `manual`. Não há captura automática de fatos pelo modelo, ingestão externa ou sincronização com Obsidian. A interface apresenta a memória como conteúdo sob controle do proprietário, com ações explícitas de criação, edição, fixação, arquivamento, restauração e exclusão.

A memória estruturada e o cofre Markdown são camadas diferentes. O PostgreSQL mantém registros curtos e consultáveis; o Obsidian permanece planejado para notas extensas e documentos, por meio de um adaptador futuro. Nenhuma memória é incluída automaticamente em conversas com provedores. Uma futura seleção de contexto deverá mostrar exatamente quais registros serão compartilhados e com qual provedor.

## Conversas e provedores de IA — primeira implementação

As conversas e mensagens do assistente são entidades operacionais do PostgreSQL, sempre vinculadas ao usuário autenticado. A API aplica isolamento de proprietário nas consultas e utiliza uma FK composta para impedir associação cruzada entre conversa e usuário.

O serviço recebe um UUID idempotente por mensagem. A mesma chave, repetida na mesma conversa, devolve o turno persistido em vez de chamar novamente o provedor. A versão da conversa usa comparação otimista para evitar que respostas concorrentes sejam gravadas fora de ordem. O histórico enviado ao modelo é limitado às 20 mensagens anteriores e a 48.000 caracteres, além da mensagem atual.

Os provedores implementam um contrato comum no servidor. O adaptador Gemini usa o SDK oficial Python, mas fica desativado por padrão; sua chave é lida exclusivamente do ambiente/gerenciador de segredos da API. O endpoint de estado informa somente se a configuração está presente, sem expor credenciais ou afirmar que o serviço externo está saudável.

A primeira implementação só gera texto. Não registra ferramentas, não executa ações e não envia tarefas, projetos, arquivos ou dados externos como contexto. O provedor recebe apenas o histórico explícito da conversa. A execução de ferramentas exigirá contratos estritos, permissões no servidor, aprovação quando necessário, idempotência e auditoria em uma etapa posterior.

## Limites de atuação da IA

O modelo é um componente de raciocínio não confiável. Ele pode propor chamadas estruturadas de ferramentas, mas não pode executar diretamente comandos arbitrários, SQL, operações no sistema de arquivos ou requisições de rede.

Fluxo obrigatório: montar o contexto mínimo autorizado; enviar somente o contexto permitido pelas configurações do usuário e pelas políticas do provedor; interpretar a resposta usando um esquema estrito; rejeitar ferramentas desconhecidas e campos inesperados; registrar uma proposta pendente quando a aprovação for necessária; verificar novamente a autorização e o estado da proposta no momento da aprovação; executar por meio de uma ferramenta permitida no servidor; persistir o resultado e o evento de auditoria.

Os adaptadores de provedores devem expor uma interface comum e permitir controles específicos de privacidade e configuração. Nenhum provedor é considerado definitivo.

## Autenticação e autorização

- Senhas protegidas com Argon2id.
- Credenciais de acesso de curta duração.
- Sessões de renovação rotativas e revogáveis.
- Detecção de reutilização de tokens de renovação.
- Limites de requisições nos fluxos de autenticação e nos endpoints de maior custo.
- Autorização aplicada a cada recurso protegido.
- Preferência por cookies Secure, HttpOnly e SameSite quando a topologia de implantação permitir.
- Proteção contra CSRF quando forem utilizados cookies de sessão.

## Direção de implantação

Implantação candidata: hospedagem gerenciada compatível com Next.js para a aplicação web; contêiner FastAPI no Google Cloud Run; PostgreSQL gerenciado; Secret Manager para credenciais; Cloudflare para DNS, proteção de borda e funções de gateway quando justificadas.

A topologia não está fechada até que custos, limites de rede, estratégia de cookies e sessões, cópias de segurança e requisitos operacionais sejam validados.

## Observabilidade

- Registros estruturados da aplicação com identificadores de correlação.
- Endpoints de disponibilidade do processo e prontidão com significados distintos.
- Métricas derivadas de operações reais.
- Nenhum conteúdo de mensagens pessoais ou segredo nos registros rotineiros.
- Registros de auditoria separados dos registros de diagnóstico.
