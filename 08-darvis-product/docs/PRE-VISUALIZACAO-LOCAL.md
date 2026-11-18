# Prévia e execução local do D.A.R.V.I.S.

Este guia inicia a versão integrada da branch `product/foundation-v0.1` em uma máquina Windows com PowerShell. A prévia usa a API e o PostgreSQL reais; não há login de demonstração nem dados fictícios no Cockpit.

## 1. Requisitos

- Git.
- Python 3.12.
- Node.js 20.9 ou superior e npm.
- Docker Desktop com Docker Compose.
- Acesso ao repositório privado `davidAbrahao/DARVIS-prototypes`.

## 2. Obter a branch do produto

Abra o PowerShell na pasta local do repositório:

```powershell
Set-Location "$env:USERPROFILE\Documents\Projetos\DARVIS-prototypes"
git status --short
git fetch origin
$branch = "product/foundation-v0.1"
if (git branch --list $branch) {
    git switch $branch
} else {
    git switch --track -c $branch "origin/$branch"
}
git pull --ff-only
```

Confira o resultado de `git status --short` antes de trocar de branch. Se houver alterações locais não salvas, preserve-as antes da troca. A branch é isolada da `main`; não faça merge para conseguir executar a prévia.

## 3. Preparar a API e os segredos locais

No PowerShell:

```powershell
Set-Location "$env:USERPROFILE\Documents\Projetos\DARVIS-prototypes\08-darvis-product\apps\api"
if (!(Test-Path .env)) { Copy-Item .env.example .env }
$pgPassword = py -3.12 -c "import secrets; print(secrets.token_urlsafe(32))"
$appSecret = py -3.12 -c "import secrets; print(secrets.token_urlsafe(48))"
$setupToken = py -3.12 -c "import secrets; print(secrets.token_urlsafe(48))"
notepad .env
```

Preencha o arquivo local `.env` com os valores gerados. Não publique nem envie esses valores:

- `POSTGRES_PASSWORD`: use o conteúdo de `$pgPassword`.
- `DATABASE_URL`: `postgresql+psycopg://darvis:<POSTGRES_PASSWORD>@localhost:5432/darvis`.
- `SECRET_KEY`: use o conteúdo de `$appSecret`.
- `INITIAL_SETUP_TOKEN`: use o conteúdo de `$setupToken`.
- Mantenha `APP_ENV=development`, `CORS_ORIGINS=["http://localhost:3000"]` e `AI_PROVIDER=disabled`.

A senha gerada é URL-safe, então pode ser usada na URL de conexão sem codificação adicional. O arquivo `.env` é local e não deve ser commitado.

## 4. Iniciar PostgreSQL, instalar API e aplicar migrações

Ainda no diretório `apps/api`:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
docker compose up -d database
docker compose ps
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Aguarde o PostgreSQL ficar saudável antes de executar `alembic upgrade head`. Essa operação cria/atualiza o banco local até a migration `0007`. Ela não deve ser apontada para um banco com dados importantes.

Com a API ativa, estes endereços devem responder:

- `http://localhost:8000/health/live`
- `http://localhost:8000/api/v1/ready`
- `http://localhost:8000/docs` — documentação interativa de desenvolvimento.

## 5. Criar o primeiro proprietário

O sistema não possui cadastro público. Abra um terceiro PowerShell no diretório `apps/api` e execute a configuração one-time. O comando não envia cabeçalho `Origin`, por isso não precisa ampliar a lista CORS local apenas para configurar o proprietário:

```powershell
$setupToken = ((Select-String -Path .env -Pattern '^INITIAL_SETUP_TOKEN=').Line -split '=', 2)[1]
$ownerEmail = Read-Host "E-mail do proprietário"
$ownerName = Read-Host "Nome completo"
$ownerPassword = Read-Host "Senha (mínimo 12 caracteres)"
$payload = @{
    email = $ownerEmail
    full_name = $ownerName
    password = $ownerPassword
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/setup" -Method POST -Headers @{ "X-Setup-Token" = $setupToken } -ContentType "application/json" -Body $payload
$setupToken = $null
$ownerPassword = $null
$payload = $null
```

Guarde o e-mail e a senha para entrar pela aplicação web. A documentação interativa da API continua disponível em `http://localhost:8000/docs` para consultar os endpoints.

Depois da criação, remova o valor de `INITIAL_SETUP_TOKEN` do arquivo local `.env` e reinicie a API. O endpoint de configuração inicial não permitirá um segundo proprietário.

## 6. Iniciar a aplicação web

Abra um segundo PowerShell:

```powershell
Set-Location "$env:USERPROFILE\Documents\Projetos\DARVIS-prototypes\08-darvis-product\apps\web"
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install --no-package-lock
npm run dev
```

Acesse `http://localhost:3000` e entre com o e-mail e a senha do proprietário. A aplicação usa a API em `http://localhost:8000/api/v1` por padrão.

## 7. O que já pode ser experimentado

- Login, restauração de sessão, renovação e logout.
- Central de Comando com dados agregados vindos do PostgreSQL.
- Criação e alteração de projetos e tarefas, prioridades, prazos e estados.
- Central de Memória manual: criar, pesquisar, editar, categorizar, etiquetar, fixar, arquivar, restaurar e excluir.
- Assistente: criar, selecionar, renomear e excluir conversas; consultar o histórico persistido.

O envio de mensagens ao Gemini permanece desativado. Para habilitá-lo deliberadamente, configure `AI_PROVIDER=gemini` e `GEMINI_API_KEY` somente no ambiente local da API. O texto e o histórico da conversa serão enviados ao provedor; a Central de Memória, projetos e tarefas não são incluídos automaticamente.

Integrações, sincronização Obsidian, voz e execução de ferramentas ainda não fazem parte desta prévia.

## 8. Verificações locais

Para verificar a aplicação web:

```powershell
npm run lint
npm run typecheck
npm run build
```

Para verificar a API:

```powershell
pytest -q
ruff check .
```

**Atenção aos testes de integração:** alguns testes limpam as tabelas do banco de teste. Antes de executá-los com `TEST_DATABASE_URL`, crie e use um banco PostgreSQL separado cujo nome termine em `_test` (por exemplo, `darvis_test`). Nunca aponte `TEST_DATABASE_URL` para o banco local de desenvolvimento `darvis` nem para um banco com dados importantes. Sem `TEST_DATABASE_URL`, os testes PostgreSQL são ignorados.

Essas verificações ainda não foram executadas pelos mantenedores nesta branch. Rodá-las localmente será a primeira validação real; eventuais erros devem ser corrigidos antes de considerar a aplicação pronta para produção.

## 9. Encerrar os serviços

- Pare a API e a aplicação web com `Ctrl+C` nos respectivos terminais.
- Para parar o contêiner sem apagar o banco: `docker compose stop database`.
- Para iniciar novamente: `docker compose start database`.

Não use `docker compose down -v` em um ambiente com dados que deseja preservar, pois a opção `-v` remove o volume persistente do PostgreSQL.
