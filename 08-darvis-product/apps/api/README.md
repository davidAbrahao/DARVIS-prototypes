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

A migração `0002_auth_rotation_limits` acrescenta o histórico de tokens de renovação e os buckets persistentes de limitação de tentativas. Ela não reescreve a migração inicial. O controle de rate limit usa UPSERT atômico do PostgreSQL; SQLite não é um backend suportado para autenticação.

Em produção, execute a migração como etapa única e controlada do processo de implantação, antes de disponibilizar a nova versão da API.

## Endpoints de saúde

- `GET /health/live`: informa apenas se o processo está em execução.
- `GET /api/v1/health`: identidade e estado de configuração do serviço.
- `GET /api/v1/ready`: verifica se o banco está configurado e aceita uma consulta simples; retorna HTTP 503 quando não estiver pronto.

## Autenticação

A instalação é de proprietário único. Não existe cadastro público.

| Método | Endpoint | Objetivo |
|---|---|---|
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
- Um cookie CSRF legível pelo cliente é comparado em tempo constante com o cabeçalho `X-CSRF-Token`; quando a requisição traz `Origin`, ele também precisa estar na lista CORS permitida.
- Cada renovação consome o token anterior e grava o sucessor na mesma transação. Se um token consumido for apresentado novamente, todas as sessões da família são revogadas.
- Logout individual revoga uma sessão; logout global revoga todas as sessões do usuário.
- O endpoint de configuração inicial exige `INITIAL_SETUP_TOKEN` com pelo menos 32 bytes, permite apenas o primeiro usuário e usa um advisory lock transacional do PostgreSQL para impedir duas configurações concorrentes.
- Limites persistentes: configuração inicial (5 tentativas/15 min, bloqueio de 1 h), login (20/IP e 10/identidade por 15 min) e refresh (60/IP por 15 min). Os identificadores são armazenados como HMAC-SHA-256, não como IP/e-mail em claro nas tabelas de limite.
- O IP utilizado é o endereço observado pela conexão. Cabeçalhos `X-Forwarded-For` não são confiados.

A rotação simultânea do mesmo token é tratada de forma conservadora: a primeira transação consome o token; a segunda identifica reutilização e revoga a família. O cliente deve evitar disparar duas renovações paralelas.

## Verificações automatizadas

O fluxo de verificação está em `.github/workflows/darvis-api-ci.yml` e, nesta etapa, permanece com acionamento manual. Ele inicia um PostgreSQL efêmero, aplica as migrações, executa os testes e verifica o código com Ruff. A execução está deliberadamente pendente da fase de validação. Como a PR segue em rascunho e a branch padrão não foi alterada, o acionamento manual ficará disponível quando esse workflow chegar à branch padrão do repositório.

Para executar localmente:

```powershell
pytest
ruff check .
```

## Estado desta entrega

Implementados em código: modelos e migração incremental de histórico de refresh tokens e rate limits; Argon2id; JWT de acesso; configuração one-time do proprietário; login; rotação e detecção de reutilização; logout individual/global; endpoint de identidade; cookies e validação CSRF; auditoria persistente das operações de autenticação.

Ainda não comprovados: execução das migrações no PostgreSQL, testes automatizados, compatibilidade real entre cliente e API, revisão externa de segurança e execução do CI. Esta entrega não deve ser considerada pronta para produção até essas verificações ocorrerem.
