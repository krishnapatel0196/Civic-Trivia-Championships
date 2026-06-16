# User Setup: Phase 31-01 Semantic Deduplication Infrastructure

## Required Service: OpenAI

**Why needed:** The OpenAIEmbeddingService calls the OpenAI Embeddings API to generate 1536-dimensional semantic vectors for question text. These embeddings enable similarity detection beyond simple text matching.

---

## Setup Steps

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform Dashboard](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Give it a name (e.g., "Civic Trivia Semantic Deduplication")
5. Copy the key (starts with `sk-proj-...`)
   - **Important:** Save this key now - you won't be able to see it again

### 2. Add to Backend Environment

Add the API key to `backend/.env`:

```bash
OPENAI_API_KEY=sk-proj-your-key-here
```

**Note:** If `backend/.env` doesn't exist, create it. The file is already gitignored.

### 3. Verify Configuration

Run this command to test the setup:

```bash
cd backend
node -e "
import('dotenv/config').then(() => {
  if (process.env.OPENAI_API_KEY) {
    console.log('✓ OPENAI_API_KEY is set');
    console.log('  Length:', process.env.OPENAI_API_KEY.length, 'characters');
    console.log('  Prefix:', process.env.OPENAI_API_KEY.substring(0, 8) + '...');
  } else {
    console.error('✗ OPENAI_API_KEY not found in environment');
    process.exit(1);
  }
});
"
```

**Expected output:**
```
✓ OPENAI_API_KEY is set
  Length: 56 characters
  Prefix: sk-proj-...
```

---

## Cost Information

**Model:** text-embedding-3-small
**Pricing:** $0.02 per 1 million tokens (~750,000 words)

**Estimated costs for Civic Trivia:**
- 320 existing questions ≈ 50,000 tokens ≈ $0.001
- Future scale (10,000 questions) ≈ 1.5M tokens ≈ $0.03

**Cache benefit:** Embeddings are cached to disk at `.embedding-cache/embeddings.json`. Repeated scans of unchanged questions use the cache and don't call the API.

---

## Rate Limits

OpenAI enforces rate limits based on your tier:

- **Free tier:** 200 requests/minute, 40,000 tokens/minute
- **Tier 1 ($5 spent):** 500 requests/minute, 100,000 tokens/minute
- **Tier 2 ($50 spent):** 5,000 requests/minute, 1,000,000 tokens/minute

The OpenAIEmbeddingService uses `p-limit(10)` to cap concurrent requests at 10, which should stay well under all tier limits.

---

## Troubleshooting

### "Invalid API key" error

- Check that the key starts with `sk-proj-` (project keys) or `sk-` (user keys)
- Verify the key is copied completely (should be ~56 characters)
- Check for extra spaces or newlines in `.env` file

### Rate limit errors

- The service automatically retries (maxRetries: 3)
- If persistent, reduce p-limit from 10 to 5 in `OpenAIEmbeddingService.ts`

### Cache not persisting

- Check that `.embedding-cache/` directory is writable
- Call `embeddingService.saveCache()` after batch operations
- Verify `.embedding-cache/` is NOT gitignored (cache is local-only)

---

## Next Steps

Once OPENAI_API_KEY is configured, you can:

1. Run semantic duplicate scan (Phase 32 CLI tool)
2. Generate embeddings for all questions in database
3. Detect duplicate clusters with similarity scores
4. Review and archive duplicate questions

The embedding cache will build up over time, making subsequent scans faster.
