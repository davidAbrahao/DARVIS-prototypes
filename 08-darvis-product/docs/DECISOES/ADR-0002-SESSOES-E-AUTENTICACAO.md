# ADR-0002 — Sessões persistentes e autenticação segura

- **Estado:** aceita como direção de implementação; detalhes operacionais sujeitos à revisão de segurança.
- **Data:** 18/11/2026.
- **Contexto:** o backend Claude usa JWT de acesso e renovação, mas o token de renovação não é persistido nem rotacionado. A API integrada precisa suportar revogação, rastreabilidade e proteção contra reutilização.

## Decisão

Adotar sessões persistentes controladas pelo servidor. JWT não será tratado como sessão revogável por si só.

Cada sessão terá identificador próprio, usuário proprietário, hash do token de renovação atual, família de renovação, datas de criação/expiração/última utilização, revogação e metadados mínimos de segurança.

### Fluxo de renovação

1. Receber token de renovação por canal definido na política de sessão.
2. Calcular seu hash e localizar a sessão correspondente.
3. Validar validade, usuário ativo, estado da sessão e família.
4. Consumir o token anterior e gerar um novo token aleatório de alta entropia.
5. Persistir somente o hash do novo token e atualizar a sessão em uma transação.
6. Se um token já consumido for apresentado novamente, tratar como possível reutilização e revogar a família afetada.
7. Emitir novo token de acesso após confirmação da transação.

A rotação deve ser atômica e protegida contra duas renovações concorrentes. A resposta não deve revelar se uma sessão ou usuário específico existe.

### Revogação

- Logout da sessão atual revoga somente a sessão atual.
- Logout global revoga todas as sessões do usuário.
- Troca de senha revoga todas as sessões existentes.
- Desativação de conta bloqueia autenticação e renovações.
- Eventos relevantes são registrados na auditoria.

### Transporte e proteção contra CSRF

A decisão final entre cookie HttpOnly e token de renovação em corpo de resposta depende da topologia web/API e dos domínios de implantação.

A preferência é cookie Secure, HttpOnly e SameSite apropriado, com proteção CSRF explícita quando cookies forem usados. Se a aplicação adotar bearer tokens sem cookies, o armazenamento no navegador deverá ser avaliado contra XSS; não assumir que localStorage é seguro.

### Senha e acesso

- Argon2id para hash de senha, com parâmetros revisados e atualização de hash quando necessário.
- Token de acesso de curta duração.
- Verificação de usuário ativo e autorização em cada requisição protegida.
- Limitação de tentativas por IP e conta, com armazenamento compartilhado e atualização atômica.
- Não confiar em cabeçalhos de proxy sem lista explícita de proxies confiáveis.

## Alternativas rejeitadas

- **JWT de renovação stateless sem armazenamento:** não permite rotação/revogação individual nem detecção confiável de reutilização.
- **Somente token_version no usuário:** útil para logout global, mas invalida todas as sessões e não representa sessão individual.
- **Persistir token em texto puro:** amplia o impacto de vazamento do banco.
- **Migrar imediatamente para OAuth externo:** adiciona dependência e complexidade antes de haver requisito de múltiplos usuários/provedores de identidade.

## Consequências

A solução requer tabela de sessões, migração, serviço transacional, testes de concorrência e políticas operacionais de expiração e revogação. O custo adicional é justificado pela capacidade de controle e auditoria.

## Critérios mínimos de aceite

- Token de renovação válido é rotacionado.
- Token antigo não pode ser reutilizado com sucesso.
- Reutilização detectada revoga a família de sessão.
- Logout individual não afeta outras sessões.
- Logout global e troca de senha revogam todas as sessões.
- Duas renovações concorrentes não criam duas sessões válidas a partir do mesmo token.
- Nenhum token em texto puro é armazenado em banco ou log.
- Testes cobrem expiração, revogação, reutilização e concorrência.
