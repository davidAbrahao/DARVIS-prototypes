# Registro de decisões de arquitetura

## ADR-001 — Preservar os protótipos e criar um espaço exclusivo para o produto
- **Situação:** aceita.
- **Decisão:** manter os seis protótipos inalterados e construir o produto integrado em `08-darvis-product/`.
- **Motivo:** preservar a origem dos projetos, evitar consolidação destrutiva e permitir revisão independente da implementação do produto.

## ADR-002 — Utilizar o backend FastAPI do Claude como principal referência de implementação
- **Situação:** aceita como ponto de partida; reutilização de código depende de revisão.
- **Decisão:** utilizar sua estrutura de domínio e API como primeira referência, sem considerá-la pronta para produção.
- **Motivo:** entre os protótipos auditados, apresenta a base de backend mais madura.
- **Consequência:** autenticação, rotação de tokens, limites de requisição, cobertura de auditoria, migrações e comportamento de implantação precisam ser reforçados.

## ADR-003 — Adotar o Cognitive Cockpit do Stitch como referência visual oficial
- **Situação:** aceita.
- **Decisão:** reconstruir sua linguagem visual e os layouts selecionados em um sistema de componentes sustentável.
- **Motivo:** representa melhor a identidade desejada para o produto.
- **Consequência:** os estados visuais devem estar conectados a dados e operações reais; comportamentos demonstrativos não devem ser transportados para a versão funcional.

## ADR-004 — PostgreSQL como fonte oficial dos dados operacionais
- **Situação:** aceita.
- **Decisão:** armazenar no PostgreSQL entidades operacionais, identidade, sessões, metadados de conversas, memórias estruturadas e eventos de auditoria.
- **Motivo:** integridade transacional, capacidade de consulta, autorização e fluxos confiáveis.
- **Consequência:** o armazenamento do navegador fica limitado a preferências e cache não oficiais.

## ADR-005 — Obsidian como camada de conhecimento e documentos, não como banco transacional
- **Situação:** aceita.
- **Decisão:** utilizar Markdown e Obsidian para notas extensas e conhecimento, integrados por meio de um adaptador.
- **Motivo:** conteúdo legível por pessoas, portátil e sob controle do usuário.
- **Consequência:** a sincronização exige detecção de conflitos, rastreabilidade de origem e regras explícitas para exclusões.

## ADR-006 — Provedores de IA como adaptadores substituíveis
- **Situação:** aceita.
- **Decisão:** isolar SDKs específicos de cada provedor atrás de uma interface no servidor.
- **Motivo:** privacidade, custo, disponibilidade e capacidades dos modelos podem mudar.
- **Consequência:** tipos específicos de um provedor não devem vazar para serviços de domínio ou contratos do navegador.

## ADR-007 — A IA não executa ferramentas diretamente
- **Situação:** aceita.
- **Decisão:** a IA pode propor ações tipadas; a API valida, autoriza, solicita aprovação e executa.
- **Motivo:** segurança, previsibilidade e rastreabilidade.
- **Consequência:** registro de ferramentas, aprovações, idempotência e eventos de auditoria são capacidades centrais do backend.


## ADR-008 — Conversas persistentes e provedores de IA
- **Situação:** aceita para a primeira entrega textual; validação de produção pendente.
- **Decisão:** persistir conversas e mensagens no PostgreSQL, usar adaptadores de provedor independentes, manter Gemini desativado por padrão e não habilitar execução de ferramentas nesta etapa.
- **Motivo:** retomar conversas com isolamento, limitar o contexto, evitar chamadas duplicadas e manter credenciais fora do navegador.
- **Consequência:** cada envio usa UUID idempotente; a API aplica limite de uso e controle de concorrência. Ferramentas exigirão um fluxo separado de autorização, aprovação e auditoria.
- **Detalhes:** [ADR-0003 — Conversas e provedores de IA](DECISOES/ADR-0003-CONVERSAS-E-PROVEDORES-IA.md).


## ADR-009 — Memória estruturada manual
- **Situação:** aceita para a primeira implementação; Obsidian e contexto de IA pendentes.
- **Decisão:** armazenar registros manuais no PostgreSQL, isolados por proprietário, com categorias, etiquetas, fixação, arquivamento, busca e auditoria.
- **Motivo:** criar uma memória consultável sem captura automática e sem confundir registros transacionais com documentos Markdown.
- **Consequência:** o assistente não recebe memórias automaticamente; sincronização Obsidian e seleção explícita de contexto serão fases posteriores.
- **Detalhes:** [ADR-0004 — Memória estruturada manual](DECISOES/ADR-0004-MEMORIA-ESTRUTURADA-MANUAL.md).
