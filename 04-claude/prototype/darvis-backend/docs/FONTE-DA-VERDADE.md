# Fonte da verdade: Obsidian × PostgreSQL

Decisão de arquitetura para o D.A.R.V.I.S. Regra geral: **cada dado tem uma única fonte da verdade,
e o outro lado guarda apenas uma cópia derivada que pode ser recriada.**

## Divisão por tipo de dado
| Tipo de dado | Fonte da verdade | O outro lado guarda | Fase |
|---|---|---|---|
| Notas, ideias, decisões, referências (texto longo) | **Vault Obsidian** (Markdown no GitHub privado) | PostgreSQL: índice (título, tags, categoria, `vault_path`, `content_hash`) para busca e relações | 6 (até lá, PostgreSQL) |
| Tarefas, projetos e marcos | **PostgreSQL** | Obsidian: no máximo uma exportação somente leitura | 3 |
| Compromissos, compras, finanças pessoais | **PostgreSQL** (dados sensíveis nunca vão para o Vault) | nada | 5+ |
| Histórico de conversas e logs de ações dos agentes | **PostgreSQL** | nada | 4 |
| Usuário, sessões, auditoria | **PostgreSQL** | nada | 2 |
| Resumos e memória de longo prazo gerados pela IA | **PostgreSQL**, com link para a nota de origem | Obsidian recebe só o que você aprovar | 4 a 5 |
| Segredos e chaves | variáveis de ambiente / Secret Manager | nunca em banco ou Vault | 2 |

## Regras
1. **Um escritor por campo.** Nunca há edição bidirecional do mesmo campo, então não existe conflito para resolver.
2. **O Vault vence no conteúdo das notas.** Se o arquivo mudou (hash diferente), o PostgreSQL reindexa a partir dele.
3. **O índice é descartável.** Apagar a tabela de notas e reindexar o Vault tem que recriar tudo, e esse é o teste de sanidade da Fase 6.
4. **A IA não é memória.** O modelo lê e propõe; quem grava é a API, com registro em `audit_logs` (brief, seção 5).
5. **Dado financeiro e pessoal sensível fica só no PostgreSQL**, porque o repositório do Vault é sincronizado em vários dispositivos.

## O que já está preparado no código
- `notes.vault_path` e `notes.content_hash` (SHA-256 de título + texto), atualizado a cada alteração.
- `notes.source` (`manual`, e depois `telegram`, `obsidian`) para saber de onde a nota veio.
- `GET /system/status` declara que as notas ainda vivem no PostgreSQL: o status é honesto, como pede a seção 12 do brief.

## Plano da Fase 6 (sincronização)
1. Uma GitHub Action avisa a API quando o Vault recebe um commit.
2. A API lê os arquivos alterados, compara `content_hash` e reindexa o que mudou.
3. Notas criadas pela API (por exemplo, via Telegram) são commitadas no Vault pela API do GitHub, e só então indexadas.
4. Primeira carga: importar as notas já existentes no PostgreSQL para o Vault, uma vez.

## Decisões em aberto
- **Formato do frontmatter** das notas (título, categoria, tags, id estável). Sugestão: YAML com `id`, `category`, `tags`, `pinned`.
- **Exportação de tarefas para o Obsidian**: se faz diferença ver as tarefas dentro do Vault ou se o painel web basta.
- **Notas criadas fora do Obsidian** (Telegram) vão direto para o Vault ou passam por uma caixa de entrada para você revisar?
