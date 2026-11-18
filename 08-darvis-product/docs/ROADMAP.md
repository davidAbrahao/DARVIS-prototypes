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
- [x] Preparar fluxo de verificação manual para testes e análise estática (execução ainda pendente; sem disparo automático nesta fase).
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
- [x] Adicionar resumo agregado real para a Central de Comando.

**Critério de saída:** o proprietário autentica e consulta sua identidade; renova e revoga sessões com controles transacionais; projetos e tarefas são persistidos e isolados por proprietário. Testes executados no PostgreSQL e revisão de segurança permanecem pendentes.

## Fase 3 — Cognitive Cockpit
- [x] Preservar tokens visuais, tipografia, navegação e estrutura responsiva inicial do Stitch.
- [x] Implementar a Central de Comando com resumo, tarefas e projetos reais da API.
- [x] Adicionar estados de carregamento, vazio, erro e indisponibilidade para dados de domínio.
- [x] Permitir criação de tarefa/projeto, conclusão de tarefa e alteração de situação de projeto.
- [ ] Completar verificações de acessibilidade e responsividade em dispositivos reais.
- [ ] Integrar módulos de assistente, memória, agenda e demais áreas.

**Critério de saída:** interface utilizável em desktop e dispositivos móveis, exibindo apenas estados reais do backend. A primeira fatia de projetos e tarefas está escrita; a validação operacional e as verificações de acessibilidade continuam pendentes.

## Fase 4 — Assistente e arquitetura de provedores
- [ ] Definir contratos de requisição e resposta independentes de provedor.
- [ ] Integrar o primeiro provedor por meio de um adaptador no servidor.
- [ ] Adicionar seleção explícita e minimização do contexto enviado.
- [ ] Adicionar persistência de conversas e controles de retenção.
- [ ] Adicionar esquema estrito e lista de permissões para propostas de ferramentas.
- [ ] Adicionar aprovação no servidor e execução idempotente.

**Critério de saída:** assistente propõe uma ação de tarefa tipada e segura; a API exige aprovação e registra o resultado.

## Fase 5 — Memória e Obsidian
- [ ] Definir o esquema e o ciclo de vida das memórias estruturadas.
- [ ] Definir convenções de pastas e metadados das notas no cofre.
- [ ] Implementar operações explícitas de importação, exportação e sincronização.
- [ ] Adicionar tratamento de conflitos, indexação e propagação de exclusões.
- [ ] Apresentar ao usuário a origem dos dados e o estado real da sincronização.

**Critério de saída:** uma nota pode ser sincronizada com segurança, sem sobrescrever silenciosamente dados do usuário.

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
