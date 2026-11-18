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
- O cliente compartilha uma única tentativa de restauração por vez e uma única renovação durante chamadas autenticadas. Quando disponível, a Web Locks API coordena renovações entre abas; a trava relê o CSRF após ser adquirida. Chamadas concorrentes aguardam a mesma renovação e repetem a operação com o access token novo. Sem Web Locks, a proteção fica limitada à instância/aba atual.
- O botão de saída revoga a sessão na API e só depois limpa o estado local.
- A configuração inicial do proprietário não é executada pelo navegador. `INITIAL_SETUP_TOKEN` é segredo de servidor e nunca deve ser exposto em uma variável `NEXT_PUBLIC_*`.

## Verificações de qualidade

```powershell
npm run lint
npm run typecheck
npm run build
```

As verificações acima estão preparadas, mas não foram executadas nesta etapa.

## Estado da interface

A tela de login, a proteção de rota, a restauração, a renovação controlada e o encerramento da sessão estão conectados aos contratos de autenticação da API. A Central de Comando consulta indicadores, tarefas e projetos reais; permite criar tarefas e projetos, concluir tarefas e alterar a situação dos projetos. Assistente, memória, agenda e integrações continuam identificados como planejados até que existam serviços e dados reais.
