# D.A.R.V.I.S. API

## Requirements
- Python 3.12 or newer.
- A virtual environment.

## Local setup

From this directory:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Health endpoints:
- `GET /health/live`: process liveness only.
- `GET /api/v1/health`: application identity; database is explicitly reported as not configured in this foundation build.

Run checks:

```powershell
pytest
ruff check .
```

This is an initial skeleton. PostgreSQL, authentication, and domain routes have not been implemented yet.
