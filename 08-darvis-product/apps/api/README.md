# API do D.A.R.V.I.S.

## Requisitos

- Python 3.12 ou superior.
- PostgreSQL 16 ou superior para desenvolvimento integrado e produção.
- Ambiente virtual Python.

## Configuração local

Execute os comandos a partir deste diretório:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
Copy-Item .env.example .env
```

Preencha `DATABASE_URL` no arquivo local `.env` com a conexão PostgreSQL. O arquivo real não deve ser versionado. A API pode iniciar sem banco apenas durante a estruturação inicial; nesse caso, a prontidão informa indisponibilidade.

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

## Executar verificações

```powershell
pytest
ruff check .
```

## Estado desta entrega

Implementados: configuração tipada, política inicial de produção, engine SQLAlchemy síncrona, dependência de sessão, modelos iniciais de usuário/sessão/auditoria e primeira migração Alembic.

Ainda não implementados: fluxo HTTP de autenticação, criação inicial do proprietário, rotação/revogação de tokens, limitação de tentativas e operações de domínio. A existência dos testes não significa que foram executados nesta etapa.
