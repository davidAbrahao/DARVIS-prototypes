# D.A.R.V.I.S. — Backend (Fases 2 e 3)

API em FastAPI com autenticação de usuário único, log de auditoria e migrações Alembic.
Segue o brief: segredos em variáveis de ambiente, autorização por rota, auditoria e
separação entre modelo de IA e memória (a memória entra na Fase 3).

## Status (princípio da seção 12 do brief)
| Módulo | Status |
|---|---|
| Autenticação (JWT access + refresh, Argon2, bloqueio por tentativas) | implementado |
| Log de auditoria | implementado |
| Notas, tarefas, projetos/marcos e dashboard (API CRUD) | implementado (notas no PostgreSQL até a Fase 6) |
| Migrações Alembic, Dockerfile, CI | implementado |
| Gemini, Telegram, agentes, sincronização com Obsidian | planejado (Fases 4 a 6) |

## Rodando local
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env        # defina SECRET_KEY (veja o comentário no arquivo)
alembic upgrade head
python -m scripts.create_user --email voce@exemplo.com --name David
uvicorn app.main:app --reload
```
Documentação interativa em http://localhost:8000/docs (desativada em produção).
Testes: `pytest -q`.

## Endpoints (`/api/v1`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/health` (sem prefixo) | não | verificação de saúde |
| POST | `/auth/login` | não | form `username` (e-mail) + `password` |
| POST | `/auth/refresh` | refresh token | novo par de tokens |
| GET | `/auth/me` | sim | usuário atual |
| POST | `/auth/logout` | sim | invalida todos os tokens do usuário |
| POST | `/auth/change-password` | sim | troca senha e invalida tokens |
| GET | `/system/status` | sim | estado dos módulos (implementado/planejado) |
| GET | `/dashboard` | sim | contadores, notas fixadas, projetos ativos e atividade recente |
| GET/POST | `/notes` | sim | lista (filtros `q`, `category`, `tag`, `pinned`, `limit`, `offset`) e cria |
| GET/PATCH/DELETE | `/notes/{id}` | sim | lê, edita (tags substituídas) e exclui |
| GET | `/notes/{id}/related` | sim | notas com tags em comum, as mais parecidas primeiro |
| GET/POST | `/tasks` | sim | lista (filtros `done`, `priority`, `project_id`) e cria |
| GET/PATCH/DELETE | `/tasks/{id}` | sim | lê, edita (`done` registra `completed_at`) e exclui |
| POST | `/tasks/clear-completed` | sim | remove as concluídas |
| GET/POST | `/projects` | sim | lista (com `progress`) e cria com marcos |
| GET/PATCH/DELETE | `/projects/{id}` | sim | lê, edita e exclui (as tarefas ficam, sem projeto) |
| POST/PATCH/DELETE | `/projects/{id}/milestones[/{mid}]` | sim | gerencia marcos; o progresso é recalculado |

## Decisões de segurança
- **Sem endpoint de cadastro.** O usuário único é criado por script, então ninguém se registra pela internet.
- **Argon2id** para senhas; resposta e tempo iguais para e-mail inexistente e senha errada.
- **Bloqueio**: 5 falhas bloqueiam a conta por 15 minutos (configurável).
- **Tokens**: access de 15 min e refresh de 7 dias, com claim `type` (refresh não vale como access).
  `token_version` no usuário permite revogar tudo no logout ou na troca de senha.
- **Auditoria**: login, falhas, bloqueio, logout e troca de senha ficam em `audit_logs`.
- `SECRET_KEY` é obrigatória e precisa de 32+ caracteres em produção.

## Limitações conhecidas (para decidir depois)
- O refresh token não rotaciona: um refresh roubado vale até expirar ou até o logout global.
- Não há rate limit por IP, só bloqueio por conta. No Cloud Run, considere Cloudflare na frente (já previsto no brief).
- Migrações rodam na subida do container. Serve para uso pessoal com 1 instância; em escala, separe em um job.
- Se for usar o Supabase como banco, use a conexão direta ou o pooler em modo sessão com `DATABASE_URL`.

## Fonte da verdade
Veja `docs/FONTE-DA-VERDADE.md`: tarefas e projetos vivem no PostgreSQL; o conteúdo das notas passa para o Vault do Obsidian na Fase 6.

## Valores aceitos (ASCII, sem acento)
- `priority`: `alta`, `media`, `baixa` | `category`: `decisao`, `ideia`, `referencia`, `pessoal`
- Tags são normalizadas (minúsculas, sem `#`, sem repetição, máx. 20 por nota).
- Todo dado é filtrado por usuário; recurso de outro usuário responde 404.
- A busca de notas usa `ILIKE` (título e texto). Busca semântica fica para depois.

## Próximo passo (Fase 4)
Camada de IA independente de provedor (Gemini primeiro), histórico de conversas e webhook do Telegram, passando por Cloudflare Workers.
