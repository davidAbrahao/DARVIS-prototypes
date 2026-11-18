# Arquitetura-alvo

**Situação:** proposta inicial para o novo espaço do produto. Cada detalhe de implementação deverá ser validado com o código e o ambiente de implantação.

## Visão geral do sistema

O navegador executa a aplicação Next.js PWA e se comunica por HTTPS com a API FastAPI. A API aplica autenticação e autorização, aciona os serviços de domínio, persiste o estado operacional no PostgreSQL, grava eventos permanentes de auditoria e delega operações de conhecimento, IA e serviços externos a adaptadores isolados.

## Aplicações

### Aplicação web
- Next.js App Router, React e TypeScript.
- Tokens de design e componentes reutilizáveis derivados do Stitch.
- Limites entre servidor e navegador claramente definidos.
- Nenhum segredo de provedor ou credencial privilegiada no código enviado ao navegador.
- Acesso autenticado à API por meio de um cliente tipado único.

### API
- FastAPI com rotas versionadas.
- Esquemas de requisição e resposta com Pydantic.
- Modelos e repositórios SQLAlchemy.
- Migrações de banco com Alembic.
- Serviços de domínio separados dos controladores HTTP.
- Serviços centrais de autorização e auditoria.

## Responsabilidade pelos dados

| Dados | Fonte oficial |
|---|---|
| Usuários, sessões, tarefas, projetos e objetivos | PostgreSQL |
| Memórias estruturadas e metadados de conversas | PostgreSQL |
| Notas extensas e documentos de conhecimento | Cofre Markdown |
| Credenciais de integrações | Gerenciador de segredos / segredos da implantação |
| Histórico de aprovações e execuções | Registros de auditoria no PostgreSQL |

O PostgreSQL é a fonte oficial do estado operacional. O cofre é uma camada de documentos e conhecimento, não um substituto para registros transacionais.

## Limites de atuação da IA

O modelo é um componente de raciocínio não confiável. Ele pode propor chamadas estruturadas de ferramentas, mas não pode executar diretamente comandos arbitrários, SQL, operações no sistema de arquivos ou requisições de rede.

Fluxo obrigatório: montar o contexto mínimo autorizado; enviar somente o contexto permitido pelas configurações do usuário e pelas políticas do provedor; interpretar a resposta usando um esquema estrito; rejeitar ferramentas desconhecidas e campos inesperados; registrar uma proposta pendente quando a aprovação for necessária; verificar novamente a autorização e o estado da proposta no momento da aprovação; executar por meio de uma ferramenta permitida no servidor; persistir o resultado e o evento de auditoria.

Os adaptadores de provedores devem expor uma interface comum e permitir controles específicos de privacidade e configuração. Nenhum provedor é considerado definitivo.

## Autenticação e autorização

- Senhas protegidas com Argon2id.
- Credenciais de acesso de curta duração.
- Sessões de renovação rotativas e revogáveis.
- Detecção de reutilização de tokens de renovação.
- Limites de requisições nos fluxos de autenticação e nos endpoints de maior custo.
- Autorização aplicada a cada recurso protegido.
- Preferência por cookies Secure, HttpOnly e SameSite quando a topologia de implantação permitir.
- Proteção contra CSRF quando forem utilizados cookies de sessão.

## Direção de implantação

Implantação candidata: hospedagem gerenciada compatível com Next.js para a aplicação web; contêiner FastAPI no Google Cloud Run; PostgreSQL gerenciado; Secret Manager para credenciais; Cloudflare para DNS, proteção de borda e funções de gateway quando justificadas.

A topologia não está fechada até que custos, limites de rede, estratégia de cookies e sessões, cópias de segurança e requisitos operacionais sejam validados.

## Observabilidade

- Registros estruturados da aplicação com identificadores de correlação.
- Endpoints de disponibilidade do processo e prontidão com significados distintos.
- Métricas derivadas de operações reais.
- Nenhum conteúdo de mensagens pessoais ou segredo nos registros rotineiros.
- Registros de auditoria separados dos registros de diagnóstico.
