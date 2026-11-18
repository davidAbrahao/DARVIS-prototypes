# Status de implementação

Última atualização: 17/11/2026

## Legenda
- **Implementado:** comportamento disponível e verificável no código.
- **Simulado:** interação visual sem serviço real por trás.
- **Planejado:** ainda não implementado.

## Protótipo atual

- [x] Navegação entre os nove módulos.
- [x] Layout responsivo para desktop, tablet e celular.
- [x] Command Center com indicadores e atividade ilustrativos.
- [x] Chat local com resposta demonstrativa.
- [x] Adicionar memória durante a sessão (sem persistência).
- [x] Adicionar projeto durante a sessão (sem persistência).
- [x] Adicionar e concluir tarefas durante a sessão (sem persistência).
- [x] Busca textual local nas seções de memória e projetos.
- [x] Estado demonstrativo de automações e integrações.
- [x] Backend FastAPI inicial com health check e status.

## Ainda não implementado

- [ ] Autenticação, sessão e autorização.
- [ ] PostgreSQL/Supabase, SQLAlchemy e Alembic.
- [ ] Persistência e versionamento de memórias.
- [ ] API de chat e Gemini com abstração de provedores.
- [ ] Recuperação semântica / embeddings.
- [ ] Telegram e webhook autenticado.
- [ ] Leitura/escrita e sincronização do Obsidian Vault.
- [ ] Agentes e ferramentas com trilha de auditoria.
- [ ] Aprovação de ações sensíveis.
- [ ] Backups, observabilidade e deploy.

## Limitações conhecidas

- Os dados exibidos são sementes de demonstração, não dados reais sincronizados.
- O estado de formulários é mantido na memória do frontend e se perde ao recarregar.
- A API não grava dados e não autentica chamadas.
- O botão de conexão de integrações apenas informa que a função ainda não existe.
