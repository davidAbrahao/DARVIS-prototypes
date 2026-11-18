# Roteiro de desenvolvimento

O projeto será entregue em etapas verticais pequenas e verificáveis. Uma etapa só será considerada concluída quando seus critérios de aceite forem atendidos.

## Fase 0 — Fundação do produto
- [x] Criar um espaço isolado para o produto.
- [x] Registrar a visão do produto e a arquitetura inicial.
- [x] Definir a base de segurança e a sequência de entregas.
- [x] Auditar estaticamente o backend herdado do Claude e registrar riscos e adaptações.
- [ ] Confirmar versões de execução suportadas e compatibilidade das dependências.

**Critério de saída:** arquitetura e organização do repositório coerentes; nenhum código herdado incorporado sem revisão.

## Fase 1 — Estrutura segura da aplicação
- [x] Estabelecer a estrutura inicial da API e da aplicação web.
- [x] Adicionar exemplos de ambiente contendo apenas valores fictícios.
- [x] Implementar validação tipada de configuração e requisitos básicos de produção.
- [x] Adicionar engine SQLAlchemy, modelos iniciais e estrutura Alembic.
- [x] Adicionar migração inicial de identidade, sessões e auditoria.
- [x] Separar liveness, health de configuração e readiness com verificação real do banco.
- [x] Preparar workflows manuais para testes PostgreSQL/análise estática da API e qualidade/build web (execução ainda pendente; sem disparo automático nesta fase).
- [x] Documentar ambiente PostgreSQL local via Docker Compose (inicialização e migração ainda pendentes).

**Critério de saída:** configuração inicial documentada; API e aplicação web iniciam em ambiente controlado; verificações da integração contínua são executadas com sucesso.

## Fase 2 — Identidade e domínio principal
- [x] Implementar cadastro inicial one-time do proprietário, sem cadastro público.
- [x] Implementar Argon2id, login, access token curto e refresh token em cookie HttpOnly.
- [x] Implementar rotação transacional, histórico de tokens e detecção de reutilização.
- [x] Implementar revogação individual/global e endpoint de identidade autenticada.
- [x] Implementar proteção CSRF e rate limiting persistente para setup, login e refresh.
- [x] Persistir eventos relevantes de autenticação na auditoria.
- [ ] Executar e aprovar testes unitários e de integração no PostgreSQL.
- [ ] Executar revisão independente de segurança da implementação.
- [x] Adicionar operações CRUD de tarefas e projetos com verificação de propriedade e auditoria persistente.
- [x] Criar migration incremental de projetos e tarefas com índices por proprietário.
- [x] Impor no PostgreSQL o vínculo composto entre tarefa, projeto e proprietário e constraints de estado/prioridade.
- [x] Adicionar resumo agregado real para a Central de Comando.

**Critério de saída:** o proprietário autentica e consulta sua identidade; renova e revoga sessões com controles transacionais; projetos e tarefas são persistidos e isolados por proprietário. Testes executados no PostgreSQL e revisão de segurança permanecem pendentes.

## Fase 3 — Cognitive Cockpit
- [x] Preservar tokens visuais, tipografia, navegação e estrutura responsiva inicial do Stitch.
- [x] Implementar a Central de Comando com resumo, tarefas e projetos reais da API.
- [x] Adicionar estados de carregamento, vazio, erro e indisponibilidade para dados de domínio.
- [x] Permitir criação de tarefa/projeto, conclusão de tarefa, alteração de situação de tarefa/projeto e preenchimento de projeto, prioridade e prazo na tarefa.
- [ ] Completar verificações de acessibilidade e responsividade em dispositivos reais.
- [x] Integrar o espaço de conversas do assistente com histórico persistente e status real do provedor.
- [ ] Integrar módulos de memória externa, agenda e demais áreas.

