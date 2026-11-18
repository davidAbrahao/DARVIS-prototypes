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

Edite o arquivo local `.env`: defina `POSTGRES_PASSWORD` com uma senha aleatória e preencha `DATABASE_URL` com a mesma senha. Use uma senha com caracteres URL-safe ou codifique os caracteres reservados na URL. Nunca versione o arquivo `.env`.

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

Em produção, execute a migração como etapa única e controlada do processo de implantação, antes de disponibilizar a nova versão da API.

## Endpoints de saúde

- `GET /health/live`: informa apenas se o processo está em execução.
- `GET /api/v1/health`: identidade e estado de configuração do serviço.
- `GET /api/v1/ready`: verifica se o banco está configurado e aceita uma consulta simples; retorna HTTP 503 quando não estiver pronto.

## Verificações automatizadas

O fluxo ativo de integração contínua está em `.github/workflows/darvis-api-ci.yml`. Ele instala a API, executa os testes e verifica o código com Ruff para alterações neste diretório.

Para executar localmente:

```powershell
pytest
ruff check .
```

## Estado desta entrega

Implementados: configuração tipada, política inicial de produção, engine SQLAlchemy síncrona, dependência de sessão, modelos iniciais de usuário/sessão/auditoria, primeira migração Alembic e ambiente PostgreSQL local via Docker Compose.

Ainda não implementados: fluxo HTTP de autenticação, criação inicial do proprietário, rotação/revogação de tokens, limitação de tentativas e operações de domínio. A existência dos testes e do fluxo de CI não significa que tenham sido executados ou aprovados nesta entrega.
