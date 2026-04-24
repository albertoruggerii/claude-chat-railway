# Claude Chat — Railway

Interfaccia chat minimale collegata all'API di Claude, deployata su Railway.

## Struttura

```
claude-chat-railway/
├── server.js           # Backend Express (proxy verso Anthropic)
├── package.json
├── .gitignore
└── public/
    └── index.html      # Frontend
```

## Sviluppo in locale

1. Installa dipendenze:
   ```bash
   npm install
   ```

2. Crea un file `.env` nella root (NON committarlo):
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxx
   ```

3. Avvia:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-xxxxx npm start
   ```

4. Apri http://localhost:3000

## Deploy su Railway

### Opzione A — da GitHub (consigliata)

1. Crea una repo GitHub e pusha questi file
2. Su [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Seleziona la repo
4. Vai su **Variables** e aggiungi:
   - `ANTHROPIC_API_KEY` = la tua API key (da console.anthropic.com)
   - (opzionale) `CLAUDE_MODEL` = `claude-opus-4-7` se vuoi il modello più potente
5. Railway builda e deploya da solo. In **Settings → Networking** clicca "Generate Domain"

### Opzione B — da CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway variables set ANTHROPIC_API_KEY=sk-ant-xxxxx
railway domain
```

## Variabili d'ambiente

| Variabile | Obbligatoria | Default |
|-----------|--------------|---------|
| `ANTHROPIC_API_KEY` | Sì | — |
| `CLAUDE_MODEL` | No | `claude-sonnet-4-5` |
| `PORT` | No (Railway la setta) | `3000` |

## Endpoint

- `GET /` → frontend
- `POST /api/chat` → body `{ "message": "..." }` → risponde `{ "reply": "..." }`
- `GET /health` → health check
