# Groww SIP Continuity Studio

```bash
cd groww-sip-studio
npm install
npm run dev
```

Open http://localhost:3000. The app runs offline with a deterministic mock stream. Live Groq/OpenRouter calls use `GROQ_API_KEY` and `OPENROUTER_API_KEY` from `.env.local` only (never sent to the browser).
