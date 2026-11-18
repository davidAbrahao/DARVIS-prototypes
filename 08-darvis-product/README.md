# D.A.R.V.I.S. — Espaço de desenvolvimento do produto

**David Abrahão Rodrigues Virtual Intelligence System**

Este diretório marca o início do produto integrado. Os seis projetos de protótipo permanecem preservados como material de referência; é neste espaço que a aplicação orientada à produção será construída.

## Princípio do produto

D.A.R.V.I.S. é um sistema de inteligência pessoal. Deve compreender o contexto autorizado pelo usuário, organizar conhecimentos e atividades, apoiar decisões e executar ações explicitamente autorizadas, sempre com rastreabilidade. Não é apenas um chatbot ou um painel visual.

## Experiência

A direção visual oficial é o **Cognitive Cockpit**, inspirada no protótipo criado no Google Stitch:
- Deep Space: `#080C14`
- Grafite: `#111827`
- Ciano elétrico: `#38BDF8`
- Verde operacional: `#10B981`
- Tipografias Space Grotesk, Geist e JetBrains Mono.

A interface deve ser responsiva, acessível, organizada mesmo com alta densidade de informações e transparente: cada status, métrica, conexão e indicador de execução deve refletir o estado real do sistema.

**Princípio de produto:** não sacrificar a experiência visual para construir a engenharia, nem sacrificar a engenharia para manter a aparência. As duas evoluem juntas.

## Direção técnica inicial

- Aplicação web: Next.js, React, TypeScript e PWA.
- API: FastAPI, Python e Pydantic.
- Persistência: PostgreSQL, SQLAlchemy e Alembic.
- Conhecimento: Markdown e integração com Obsidian por meio de um adaptador explícito.
- Inteligência artificial: arquitetura independente de provedor; Gemini é o primeiro candidato, não uma dependência definitiva.
- Execução: ferramentas no servidor, com autorização, aprovação, idempotência e registros de auditoria.

Estas são decisões de arquitetura para o novo espaço do produto, não afirmações de que toda essa estrutura já esteja implementada.

## Auditoria e decisões técnicas

- [Auditoria estática do backend Claude](docs/AUDITORIA_BACKEND_CLAUDE.md): o que pode ser reaproveitado, riscos encontrados e plano de adaptação.
- [ADR-0002 — Sessões e autenticação](docs/DECISOES/ADR-0002-SESSOES-E-AUTENTICACAO.md): direção para sessões persistentes, rotação, revogação e detecção de reutilização.
- [ADR-0003 — Conversas e provedores de IA](docs/DECISOES/ADR-0003-CONVERSAS-E-PROVEDORES-IA.md): persistência, idempotência e limites do primeiro assistente textual.
- [ADR-0004 — Memória estruturada manual](docs/DECISOES/ADR-0004-MEMORIA-ESTRUTURADA-MANUAL.md): controle do proprietário, proveniência e separação de Obsidian.

## Primeira fatia implementada

O espaço de produto já contém a fundação de API e a primeira fatia de domínio, em código:

- Autenticação de proprietário único com Argon2id, access JWT curto e refresh token rotativo em cookie HttpOnly.
- Proteção CSRF, rate limits persistentes, bloqueio temporário de login, auditoria e revogação de sessões.
- Migrações Alembic incrementais até `0007` para identidade, sessões, auditoria, projetos, tarefas, integridade referencial, conversas e memória estruturada manual.
- CRUD protegido de projetos e tarefas, com isolamento pelo usuário autenticado, FK composta no PostgreSQL e constraints para estados/prioridades.
- Conversas e mensagens persistidas, com isolamento por proprietário e UUID idempotente para reenvios.
- Central de Memória manual com categorias, etiquetas, busca, fixação, arquivamento e exclusão, isolada por proprietário e auditada. Não há captura automática nem inclusão no contexto do Gemini.
- Resumo agregado de projetos e tarefas para a Central de Comando.
- Cliente web com restauração da sessão, renovação compartilhada e coordenação entre abas quando a Web Locks API estiver disponível; fila local como fallback dentro da aba.
- Tela de login e Cognitive Cockpit com criação de projetos e tarefas, vínculo com projeto, prioridade, prazo, alteração de situação e logout coordenado.
- Central de Memória conectada à API, com criação, pesquisa, edição, fixação, arquivamento e exclusão de registros manuais.

## Validação automatizada

Os workflows do GitHub Actions são acionados automaticamente quando arquivos da API ou da aplicação web são alterados na branch `product/foundation-v0.1`; também podem ser iniciados manualmente.

**API — execução 44362125724 (18/11/2026):**
- PostgreSQL 16 efêmero iniciado.
- Migrações Alembic aplicadas até `head` (incluindo 0001–0007).
- `pytest -q`: 85 testes aprovados.
- `ruff check .`: aprovado.

**Web — execução 44359854365 (18/11/2026):**
- Dependências instaladas.
- ESLint aprovado.
- TypeScript aprovado.
- Build Next.js aprovado.

As execuções verdes ocorreram em commits de código ancestrais do HEAD atual; a alteração posterior no HEAD foi documental. A PR permanece aberta, em rascunho e sem merge. Isso comprova os gates automatizados nos commits indicados, não uma validação ponta a ponta no navegador.

**Pendências antes de considerar a fundação concluída:** executar o roteiro local com PostgreSQL e navegador no PC pessoal; validar login, refresh, cookies, CORS e CRUD na topologia real; revisar segurança, acessibilidade e responsividade. O produto não está liberado para produção.

## Organização do repositório

- `docs/PRODUCT_VISION.md`: visão do produto, princípios e experiência.
- `docs/ARCHITECTURE.md`: arquitetura-alvo, limites e fluxo de dados.
- `docs/ROADMAP.md`: plano incremental e critérios de aceite.
- `docs/SECURITY_BASELINE.md`: requisitos mínimos de segurança.
- `docs/DECISIONS.md`: histórico das decisões de arquitetura.

## Pré-visualização local

O roteiro para abrir a versão integrada no navegador, iniciar PostgreSQL/API, criar o primeiro proprietário e executar verificações locais está em [Pré-visualização local](docs/PRE-VISUALIZACAO-LOCAL.md). A CI valida os gates de API e web; a execução local e a jornada ponta a ponta em navegador continuam pendentes.

## Regras inegociáveis de engenharia

- Nunca incluir segredos no controle de versão ou nos arquivos enviados ao navegador.
- Nunca tratar o estado local da interface como persistência oficial.
- Nunca permitir que um modelo de IA execute diretamente código ou SQL arbitrário.
- Validar nomes e parâmetros de ferramentas no servidor, usando listas de permissões e esquemas tipados.
- Exigir autorização no servidor para ações sensíveis.
- Registrar aprovações e resultados de execução em trilhas persistentes de auditoria.
- Nunca apresentar valores simulados como indicadores em tempo real.
- Preservar os seis protótipos de origem sem alterações.
- Nunca afirmar que testes ou implantações foram concluídos sem executá-los de fato.
