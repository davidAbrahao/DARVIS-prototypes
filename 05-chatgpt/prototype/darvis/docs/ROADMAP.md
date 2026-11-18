# Roadmap de desenvolvimento

## Fase 1 — Protótipo visual e experiência do usuário
- [x] Shell responsivo e identidade visual.
- [x] Módulos principais e navegação.
- [x] Interações locais demonstrativas.
- [ ] Rodada de validação de UX e priorização com o usuário.

## Fase 2 — Backend e autenticação
- [x] Esqueleto FastAPI e health check.
- [ ] Modelo de usuário, sessões e autorização.
- [ ] CORS por ambiente, rate limiting e validação de entrada.
- [ ] Testes automatizados e tratamento de erros.

## Fase 3 — Banco e memória persistente
- [ ] PostgreSQL/Supabase.
- [ ] SQLAlchemy e Alembic.
- [ ] Tabelas de projetos, tarefas, memórias, conversas e auditoria.
- [ ] Backup, exportação e política de retenção.

## Fase 4 — Gemini e Telegram
- [ ] Interface abstrata de provedores de IA.
- [ ] Gemini no backend com limites e logs.
- [ ] Contexto de sessão e recuperação de memórias.
- [ ] Telegram webhook autenticado e captura para inbox.

## Fase 5 — Agentes e automações
- [ ] Registro de ferramentas com schemas e permissões.
- [ ] Aprovação humana e idempotência para ações.
- [ ] Agendamentos e execução observável.

## Fase 6 — Obsidian
- [ ] Convenção de pastas e frontmatter.
- [ ] Importação/exportação Markdown.
- [ ] Sincronização com detecção de conflitos.

## Fase 7 — Experiência multiplataforma
- [ ] PWA instalável e notificações autorizadas.
- [ ] Voz (STT/TTS) com consentimento.
- [ ] Agente Windows com escopo local mínimo.
