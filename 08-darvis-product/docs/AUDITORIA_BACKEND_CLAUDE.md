# Auditoria técnica — backend Claude

**Origem auditada:** `04-claude/prototype/darvis-backend` na branch `main` do repositório central.  
**Destino da evolução:** `08-darvis-product/apps/api`.  
**Método:** leitura estática dos arquivos, modelos, rotas, serviços, migrações, testes, Dockerfile e CI.  
**Execução:** nenhum código foi executado; testes, build, migrações e implantação não foram validados em runtime.

## Resumo executivo

O backend Claude é a referência técnica mais completa entre os protótipos auditados. Ele oferece uma base aproveitável de FastAPI, SQLAlchemy 2, Alembic, PostgreSQL via psycopg 3, Argon2, JWT, isolamento de recursos por usuário, auditoria persistente e testes de API.

**Decisão:** reaproveitamento seletivo, não cópia integral. A implementação será adaptada ao produto integrado, preservando o protótipo original sem alterações.

## O que está comprovado no código

- Aplicação FastAPI com rotas versionadas em `/api/v1`.
- Configuração por Pydantic Settings.
- SQLAlchemy síncrono e sessões por requisição.
- Normalização de URLs PostgreSQL para psycopg 3.
- Migrações Alembic para usuários, auditoria, notas, tags, tarefas, projetos e marcos.
- Hash de senha com Argon2.
- JWT de acesso e renovação, com tipo e versão de token.
- Bloqueio de conta após tentativas malsucedidas.
- Logout global e invalidação de tokens por versão.
- Rotas CRUD para notas, tarefas e projetos.
- Verificações de propriedade de recursos em boa parte das rotas.
- Testes escritos para autenticação, isolamento, ciclo de vida de tarefas, projetos, notas e painel.
- Contêiner executado como usuário não privilegiado.
- CI configurada para instalar dependências e executar pytest.

Esses itens comprovam a existência de código e testes escritos, não que tenham sido executados ou aprovados.

## Achados e decisões de adaptação

### A1 — Renovação de token sem rotação real

**Evidência:** `POST /auth/refresh` valida um JWT de renovação e chama `issue_tokens(user)`. O token anterior não é persistido, consumido ou revogado individualmente. Não há identificador de sessão persistido nem família de tokens.

**Risco:** um token de renovação roubado pode ser reutilizado até expirar ou até a versão global do usuário mudar. Não há detecção confiável de replay.

**Adaptação obrigatória:** introduzir sessões persistentes, identificadores aleatórios de token, armazenamento apenas de hash do token de renovação, rotação transacional, revogação, expiração e detecção de reutilização por família. O logout deve poder revogar uma sessão específica e todas as sessões do usuário.

### A2 — Bloqueio de login sem limitação por IP e sem proteção de concorrência

**Evidência:** `authenticate` incrementa `failed_attempts` e define `locked_until` em operações ORM comuns. Não há rate limiter por IP ou por endpoint. Não foi identificada atualização atômica ou bloqueio de linha para concorrência.

**Risco:** tentativas distribuídas, corrida entre requisições concorrentes e consumo desnecessário de recursos de hash.

**Adaptação obrigatória:** limite por IP e por identificador de conta, janela deslizante, resposta consistente, armazenamento compartilhado adequado à implantação e atualização atômica dos contadores. Não confiar exclusivamente em IP enviado por cabeçalhos de proxy.

### A3 — Configuração de produção permissiva

**Evidência:** `database_url` tem padrão SQLite; `secret_key` é obrigatório, mas as validações explícitas são limitadas; ambiente é texto livre. A configuração não exige PostgreSQL em produção nem rejeita todos os valores de exemplo.

**Risco:** implantação com configuração inadequada ou segredo previsível por erro operacional.

**Adaptação obrigatória:** validar ambiente por enumeração, exigir PostgreSQL em produção, rejeitar segredos conhecidos/de exemplo e exigir entropia e tamanho mínimos. Manter SQLite somente em testes ou desenvolvimento explicitamente configurado.

### A4 — Auditoria incompleta e sem contrato de evento

**Evidência:** existem eventos para login, logout, troca de senha e algumas criações/exclusões. Atualizações de notas, tarefas, projetos e marcos não são uniformemente registradas. O modelo armazena ação, usuário, IP, detalhe textual e data, sem identificador de correlação, recurso tipado, resultado ou metadados estruturados.

**Risco:** reconstrução incompleta de alterações e dificuldade para investigar ações de agentes e integrações.

**Adaptação obrigatória:** definir contrato de evento estruturado com ator, ação, tipo e identificador do recurso, resultado, instante UTC, request/correlation ID e metadados permitidos. Nunca registrar tokens, senhas ou conteúdo privado desnecessário. Escrita de domínio e evento devem compartilhar a mesma transação quando aplicável.

