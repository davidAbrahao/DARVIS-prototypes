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
- [ ] Adicionar integração contínua para análise estática, tipagem, testes e compilação.
- [ ] Documentar e validar a configuração de um PostgreSQL local.

**Critério de saída:** configuração inicial documentada; API e aplicação web iniciam em ambiente controlado; verificações da integração contínua são executadas com sucesso.

## Fase 2 — Identidade e domínio principal
- [ ] Implementar estratégia de cadastro inicial para uma instalação de proprietário único.
- [ ] Implementar login, logout, rotação de tokens de renovação e revogação de sessões.
- [ ] Adicionar endpoint de usuário autenticado.
- [ ] Adicionar operações de criação, consulta, atualização e exclusão de tarefas e projetos, com verificação de propriedade.
- [ ] Adicionar eventos persistentes de auditoria.
- [ ] Adicionar testes de integração da API.

**Critério de saída:** usuário autenticado consegue criar e consultar suas próprias tarefas e projetos; acessos não autorizados são rejeitados e testados.

## Fase 3 — Cognitive Cockpit
- [ ] Reconstruir tokens visuais, tipografia, navegação e estrutura responsiva compartilhada a partir do Stitch.
- [ ] Implementar a Central de Comando com dados reais da API.
- [ ] Adicionar estados de carregamento, vazio, erro, desconexão e sucesso.
- [ ] Adicionar verificações de acessibilidade e responsividade.

**Critério de saída:** interface utilizável em desktop e dispositivos móveis, exibindo apenas estados reais do backend.

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
