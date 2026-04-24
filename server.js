import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5';

const SYSTEM_PROMPT = `Sei un assistente veloce. Rispondi sempre nel modo più breve possibile.

Se l'utente ti manda un'immagine di un quiz o domanda a scelta multipla: rispondi SOLO con la lettera della risposta corretta seguita dal testo della risposta, nient'altro. Esempio: 'C. Strategic planning'. Niente spiegazioni, niente traduzioni, niente analisi dell'interfaccia, niente markdown, niente introduzioni. Solo la risposta in una riga.

Se l'utente ti manda un'immagine senza contesto chiaro: descrivi in massimo 2 frasi cosa vedi.

Per domande testuali: rispondi in modo conciso e diretto, senza preamboli tipo 'Certo!' o 'Ecco la risposta:'. Vai dritto al punto.`;

// Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.static(join(__dirname, 'public')));

// Endpoint che il frontend chiama → inoltra la richiesta ad Anthropic
// La API key sta solo qui sul server, mai nel browser
app.post('/api/chat', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY non configurata nelle variabili d\'ambiente di Railway'
    });
  }

  const { message, image } = req.body;

  const hasText = typeof message === 'string' && message.trim().length > 0;
  const hasImage = image && typeof image.data === 'string' && typeof image.mediaType === 'string';

  if (!hasText && !hasImage) {
    return res.status(400).json({ error: 'Serve almeno un messaggio o un\'immagine' });
  }

  let content;
  if (hasImage) {
    const textBlock = hasText ? message : 'Cosa vedi in questa immagine?';
    content = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.mediaType,
          data: image.data
        }
      },
      { type: 'text', text: textBlock }
    ];
  } else {
    content = message;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || `Errore API (HTTP ${response.status})`
      });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || '(risposta vuota)';

    res.json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Errore del server: ' + error.message });
  }
});

// Health check (utile per Railway)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', model: MODEL });
});

app.listen(PORT, () => {
  console.log(`🚀 Server attivo su porta ${PORT}`);
  console.log(`📡 Modello: ${MODEL}`);
  console.log(`🔑 API Key: ${API_KEY ? '✓ configurata' : '✗ MANCANTE'}`);
});