### A5 — Migrações acopladas à inicialização do contêiner

**Evidência:** o Dockerfile executa `alembic upgrade head` antes de iniciar Uvicorn.

**Risco:** múltiplas réplicas podem disputar a execução de migrações; falhas de migração ficam acopladas à disponibilidade da aplicação.

**Adaptação obrigatória:** executar migrações como etapa controlada e única do processo de implantação. A inicialização da API não deve modificar o schema.

### A6 — Saúde e prontidão não estão separadas

**Evidência:** o endpoint `/health` responde apenas `status: ok`; não verifica dependências. A API não diferencia liveness e readiness.

**Risco:** orquestrador pode considerar pronta uma instância sem banco disponível.

**Adaptação obrigatória:** manter liveness sem dependências e readiness com verificação real e limitada do PostgreSQL. Não expor detalhes internos ou credenciais na resposta.

### A7 — Política de CORS e confiança em proxy precisa de desenho de implantação

**Evidência:** CORS usa lista configurável e cabeçalhos permitidos explícitos, mas a configuração de produção, cookies, origens e proxies confiáveis ainda não foi formalizada como contrato de implantação. O IP de origem é lido diretamente de `request.client.host`.

**Risco:** configuração inconsistente atrás de proxy e eventual confiança indevida em cabeçalhos encaminhados.

**Adaptação obrigatória:** documentar topologia, definir proxies confiáveis explicitamente e só então interpretar IP encaminhado. Manter origens explícitas. Decidir estratégia de cookie antes de habilitar credenciais cross-origin.

### A8 — Relacionamentos e integridade devem ser reforçados no banco

**Evidência:** a API valida propriedade do projeto ao criar/atualizar tarefas e filtra consultas por usuário. Porém, a integridade entre `tasks.user_id` e `tasks.project_id` não é garantida por uma chave estrangeira composta que assegure o mesmo proprietário.

**Risco:** futuras rotas, scripts ou integrações podem criar vínculos cruzados se não repetirem a validação da API.

**Adaptação obrigatória:** avaliar chaves estrangeiras compostas/constraints e manter autorização no serviço. Cobrir tentativas de associação cruzada nos testes.

### A9 — Cobertura de testes não contempla os novos requisitos de sessão

**Evidência:** os testes verificam login, refresh básico, logout global e bloqueio. Não verificam rotação de token, reutilização, revogação individual, concorrência, rate limit, expiração de sessão ou recuperação após falha transacional.

**Adaptação obrigatória:** acrescentar testes unitários e de integração para todos esses cenários antes de considerar autenticação pronta.

### A10 — Estratégia síncrona de banco

**Evidência:** engine e sessões SQLAlchemy são síncronas, enquanto os endpoints são funções síncronas do FastAPI.

**Decisão:** não migrar automaticamente para async. A estratégia síncrona é coerente com as rotas atuais e pode ser suficiente para a primeira implantação. Reavaliar somente com medição, necessidade de concorrência ou integrações que justifiquem a complexidade adicional.

## Pontos positivos a preservar

- Separação entre rotas, serviços, modelos, schemas e persistência.
- Hash Argon2 para senhas.
- Respostas de login genéricas para usuário inexistente e senha incorreta.
- Tipo de token validado no servidor.
- Invalidação global por versão de token como controle complementar.
- Resposta 404 para recursos de outro usuário.
- Paginação em notas e tarefas.
- Hash de conteúdo de notas.
- Migrações versionadas.
- Testes de isolamento entre usuários.
- Uso de usuário não privilegiado no contêiner.

## Plano de adaptação para o produto

1. Consolidar configuração e dependências da API integrada.
2. Adicionar persistência PostgreSQL, sessão SQLAlchemy e Alembic com migração inicial própria.
3. Definir modelo de usuário e sessões persistentes com rotação e revogação.
4. Implementar autenticação, autorização e rate limiting com testes de abuso.
5. Estruturar auditoria transacional e identificadores de correlação.
6. Portar modelos e operações de tarefas, projetos e notas seletivamente.
7. Separar liveness e readiness; retirar migrações da inicialização do contêiner.
8. Integrar o frontend por cliente tipado, preservando a experiência visual do Stitch.
9. Validar dependências, testes, build, migrações e implantação em uma fase explicitamente autorizada.

## Limites desta auditoria

- Não foram executados testes, builds, migrações, scripts ou contêineres.
- Não foi testada uma instância PostgreSQL real.
- Não foi realizada análise dinâmica, teste de penetração ou revisão de dependências por vulnerabilidade.
- A auditoria não certifica o backend para produção.
- Os arquivos em `04-claude` permanecem intocados.
