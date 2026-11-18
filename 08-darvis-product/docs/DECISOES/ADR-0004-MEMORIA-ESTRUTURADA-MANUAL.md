# ADR-0004 — Memória estruturada manual

- **Estado:** adotada para a primeira implementação; sincronização com Obsidian e contexto de IA permanecem pendentes.
- **Data:** 18/11/2026.
- **Contexto:** o D.A.R.V.I.S. precisa manter informações importantes de forma consultável, mas sem capturar dados silenciosamente ou confundir memória operacional com documentos do cofre.

## Decisão

### Fonte oficial e propriedade

- Memórias estruturadas são registros do PostgreSQL, vinculados ao usuário autenticado.
- Cada registro possui título, conteúdo, categoria, etiquetas, origem, fixação, arquivamento e timestamps.
- A origem permitida nesta versão é exclusivamente `manual`, validada no serviço e por constraint SQL.
- Todas as consultas e mutações filtram pelo proprietário autenticado.
- Criação, atualização e exclusão geram eventos persistentes de auditoria.

### Ciclo de vida e organização

- Categorias iniciais: `fact`, `preference`, `goal`, `work`, `relationship`, `routine` e `other`.
- Cada item aceita até 12 etiquetas de até 32 caracteres.
- O título tem limite de 140 caracteres; o conteúdo, 12.000 caracteres.
- Registros podem ser fixados, arquivados, restaurados e excluídos.
- Pesquisa parcial ocorre no servidor por título/conteúdo, com filtros e paginação.

### Separação do Obsidian

A memória estruturada PostgreSQL não é o cofre Markdown. O PostgreSQL atende consultas e integridade do domínio; Obsidian/Markdown permanece reservado para documentos e notas extensas, por meio de um adaptador futuro.

Nenhuma sincronização é realizada nesta etapa. Importação, exportação, tratamento de conflitos e propagação de exclusões serão implementados somente após definição de proveniência, versionamento, conflitos e recuperação.

### Privacidade e contexto da IA

- A memória não é extraída automaticamente de conversas nem preenchida por agentes.
- O assistente não recebe registros de memória, tarefas, projetos ou notas automaticamente.
- Uma etapa futura poderá oferecer seleção explícita de registros como contexto, mostrando o conteúdo e o provedor que receberá os dados antes do envio.
- Exclusão de memória estruturada não implica apagar conteúdo semelhante em conversas ou documentos externos; uma política abrangente de exclusão será definida com os fluxos de exportação/retention.

## Alternativas rejeitadas

- **Captura automática pelo assistente:** não há consentimento granular, mecanismo de revisão ou proveniência nesta primeira entrega.
- **Usar Obsidian como banco transacional:** dificulta consultas, consistência e autorização por recurso.
- **Anexar toda a memória ao prompt:** amplia o compartilhamento de dados e reduz o controle do usuário.
- **Sincronizar antes de definir conflitos:** pode sobrescrever alterações do usuário silenciosamente.

## Consequências e próximos passos

A primeira memória é simples, manual e isolada. A exportação, exclusão abrangente, sincronização Obsidian e seleção de contexto para IA ainda precisam de projeto e revisão de privacidade. A Central de Memória exibe somente dados vindos da API e não representa estado de sincronização externo.

## Critérios mínimos de aceite

- O usuário só consulta e altera seus próprios registros.
- O banco recusa origem diferente de `manual` e categoria não permitida.
- Pesquisa, filtros, arquivamento e fixação operam sobre estado persistido.
- Eventos de auditoria não duplicam o conteúdo dos registros.
- Memórias não são anexadas ao contexto do provedor sem seleção explícita.
