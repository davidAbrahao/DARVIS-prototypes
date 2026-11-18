# Aplicação web do D.A.R.V.I.S.

## Requisitos

- Node.js 20.9 ou superior.
- npm.
- API D.A.R.V.I.S. configurada com a origem web liberada em `CORS_ORIGINS`.

## Configuração local

Execute os comandos a partir deste diretório:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Confirme que `NEXT_PUBLIC_DARVIS_API_URL` aponta para a API, por padrão `http://localhost:8000/api/v1`. Essa variável contém somente o endereço público da API; nunca coloque tokens, chaves ou senhas em variáveis `NEXT_PUBLIC_*`.

Em uma segunda janela, inicie a API conforme o [guia da API](../api/README.md). Para desenvolvimento local, inclua `http://localhost:3000` em `CORS_ORIGINS` no ambiente da API. Acesse `http://localhost:3000`.

## Sessões e autenticação

- A tela `/login` usa o endpoint real `POST /auth/login`.
- No início da aplicação, o cliente consulta `GET /auth/csrf` e tenta restaurar a sessão por `POST /auth/refresh`.
- O refresh token permanece em cookie HttpOnly. O cliente não lê nem armazena esse valor.
- O access token existe somente em memória no provedor React; ele não é salvo em `localStorage`, `sessionStorage` ou IndexedDB.
- As chamadas que enviam cookies usam `credentials: "include"`; a API deve permitir explicitamente a origem da aplicação.
- O cliente compartilha uma única tentativa de restauração por vez e uma única renovação durante chamadas autenticadas. Quando disponível, a Web Locks API coordena login, renovações e logout entre abas; a trava relê o CSRF após ser adquirida. Chamadas concorrentes aguardam a mesma renovação e repetem a operação com o access token novo. Sem Web Locks, uma fila local serializa essas operações dentro da instância atual, mas não coordena login/refresh entre abas distintas.
- O botão de saída coordena com a renovação, relê o CSRF atual e só limpa o estado local depois que a API confirma o logout. Um evento `BroadcastChannel` sem tokens ou dados pessoais comunica o encerramento às outras abas do mesmo site.
- O encerramento global passa pelo cliente autenticado, podendo renovar um access token expirado antes de revogar todas as sessões.
- A configuração inicial do proprietário não é executada pelo navegador. `INITIAL_SETUP_TOKEN` é segredo de servidor e nunca deve ser exposto em uma variável `NEXT_PUBLIC_*`.

## Assistente de IA

A área de conversas utiliza os endpoints autenticados `/assistant/status`, `/assistant/conversations` e `/assistant/conversations/{id}/messages`. É possível criar, selecionar, renomear e excluir conversas; a exclusão exige confirmação na interface. Conversas e mensagens são carregadas do PostgreSQL, não do armazenamento local do navegador.

O provedor é configurado somente no ambiente da API, conforme o [guia da API](../api/README.md). Por padrão, `AI_PROVIDER=disabled` e o campo de envio permanece desativado. Nunca crie uma variável `NEXT_PUBLIC_GEMINI_API_KEY` ou envie a chave do provedor para o navegador.

Cada envio mantém um UUID durante as tentativas da mesma mensagem; o servidor usa esse identificador para responder com o turno já persistido caso a mesma requisição seja repetida. A interface impede troca de conversa enquanto um envio, renomeação ou exclusão está em andamento. A interface não tenta executar ferramentas e não simula respostas quando o provedor não está configurado.

## Verificações de qualidade

```powershell
npm run lint
npm run typecheck
npm run build
```

As verificações acima estão preparadas, mas não foram executadas nesta etapa. O workflow manual `.github/workflows/darvis-web-ci.yml` executará ESLint, TypeScript e build Next.js quando estiver disponível na branch padrão e for acionado na fase de validação.

## Estado da interface

A tela de login, a proteção de rota, a restauração, a renovação controlada e o encerramento da sessão estão conectados aos contratos de autenticação da API. A Central de Comando consulta indicadores, tarefas e projetos reais; permite criar tarefas com projeto, prioridade e prazo, alterar a situação das tarefas, concluir tarefas, criar projetos e alterar a situação dos projetos. O espaço do assistente consulta o estado real do provedor, lista/cria conversas e carrega mensagens persistidas. O envio fica habilitado somente quando a API informa provedor configurado e utiliza UUID idempotente para evitar duplicação em novas tentativas. Sem credencial, a interface explica por que o envio está desabilitado. A aplicação não envia chaves de provedor ao navegador e não oferece execução de ferramentas nesta versão. Memória externa, agenda e integrações continuam planejadas.
