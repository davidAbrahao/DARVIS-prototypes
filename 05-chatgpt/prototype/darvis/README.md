# D.A.R.V.I.S. — Personal Intelligence System

**David Abrahão Rodrigues Virtual Intelligence System**

Primeiro protótipo navegável do ecossistema D.A.R.V.I.S. O objetivo desta entrega é validar a experiência, os módulos e a direção visual antes de conectar serviços reais.

## Estado desta entrega

| Área | Estado | Observação |
|---|---|---|
| Command Center | Implementado (protótipo) | Painel e indicadores de demonstração |
| AI Assistant | Simulado | Chat local; ainda sem Gemini |
| Memory Center | Parcial / temporário | Criar e listar registros em estado React; sem persistência |
| Projetos | Parcial / temporário | Criar e listar projetos durante a sessão |
| Tarefas | Parcial / temporário | Criar e concluir tarefas durante a sessão |
| Base de conhecimento | Demonstrativa | Conteúdo de exemplo; sem indexação de arquivos |
| Automações | Simuladas | Alternâncias visuais; não executam rotinas |
| Integrações | Planejadas | Nenhuma conta ou serviço conectado |
| Configurações | Demonstrativas | Sem autenticação ou gestão real de credenciais |
| API FastAPI | Esqueleto implementado | Health check e status; sem domínio persistente |
| PostgreSQL / Supabase | Planejado | Ainda não configurado |
| Obsidian / Telegram / Gemini | Planejados | Sem chamadas externas |

> **Importante:** o protótipo não grava os dados em banco nem em `localStorage`. Atualizar ou fechar a página reinicia os dados da demonstração. Não insira senhas, tokens ou chaves de API.

## Estrutura

```text
darvis/
├── apps/
│   ├── web/                 # Next.js + TypeScript (interface)
│   │   └── src/app/
│   └── api/                 # FastAPI (esqueleto do backend)
│       └── app/main.py
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   └── STATUS.md
├── .gitignore
└── README.md
```

## Executar a interface

Requisitos: Node.js 20.9 ou superior e npm. No Windows, dê duplo clique em `INICIAR-DARVIS.bat`; ele instala as dependências na primeira execução e inicia a interface.

Ou execute manualmente:

```bash
cd apps/web
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Executar a API (opcional)

No Windows, dê duplo clique em `INICIAR-API.bat`. Ou execute manualmente em outro terminal, com Python 3.11+:

```bash
cd apps/api
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verifique `http://localhost:8000/health` e `http://localhost:8000/api/v1/status`.

## Próxima etapa recomendada

Consolidar o modelo de dados e a autenticação antes de conectar a IA. Depois, adicionar PostgreSQL/Supabase, camada de provedores (Gemini primeiro), armazenamento de memórias e ferramenta de recuperação contextual. Integrações devem ser ativadas individualmente e com permissões explícitas.
