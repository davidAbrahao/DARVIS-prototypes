# ADR-0002 — Sessões persistentes e autenticação segura

- **Estado:** decisão adotada para a primeira implementação; requer revisão e validação em ambiente PostgreSQL.
- **Data:** 18/11/2026.
- **Contexto:** a API integrada precisa suportar revogação, rastreabilidade, rotação atômica e proteção contra reutilização de refresh tokens.

## Decisão

Adotar sessões persistentes controladas pelo servidor. JWT não será tratado como sessão revogável por si só. A implantação inicial é de proprietário único; não haverá cadastro público.

### Senhas e access tokens

- Senhas são protegidas por Argon2id (64 MiB, 3 iterações, paralelismo 2), com verificação de necessidade de rehash após login.
- O access token é JWT HS256 com emissor e audiência fixos, identificador da sessão, identificador único e validade curta (10 minutos por padrão; limite de configuração de 5 a 30 minutos).
- Cada rota protegida valida assinatura, emissor, audiência, tipo, usuário ativo e sessão não revogada no PostgreSQL.

### Refresh tokens e sessões

Cada sessão tem identificador próprio e família. O valor de refresh é aleatório e de alta entropia. Somente o hash SHA-256 é persistido; o histórico registra emissão, expiração, consumo e hash do sucessor.

1. Receber o refresh token pelo cookie HttpOnly.
2. Validar CSRF e, quando presente, a origem da requisição.
3. Calcular o hash e localizar o registro com bloqueio transacional.
4. Validar expiração, sessão e usuário.
5. Marcar o token anterior como consumido, criar o sucessor e atualizar o estado da sessão na mesma transação.
6. Se um token consumido for reapresentado, revogar todas as sessões da família e persistir um evento de segurança.
7. Retornar o novo access token somente depois do commit da transação.

O bloqueio de linha impede que duas transações consumam o mesmo token ao mesmo tempo. Uma segunda apresentação, mesmo que concorrente, é tratada conservadoramente como reutilização; o cliente deverá evitar renovações paralelas.

### Transporte e CSRF

- Access token retorna no corpo da resposta e deve permanecer apenas em memória no cliente.
- Refresh token é cookie HttpOnly, SameSite=Lax e Secure em staging/produção.
- Um cookie CSRF não HttpOnly é comparado com o cabeçalho `X-CSRF-Token`; a origem, quando enviada, precisa constar em `CORS_ORIGINS`.
- O endpoint `GET /api/v1/auth/csrf` cria ou devolve o cookie CSRF, valida a origem quando presente e retorna o token com `Cache-Control: no-store`. O cliente chama esse endpoint no início da aplicação, antes de tentar renovar uma sessão após um recarregamento.
- O cookie CSRF e o cookie de refresh são limitados ao caminho de autenticação. O token CSRF pode ser recebido pelo cliente por uma resposta JSON da origem explicitamente permitida; o refresh permanece inacessível ao JavaScript.
- A topologia final deve manter frontend e API no mesmo site registrável ou reavaliar explicitamente SameSite e CORS.
- HTTPS é obrigatório nos ambientes implantados.

### Configuração inicial e limites

- `INITIAL_SETUP_TOKEN` deve conter no mínimo 32 bytes e é comparado em tempo constante.
- Um advisory lock transacional do PostgreSQL garante que apenas uma primeira configuração possa criar o proprietário.
- Rate limits persistentes usam UPSERT atômico do PostgreSQL, com buckets identificados por HMAC-SHA-256. IP e e-mail em claro não são gravados na tabela de limites.
- Não confiar em cabeçalhos de proxy sem uma lista explícita de proxies confiáveis.

### Auditoria e revogação

- Login, configuração inicial, renovação, reutilização detectada e logout geram eventos persistentes.
- Logout individual revoga somente a sessão atual.
- Logout global revoga todas as sessões ativas do proprietário.
- Contas inativas não podem autenticar nem renovar sessões.

## Alternativas rejeitadas

- **JWT de renovação stateless:** não permite revogação individual nem detecção confiável de reutilização.
- **Persistir tokens em texto puro:** amplia o impacto de vazamento do banco.
- **Armazenar tokens no localStorage:** aumenta o impacto de XSS e não é necessário para este fluxo.
- **Cadastro público:** não é requisito da instalação inicial de proprietário único.
- **Rate limiter em memória:** não coordena várias réplicas nem sobrevive a reinicializações.

## Consequências e limitações conhecidas

A solução depende de PostgreSQL, migrações controladas e transações. A tabela de histórico de refresh tokens precisa de política futura de limpeza de registros expirados, sem apagar evidências de reutilização dentro da janela de segurança. A troca de senha e a recuperação de conta ainda não estão implementadas; quando forem adicionadas, deverão revogar todas as sessões.

## Critérios mínimos de aceite

- Refresh válido é rotacionado e o valor antigo deixa de ser aceito.
- Reutilização detectada revoga a família.
- Logout individual e global produzem as revogações esperadas.
- Limites persistem entre instâncias e reinicializações.
- Tokens em texto puro não são persistidos nem registrados.
- Testes de integração cobrem transações, expiração, revogação, reutilização e concorrência.