**Critério de saída:** interface utilizável em desktop e dispositivos móveis, exibindo apenas estados reais do backend. A primeira fatia de projetos e tarefas está escrita; a validação operacional e as verificações de acessibilidade continuam pendentes.

## Fase 4 — Assistente e arquitetura de provedores
- [x] Definir contratos de conversa/mensagem e interface de provedor independente de SDK.
- [x] Integrar o adaptador Gemini no servidor, desativado por padrão e com credencial exclusivamente no ambiente da API.
- [x] Persistir conversas e mensagens no PostgreSQL com isolamento por proprietário.
- [x] Adicionar limite de histórico/contexto, rate limit por usuário e auditoria sem gravar o conteúdo do prompt.
- [x] Adicionar idempotência por UUID e controle otimista para evitar turnos duplicados ou fora de ordem.
- [ ] Definir controles de retenção, exportação e exclusão além da exclusão individual de conversa.
- [ ] Adicionar seleção de contexto explícita e minimização configurável pelo usuário.
- [ ] Adicionar esquema estrito e lista de permissões para propostas de ferramentas.
- [ ] Adicionar aprovação no servidor e execução idempotente de ferramentas.

**Limite atual:** chat textual com histórico persistente. Não há ferramentas, execução de ações, voz, anexos, memória externa ou contexto automático de tarefas/projetos.

**Critério de saída:** o assistente mantém conversas persistentes com um provedor configurável; depois, uma ação tipada só poderá ser executada mediante autorização, aprovação e auditoria no servidor.

## Fase 5 — Memória e Obsidian
- [x] Definir esquema e ciclo de vida inicial de memórias estruturadas no PostgreSQL.
- [x] Implementar CRUD manual com categorias, etiquetas, fixação, arquivamento, restauração e exclusão.
- [x] Adicionar pesquisa, filtros, paginação e auditoria de alterações.
- [x] Impor origem `manual` no serviço e no banco; não permitir que o assistente grave memórias automaticamente.
- [x] Criar a Central de Memória conectada à API, com estados reais e ações explícitas.
- [ ] Definir convenções de pastas e metadados das notas no cofre.
- [ ] Implementar operações explícitas de importação, exportação e sincronização Obsidian.
- [ ] Adicionar tratamento de conflitos, indexação e propagação de exclusões.
- [ ] Apresentar origem e estado real da sincronização.
- [ ] Permitir seleção explícita de memórias como contexto para o assistente, com prévia do que será compartilhado.

**Limite atual:** memória estruturada manual no banco. Não existe sincronização Markdown/Obsidian e o assistente não recebe esses registros automaticamente.

**Critério de saída:** registros estruturados continuam íntegros e sob controle do usuário; a sincronização futura com o cofre só ocorre por operações explícitas, rastreáveis e com resolução de conflitos.

## Fase 6 — Integrações e automações
- [ ] Construir o registro de integrações e o armazenamento de credenciais com permissões delimitadas.
- [ ] Adicionar Telegram e integrações Google selecionadas.
- [ ] Adicionar tarefas agendadas com novas tentativas e idempotência.
- [ ] Adicionar histórico de execução, aprovações e mecanismo de interrupção.

**Critério de saída:** cada integração apresenta estado real, permissões, falhas e possibilidade de revogação.

## Fase 7 — Voz, PWA e aplicativo complementar para desktop
- [ ] Adicionar entrada por voz com indicação clara de gravação e consentimento do usuário.
- [ ] Adicionar instalação PWA e funcionamento offline quando apropriado.
- [ ] Avaliar um aplicativo complementar para Windows somente após estabilizar os limites da API e das permissões.

## Critérios obrigatórios para publicação

Nenhuma publicação em produção sem: testes automatizados e verificações de segurança das dependências; varredura de segredos; procedimento de cópia de segurança e restauração do banco; revisão de autenticação e autorização; limites de requisição e proteções contra abuso; política de privacidade e retenção; plano de reversão da implantação; disponibilidade, registros e alertas verificados.
