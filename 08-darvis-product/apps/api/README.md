# API do D.A.R.V.I.S.

## Requisitos

- Python 3.12 ou superior.
- Docker Desktop com Docker Compose para o PostgreSQL local.
- PostgreSQL 16 ou superior para desenvolvimento integrado e produção.

## Configuração local

Execute os comandos a partir deste diretório:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
Copy-Item .env.example .env
```

O projeto declara explicitamente o backend de build e inclui apenas o pacote `app`; os scripts de migração Alembic permanecem no repositório e são carregados pelo Alembic CLI, sem serem empacotados como um pacote Python da aplicação.

Edite o arquivo local `.env`: defina `POSTGRES_PASSWORD` com uma senha aleatória e preencha `DATABASE_URL` com a mesma senha. Gere valores independentes para `SECRET_KEY` e `INITIAL_SETUP_TOKEN` (ambos com pelo menos 32 bytes). Depois de criar o proprietário, remova ou rotacione o token de configuração inicial no ambiente. Nunca versione o arquivo `.env`.

Inicie o PostgreSQL local:

```powershell
docker compose up -d database
```

Aguarde o contêiner ficar saudável. A persistência fica em um volume Docker nomeado; parar o contêiner não apaga os dados.

## Banco e migrações

As tabelas são versionadas pelo Alembic. A aplicação **não executa migrações automaticamente ao iniciar**.

```powershell
alembic upgrade head
```

A migração `0002_auth_rotation_limits` acrescenta o histórico de tokens de renovação e os buckets persistentes de limitação de tentativas. A migração `0003_projetos_tarefas` cria as tabelas de projetos e tarefas, com índices por proprietário, estado e datas. A migração `0004_integridade_proprietario_projeto` adiciona uma chave estrangeira composta para impedir vínculo entre proprietários diferentes e constraints de estado/prioridade. As migrações são incrementais e não reescrevem as anteriores. O controle de rate limit usa UPSERT atômico do PostgreSQL; SQLite não é um backend suportado para autenticação.

Em produção, execute a migração como etapa única e controlada do processo de implantação, antes de disponibilizar a nova versão da API.

## Endpoints de saúde

- `GET /health/live`: informa apenas se o processo está em execução.
- `GET /api/v1/health`: identidade e estado de configuração do serviço.
- `GET /api/v1/ready`: verifica se o banco está configurado e aceita uma consulta simples; retorna HTTP 503 quando não estiver pronto.

## Autenticação

A instalação é de proprietário único. Não existe cadastro público.

| Método | Endpoint | Objetivo |
|---|---|---|
| GET | `/api/v1/auth/csrf` | Bootstrap do token CSRF para restaurar sessão após recarregar o cliente |
| POST | `/api/v1/auth/setup` | Cadastro one-time do proprietário; exige `X-Setup-Token` |
| POST | `/api/v1/auth/login` | Autenticação por e-mail e senha |
| POST | `/api/v1/auth/refresh` | Rotação do refresh token; exige cookie e `X-CSRF-Token` |
| POST | `/api/v1/auth/logout` | Revoga a sessão atual; exige proteção CSRF |
| POST | `/api/v1/auth/logout-all` | Revoga todas as sessões do proprietário autenticado |
| GET | `/api/v1/auth/me` | Retorna a identidade autenticada |

### Transporte e ciclo de vida

- Senhas são armazenadas com Argon2id (64 MiB, 3 iterações, paralelismo 2); o sistema verifica e atualiza hashes quando os parâmetros mudarem.
- O access token é JWT HS256, com emissor/audiência fixos e duração padrão de 10 minutos. O cliente deve mantê-lo apenas em memória, não em `localStorage`.
- O refresh token é aleatório, enviado em cookie HttpOnly, SameSite=Lax e Secure em staging/produção. O servidor persiste somente SHA-256 do valor de alta entropia.
- O endpoint `GET /auth/csrf` cria ou devolve o cookie CSRF não HttpOnly, verifica a origem quando presente e responde com `Cache-Control: no-store`. O cliente usa esse token no cabeçalho `X-CSRF-Token` para restaurar uma sessão depois de recarregar a página.
- Um cookie CSRF legível pelo cliente é comparado em tempo constante com o cabeçalho `X-CSRF-Token`; quando a requisição traz `Origin`, ele também precisa estar na lista CORS permitida.
- Cada renovação consome o token anterior e grava o sucessor na mesma transação. Se um token consumido for apresentado novamente, todas as sessões da família são revogadas.
- Logout individual revoga uma sessão; logout global revoga todas as sessões do usuário.
- O endpoint de configuração inicial exige `INITIAL_SETUP_TOKEN` com pelo menos 32 bytes, permite apenas o primeiro usuário e usa um advisory lock transacional do PostgreSQL para impedir duas configurações concorrentes.
- Limites persistentes: configuração inicial (5 tentativas/15 min, bloqueio de 1 h), login (20/IP e 10/identidade por 15 min) e refresh (60/IP por 15 min). Após 8 falhas consecutivas, a conta é bloqueada por 15 minutos; o contador é zerado após login válido ou expiração do bloqueio. Os identificadores dos buckets são armazenados como HMAC-SHA-256, não como IP/e-mail em claro nas tabelas de limite.
- Endpoints de configuração, login, bootstrap CSRF e logout global rejeitam uma origem `Origin` não cadastrada. Clientes não-browser sem `Origin` continuam suportados; cabeçalhos `X-Forwarded-For` não são confiados.

A rotação simultânea do mesmo token é tratada de forma conservadora: a primeira transação consome o token; a segunda identifica reutilização e revoga a família. O cliente deve evitar disparar duas renovações paralelas.

## Projetos, tarefas e Central de Comando

As operações de domínio exigem access token Bearer e filtram os registros pelo identificador do usuário autenticado. O cliente não pode informar outro proprietário no corpo da requisição.

| Método | Endpoint | Objetivo |
|---|---|---|
| GET | `/api/v1/projects` | Lista projetos; aceita filtros `status`, `limit` e `offset` |
| POST | `/api/v1/projects` | Cria projeto |
| GET | `/api/v1/projects/{project_id}` | Consulta projeto próprio |
| PATCH | `/api/v1/projects/{project_id}` | Atualiza nome, descrição ou situação |
| DELETE | `/api/v1/projects/{project_id}` | Remove projeto próprio; tarefas vinculadas permanecem e ficam sem projeto |
| GET | `/api/v1/tasks` | Lista tarefas; aceita filtros `status`, `project_id`, `priority`, `limit` e `offset` |
| POST | `/api/v1/tasks` | Cria tarefa, opcionalmente vinculada a um projeto próprio |
| GET | `/api/v1/tasks/{task_id}` | Consulta tarefa própria |
| PATCH | `/api/v1/tasks/{task_id}` | Atualiza título, descrição, projeto, prioridade, prazo ou situação |
| DELETE | `/api/v1/tasks/{task_id}` | Remove tarefa própria |
| GET | `/api/v1/dashboard/summary` | Retorna contagens agregadas de projetos e tarefas para o Cognitive Cockpit |

Estados de projeto: `active`, `on_hold`, `completed` e `archived`. Estados de tarefa: `todo`, `in_progress`, `blocked`, `done` e `cancelled`. Prioridades: `low`, `normal`, `high` e `urgent`.

Uma tarefa só pode ser vinculada a um projeto pertencente ao mesmo usuário. Essa regra é validada pelo serviço e também garantida no PostgreSQL pela FK composta `tasks(project_id, user_id) → projects(id, user_id)`. O banco restringe os estados e prioridades aos valores documentados. Prazos devem incluir fuso horário. Ao marcar uma tarefa como concluída, a API registra `completed_at`; ao reabri-la, limpa esse registro. Alterações de projeto e tarefa geram eventos de auditoria persistentes. Ao excluir um projeto, suas tarefas são desvinculadas na mesma transação e permanecem disponíveis.

O resumo do painel usa consultas agregadas no PostgreSQL, filtradas pelo proprietário autenticado. Não utiliza números fixos ou dados de demonstração.

## Verificações automatizadas

O fluxo de verificação está em `.github/workflows/darvis-api-ci.yml` e, nesta etapa, permanece com acionamento manual. Ele inicia um PostgreSQL efêmero, aplica as migrações, executa os testes e verifica o código com Ruff.

Uma execução anterior foi interrompida durante a instalação editável porque o setuptools detectou mais de um pacote de nível superior (`app` e `alembic`). A configuração de build foi corrigida para incluir explicitamente apenas `app*`. O workflow não foi executado novamente após essa correção; os testes e Ruff permanecem sem validação em runtime.

A suíte escrita cobre configuração e primitivas de segurança, schemas, proteção CSRF e bootstrap do CSRF, validação de origem, setup one-time, login, bloqueio de conta, rotação/replay de refresh tokens, rate limiting, revogação individual/global e disputa concorrente de refresh. A camada de domínio tem testes PostgreSQL para ciclo de vida, vínculo, isolamento de proprietário, exclusão, datas, auditoria e rejeição pelo próprio banco de vínculos/estados inválidos. Os testes que apagam dados verificam que `TEST_DATABASE_URL` é PostgreSQL com nome terminado em `_test`; os contratos Pydantic possuem testes de validação. Os fluxos que dependem de persistência são testes de integração PostgreSQL e usam `TEST_DATABASE_URL`.

Para executar localmente:

```powershell
pytest
ruff check .
```

## Estado desta entrega

Implementados em código: modelos e migrações incrementais de identidade, sessões, limites, projetos, tarefas e integridade de propriedade; Argon2id; JWT de acesso; configuração one-time do proprietário; login; rotação e detecção de reutilização; logout individual/global; endpoint de identidade; bootstrap do CSRF; cookies e validação CSRF; CRUD protegido de projetos e tarefas; resumo agregado do painel; auditoria persistente de autenticação e alterações de domínio.

Ainda não comprovados: instalação editável após a correção, execução das migrações no PostgreSQL, testes automatizados, compatibilidade real entre cliente e API, revisão externa de segurança e execução do CI. Esta entrega não deve ser considerada pronta para produção até essas verificações ocorrerem.
