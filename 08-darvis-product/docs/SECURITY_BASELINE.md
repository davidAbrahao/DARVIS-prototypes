# Requisitos mínimos de segurança

Este documento define os requisitos mínimos. Não significa que todos esses controles já estejam implementados ou validados em execução.

## Segredos e credenciais
- Incluir no controle de versão somente valores fictícios; nunca incluir chaves reais de API, senhas, chaves de assinatura ou certificados.
- Carregar segredos por variáveis de ambiente ou por um gerenciador de segredos.
- Impedir a inicialização em produção quando segredos obrigatórios estiverem ausentes ou contiverem valores conhecidos de exemplo.
- Nunca expor credenciais de provedores ao navegador.
- Renovar qualquer credencial que possa ter sido incluída no controle de versão.

## Autenticação
- Senhas protegidas com Argon2id e parâmetros definidos no ADR-0002.
- Access JWT curto, validado com algoritmo, emissor e audiência fixos; verificar usuário ativo e sessão não revogada em toda rota protegida.
- Refresh token aleatório, persistido somente como hash e rotacionado transacionalmente.
- Reutilização de token consumido revoga a família afetada.
- Cookie refresh HttpOnly, SameSite=Lax e Secure em staging/produção; CSRF por double-submit cookie/cabeçalho.
- Configuração inicial one-time, protegida por token secreto e lock transacional; sem cadastro público.
- Limites persistentes e compartilhados para tentativas de setup, login e refresh.
- Bloqueio temporário de conta após 8 falhas consecutivas de autenticação, com prazo de 15 minutos e resposta genérica.
- Validar `Origin` nos endpoints de mutação e bootstrap acessíveis ao navegador quando o cabeçalho estiver presente.
- Respostas de autenticação não devem permitir descobrir se uma conta existe.

## Autorização
- Negar por padrão.
- Aplicar propriedade e permissões na camada de API e serviços, não apenas na navegação da interface.
- Verificar novamente a autorização quando uma ação proposta pela IA for aprovada.
- Limitar credenciais de integrações às permissões estritamente necessárias.

## IA, conversas e provedores
- Tratar toda saída do modelo como conteúdo não confiável.
- Manter credenciais dos provedores exclusivamente no servidor/gerenciador de segredos.
- Não expor chaves, configurações internas ou erros brutos do SDK ao navegador.
- Minimizar o contexto enviado: a implementação atual envia apenas o histórico explícito da conversa, com limites de quantidade e caracteres.
- Não anexar dados de tarefas, projetos, notas, arquivos ou dispositivo sem seleção e autorização explícitas.
- Aplicar rate limit persistente por usuário ao uso do provedor.
- Persistir conversas e mensagens com isolamento por proprietário.
- Utilizar UUID idempotente para envios e controle de concorrência por conversa.
- Definir política de retenção, exportação e exclusão antes da publicação.
- Nesta primeira versão, não habilitar execução de ferramentas nem function calling.

## IA e execução futura de ferramentas
- Utilizar esquemas estritos e listas explícitas de ferramentas permitidas.
- Rejeitar tipos de ação desconhecidos e campos inesperados.
- Limitar tamanho de parâmetros, textos, listas e tempo de execução.
- Nunca executar comandos arbitrários de shell, Python, SQL ou navegador recebidos do modelo.
- Exigir aprovação explícita para ações com consequências relevantes.
- Revalidar autenticação, autorização, estado e idempotência no servidor no momento da execução.
- Manter separados os registros de proposta, aprovação, execução e resultado.

## Dados e privacidade
- Minimizar o contexto enviado aos provedores.
- Tornar as categorias de contexto visíveis e configuráveis.
- Não enviar dados sensíveis por padrão.
- Documentar provedor, região, retenção, uso para treinamento e termos aplicáveis antes de habilitar um provedor.
- Oferecer caminhos para exportação e exclusão de dados.
- Memórias estruturadas são criadas manualmente nesta versão; impedir ingestão automática pelo modelo ou outras integrações sem consentimento e origem explícitos.
- Não anexar registros da Central de Memória ao contexto de IA por padrão; exigir seleção explícita e prévia do conteúdo que será compartilhado.
- Manter memória estruturada PostgreSQL separada de notas Markdown/Obsidian e registrar origem/proveniência dos dados.
- Evitar registrar prompts, tokens, segredos ou conteúdo pessoal desnecessário.

## API e infraestrutura
- Exigir HTTPS nos ambientes implantados.
- Configurar origens CORS explicitamente; não permitir wildcard com credenciais.
- Adicionar limites de tamanho de requisição e de frequência.
- Validar todos os corpos de requisição e parâmetros de consulta.
- Utilizar cabeçalhos seguros e configuração confiável de proxy.
- Não confiar em cabeçalhos X-Forwarded-For sem proxies explicitamente confiáveis.
- Separar verificações de vida do processo e prontidão dos serviços.
- Executar migrações do banco como etapa controlada da implantação, não simultaneamente em cada réplica.
- Manter cópias de segurança criptografadas e testar a restauração.
- Fixar e revisar dependências; executar verificações automatizadas de vulnerabilidades.

## Rastreabilidade e auditoria

Persistir eventos relevantes de segurança com responsável, ação, recurso, data e hora, identificador de correlação, decisão e resultado. Não registrar tokens, senhas, cookies ou credenciais. Os registros de auditoria não podem ser alterados pelos endpoints comuns da aplicação.

## Regra para publicação

O código de autenticação desta etapa ainda precisa de testes executados no PostgreSQL, revisão de concorrência e revisão independente. Nenhuma publicação em produção até resolver vulnerabilidades críticas/altas e confirmar todos os critérios do roteiro.
