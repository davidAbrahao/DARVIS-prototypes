# API do D.A.R.V.I.S.

## Requisitos
- Python 3.12 ou superior.
- Ambiente virtual Python.

## Configuração local

Execute os comandos a partir deste diretório:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

## Endpoints de saúde
- `GET /health/live`: informa apenas se o processo da API está em execução.
- `GET /api/v1/health`: informa a identidade da aplicação; nesta estrutura inicial, o banco de dados é explicitamente indicado como não configurado.

## Executar verificações

```powershell
pytest
ruff check .
```

Esta é uma estrutura inicial. PostgreSQL, autenticação e rotas de domínio ainda não foram implementados.
