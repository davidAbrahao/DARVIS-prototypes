# Requisitos mínimos de segurança

Este documento define os requisitos mínimos. Não significa que todos esses controles já estejam implementados.

## Segredos e credenciais
- Incluir no controle de versão somente valores fictícios; nunca incluir chaves reais de API, senhas, chaves de assinatura ou certificados.
- Carregar segredos por variáveis de ambiente ou por um gerenciador de segredos.
- Impedir a inicialização em produção quando segredos obrigatórios estiverem ausentes ou contiverem valores conhecidos de exemplo.
- Nunca expor credenciais de provedores ao navegador.
- Renovar qualquer credencial que possa ter sido incluída no controle de versão.

## Autenticação
- Proteger senhas com Argon2id e parâmetros revisados.
- Utilizar credenciais de acesso de curta duração.
- Renovar os tokens de sessão a cada operação bem-sucedida de renovação.
- Detectar reutilização de token e revogar a família de sessões afetada.
- Oferecer logout e revogação de sessão no servidor.
- Limitar tentativas de login, cadastro inicial, renovação e redefinição de senha.
- Evitar respostas de autenticação que facilitem descobrir se uma conta existe.

## Autorização
- Negar por padrão.
- Aplicar propriedade e permissões na camada de API e serviços, não apenas na navegação da interface.
- Verificar novamente a autorização quando uma ação proposta pela IA for aprovada.
- Limitar credenciais de integrações às permissões estritamente necessárias.

## IA e execução de ferramentas
- Tratar toda saída do modelo como entrada não confiável.
- Utilizar esquemas estritos e listas explícitas de ferramentas permitidas.
- Rejeitar tipos de ação desconhecidos e campos inesperados.
- Limitar tamanho de parâmetros, textos, listas e tempo de execução.
- Nunca executar comandos arbitrários de shell, Python, SQL ou navegador recebidos do modelo.
- Exigir aprovação explícita para ações com consequências relevantes.
- Utilizar chaves de idempotência e estado persistente de execução.
- Manter separados os registros de proposta, aprovação, execução e resultado.

## Dados e privacidade
- Minimizar o contexto enviado aos provedores.
- Tornar as categorias de contexto visíveis e configuráveis.
- Não enviar dados sensíveis por padrão.
- Documentar provedor, região, retenção, uso para treinamento e termos aplicáveis antes de habilitar um provedor.
- Oferecer caminhos para exportação e exclusão de dados.
- Evitar registrar prompts, tokens, segredos ou conteúdo pessoal desnecessário.

## API e infraestrutura
- Exigir HTTPS nos ambientes implantados.
- Configurar origens CORS explicitamente.
- Adicionar limites de tamanho de requisição e de frequência.
- Validar todos os corpos de requisição e parâmetros de consulta.
- Utilizar cabeçalhos seguros e configuração confiável de proxy.
- Separar verificações de vida do processo e prontidão dos serviços.
- Executar migrações do banco como etapa controlada da implantação, não simultaneamente em cada réplica da aplicação.
- Manter cópias de segurança criptografadas e testar a restauração.
- Fixar e revisar dependências; executar verificações automatizadas de vulnerabilidades.

## Rastreabilidade e auditoria

Persistir eventos relevantes de segurança com responsável, ação, recurso, data e hora, identificador de correlação, decisão e resultado. Os registros de auditoria não podem ser alterados pelos endpoints comuns da aplicação.

## Regra para publicação

Qualquer vulnerabilidade crítica ou alta ainda não resolvida impede a publicação em produção. Conveniências de desenvolvimento nunca devem enfraquecer silenciosamente as configurações de produção.
