# Phase 30: Admin Integration & Tech Debt - Research

**Researched:** 2026-02-22
**Domain:** Admin UI integration, AI-assisted content repair, environment configuration
**Confidence:** HIGH

## Summary

This phase integrates flag count visibility into the existing question explorer, repairs 320 broken Learn More links using AI-assisted URL discovery, and adds production admin email configuration. The technical domains are well-established: React table column additions follow the existing QuestionsPage.tsx patterns, URL validation uses Node.js native fetch with HEAD requests and timeout handling, AI-assisted URL discovery leverages the existing Anthropic SDK already used for content generation, and deep linking patterns are already demonstrated in both admin pages.

The key technical challenge is AI prompt engineering to find authoritative source URLs given only question text and answer. The existing codebase provides strong patterns: Anthropic SDK is configured with retry and timeout (anthropic-client.ts), fetch-sources.ts demonstrates URL validation with timeout, and QuestionsPage.tsx shows the exact pattern for adding sortable/filterable columns.

**Primary recommendation:** Extend existing patterns (add flag_count column to QuestionTable, create admin script using existing anthropic-client, use native fetch HEAD requests for validation) and implement bidirectional deep linking with searchParams.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18.2 | 18.2.0 | UI framework | Existing admin UI foundation |
| React Router | 6.21.1 | Deep linking with searchParams | Already handles ?questionId=X patterns |
| Anthropic SDK | 0.74.0 | AI-assisted URL discovery | Already configured in project for content generation |
| Node.js fetch | Native | URL validation (HTTP HEAD) | Built-in, no dependencies, timeout support via AbortSignal |
| TailwindCSS | 3.4.1 | Badge styling | Existing admin UI styling standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| p-limit | 6.1.0 | Concurrency control | Already used in fetch-sources.ts for batch URL fetching |
| Zod | 4.3.6 | AI response validation | Already used in content generation scripts |
| dotenv | 16.4.7 | Environment variable loading | Backend standard for config management |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Anthropic SDK | OpenAI SDK | Anthropic already configured with retry/timeout, switching adds new dependency |
| Native fetch | axios/got | Native fetch sufficient for HEAD requests, no new deps needed |
| Custom concurrency | async.queue | p-limit already in project (fetch-sources.ts), simpler API |
| Dialog for filters | Inline selects | Existing admin UI uses inline filters consistently |

**Installation:**
```bash
# No new dependencies needed - all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/pages/admin/
├── QuestionsPage.tsx              # Add flag count column + "View Flags" link
├── FlagReviewPage.tsx             # Add questionId filter + "Edit in Explorer" link
├── components/
│   ├── QuestionTable.tsx          # Add flagCount column with color-coded badges
│   └── QuestionDetailPanel.tsx    # Add "View Flags" link in metadata area

backend/src/
├── routes/admin.ts                # Add ADMIN_EMAIL env var to health endpoint
├── scripts/
│   └── repair-broken-links.ts     # New: AI-assisted URL discovery + validation
├── env.ts                         # Add ADMIN_EMAIL validation
```

### Pattern 1: Adding Sortable/Filterable Column to Existing Table
**What:** Extend QuestionTable with new column, add sort handler, add filter UI
**When to use:** Any time adding data columns to existing admin tables
**Example:**
```typescript
// Source: Existing pattern from C:\Project Test\frontend\src\pages\admin\components\QuestionTable.tsx
export interface QuestionRow {
  // ... existing fields
  flagCount: number;  // NEW: Add to interface
}

// In table header
<th
  className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-red-800"
  onClick={() => onSortChange('flag_count')}
>
  Flags {renderSortIcon('flag_count')}
</th>

// In table body - use Phase 29 color-coding pattern
const getFlagCountBadge = (count: number) => {
  if (count > 5) return 'bg-red-100 text-red-600 font-bold';
  if (count > 2) return 'bg-orange-100 text-orange-600 font-bold';
  return 'bg-gray-100 text-gray-600';
};

<td className="px-6 py-4">
  <span className={`px-2 py-1 text-xs rounded-full ${getFlagCountBadge(question.flagCount)}`}>
    {question.flagCount}
  </span>
</td>
```

### Pattern 2: URL Validation with HTTP HEAD Request
**What:** Check URL availability without downloading full response body
**When to use:** Validating external links before saving to database
**Example:**
```typescript
// Source: Adapted from C:\Project Test\backend\src\scripts\content-generation\rag\fetch-sources.ts
async function validateUrl(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'CivicTriviaBot/1.0 (link validation)',
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',  // Follow redirects automatically
    });

    return response.ok;  // 200-299 status codes
  } catch (error) {
    console.warn(`URL validation failed for ${url}: ${error.message}`);
    return false;
  }
}

// Batch validation with concurrency control
import pLimit from 'p-limit';

async function validateUrls(urls: string[]): Promise<Map<string, boolean>> {
  const limit = pLimit(5);  // Max 5 concurrent requests
  const results = new Map<string, boolean>();

  await Promise.all(
    urls.map(url => limit(async () => {
      results.set(url, await validateUrl(url));
    }))
  );

  return results;
}
```

### Pattern 3: AI-Assisted URL Discovery with Structured Output
**What:** Use Claude to find authoritative source URLs given question content
**When to use:** Repairing broken links when original source is lost
**Example:**
```typescript
// Source: Adapted from existing anthropic-client.ts and content generation patterns
import { client, MODEL } from '../content-generation/anthropic-client.js';
import { z } from 'zod';

const UrlDiscoverySchema = z.object({
  urls: z.array(z.object({
    url: z.string().url(),
    source_name: z.string(),
    relevance_score: z.number().min(0).max(10),
    reasoning: z.string(),
  })),
  confidence: z.enum(['high', 'medium', 'low']),
});

async function findSourceUrls(questionText: string, correctAnswer: string): Promise<z.infer<typeof UrlDiscoverySchema>> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    temperature: 0.3,  // Lower temp for factual accuracy
    system: `You are a civic education content curator. Find 1-3 authoritative government or educational source URLs that provide reliable information about the given civic trivia question and its answer.

ONLY suggest URLs from:
- .gov domains (federal, state, local government)
- .edu domains (universities, civic education organizations)
- Established civic education nonprofits (e.g., archives.gov, constitutioncenter.org)

Respond ONLY with valid JSON matching this schema:
{
  "urls": [
    {
      "url": "https://example.gov/page",
      "source_name": "U.S. Senate",
      "relevance_score": 8,
      "reasoning": "Brief explanation of relevance"
    }
  ],
  "confidence": "high" | "medium" | "low"
}`,
    messages: [
      {
        role: 'user',
        content: `Question: ${questionText}\n\nCorrect Answer: ${correctAnswer}\n\nFind authoritative source URLs that confirm this information.`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const parsed = JSON.parse(text);
  return UrlDiscoverySchema.parse(parsed);
}
```

### Pattern 4: Deep Linking with Query Parameters
**What:** Use searchParams to open specific items and maintain filter context
**When to use:** Cross-navigation between admin pages (explorer ↔ flags)
**Example:**
```typescript
// Source: Existing pattern from FlagReviewPage.tsx and QuestionsPage.tsx

// In QuestionDetailPanel - "View Flags" link
import { useNavigate } from 'react-router-dom';

function QuestionDetailPanel({ questionId }: Props) {
  const navigate = useNavigate();

  const handleViewFlags = () => {
    navigate(`/admin/flags?questionId=${questionId}&tab=active`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Flags:</span>
      <span className={`px-2 py-1 text-xs rounded-full ${getFlagCountBadge(flagCount)}`}>
        {flagCount}
      </span>
      {flagCount > 0 && (
        <button onClick={handleViewFlags} className="text-sm text-blue-600 hover:underline">
          View Flags →
        </button>
      )}
    </div>
  );
}

// In FlagReviewPage - handle questionId filter from URL
const questionId = searchParams.get('questionId');

useEffect(() => {
  const params = new URLSearchParams();
  // ... existing params
  if (questionId) params.set('questionId', questionId);

  const response = await fetch(`${API_URL}/api/admin/flags?${params}`);
}, [searchParams]);

// Show filter banner when filtered to single question
{questionId && (
  <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-md flex items-center justify-between">
    <span className="text-sm text-blue-800">
      Showing flags for Question #{questionId}
    </span>
    <button
      onClick={() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('questionId');
        setSearchParams(newParams);
      }}
      className="text-sm text-blue-600 hover:underline"
    >
      Clear filter ×
    </button>
  </div>
)}
```

### Pattern 5: Environment Variable Validation at Startup
**What:** Validate required env vars when server starts, not when used
**When to use:** Any configuration that affects runtime behavior
**Example:**
```typescript
// Source: Best practices from Node.js 2026 guides

// In backend/src/env.ts
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url(),
  ADMIN_EMAIL: z.string().email().optional(),  // NEW: Optional admin contact
});

export const env = envSchema.parse(process.env);

// In backend/src/routes/admin.ts - expose in health endpoint
router.get('/health', authenticateToken, requireAdmin, async (req, res) => {
  res.json({
    status: 'ok',
    adminContact: env.ADMIN_EMAIL || null,
  });
});
```

### Anti-Patterns to Avoid

- **Don't use GET requests for URL validation**: HEAD requests are more efficient (no response body download) and semantically correct for "does this exist?" checks
- **Don't validate URLs synchronously one-by-one**: Use p-limit for controlled concurrency (5-10 concurrent) to avoid overwhelming servers or triggering rate limits
- **Don't trust AI-generated URLs without validation**: Always HTTP check URLs returned by Claude before saving to database
- **Don't add filter state to component state**: Use URL searchParams for all filters (enables shareable links, back button support, no state sync bugs)
- **Don't fetch full page content for link validation**: HEAD request is sufficient to check if URL exists and returns 200-299 status

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Concurrent batch processing | Manual Promise.all loops | p-limit | Already in project, handles backpressure, prevents overwhelming servers |
| HTTP timeout handling | setTimeout wrappers | AbortSignal.timeout() | Native browser/Node.js API, automatic cleanup, cleaner code |
| URL redirect following | Manual 3xx detection | fetch with redirect: 'follow' | Native fetch follows redirects automatically (up to 20 hops) |
| AI response validation | Manual JSON parsing | Zod schemas | Already project standard, better error messages, type safety |
| Environment variable validation | Manual process.env checks | Zod schema at startup | Fail fast at startup, not at runtime when config is accessed |

**Key insight:** Node.js native fetch (available since v18) handles most URL validation needs without external libraries. Only use axios/got if you need advanced features like progress tracking or retry middleware.

## Common Pitfalls

### Pitfall 1: Filter State Desync Between URL and Component
**What goes wrong:** Adding flag count filter to component state (useState) instead of URL searchParams causes state desync - filter looks applied but data doesn't match, back button breaks filter, can't share filtered URLs
**Why it happens:** Existing admin pages use URL state, easy to accidentally use local state for new filters
**How to avoid:** Always add new filters to searchParams, never local state. Follow QuestionsPage.tsx pattern exactly
**Warning signs:** Filter works initially but breaks on back button, or filter resets when pagination changes

### Pitfall 2: HTTP HEAD Not Following Redirects
**What goes wrong:** Many government sites redirect HTTP → HTTPS or www → non-www. HEAD request without redirect: 'follow' returns 301/302 instead of checking final destination, causing valid URLs to fail validation
**Why it happens:** Default fetch behavior is redirect: 'follow', but it's easy to forget or set to 'manual' when trying to detect redirects
**How to avoid:** Always set redirect: 'follow' for URL validation unless you specifically need to detect redirects
**Warning signs:** URLs that work in browser fail validation, seeing 301/302 status codes in logs

### Pitfall 3: AI Hallucinating Plausible But Invalid URLs
**What goes wrong:** Claude generates URLs that look authoritative (e.g., "https://www.senate.gov/article-i-powers") but don't actually exist (404). Admin trusts AI and saves broken link
**Why it happens:** LLMs are trained to generate plausible text, not verify URLs exist
**How to avoid:** ALWAYS HTTP validate AI-suggested URLs before saving. Treat AI output as "candidates" not "verified sources"
**Warning signs:** AI suggests very specific URLs (deep paths) that return 404, multiple questions get identical generic URLs

### Pitfall 4: URL Validation Timeout Too Short
**What goes wrong:** Government websites can be slow (1-3 second response times). Setting timeout to 1000ms causes false negatives - valid URLs marked as broken
**Why it happens:** Developer optimizes for speed without considering real-world latency
**How to avoid:** Use 5000ms (5 second) timeout for HEAD requests. Government sites are notoriously slow, especially archives.gov, loc.gov
**Warning signs:** Validation fails for .gov domains during business hours (high traffic), retrying same URL succeeds

### Pitfall 5: Not Handling AbortSignal.timeout() Errors
**What goes wrong:** When timeout fires, fetch throws TimeoutError. If not caught, entire batch fails instead of just marking that URL as invalid
**Why it happens:** AbortSignal.timeout() is newer API, developers forget it throws errors
**How to avoid:** Wrap each fetch in try/catch, log timeout as warning (not error), continue to next URL
**Warning signs:** One slow URL blocks entire batch, script exits with unhandled promise rejection

### Pitfall 6: Adding Column Without Backend Schema Support
**What goes wrong:** Frontend displays flag_count column but backend /api/admin/questions/explore doesn't include flagCount in query or response. Column shows undefined or stale data
**Why it happens:** Schema already has flag_count column (Phase 29-01), easy to forget backend endpoint needs to select it
**How to avoid:** Check backend query includes flag_count in SELECT, verify response interface includes flagCount field
**Warning signs:** Column shows 0 for all rows, or shows undefined, even though database has values

## Code Examples

Verified patterns from existing codebase:

### Sortable Column with Color-Coded Badges
```typescript
// Source: C:\Project Test\frontend\src\pages\admin\components\QuestionTable.tsx
// Phase 29 FlaggedQuestionsTable.tsx color-coding pattern

const getFlagCountBadge = (count: number) => {
  if (count > 5) return 'bg-red-100 text-red-600 font-bold';
  if (count > 2) return 'bg-orange-100 text-orange-600 font-bold';
  return 'bg-gray-100 text-gray-600';
};

// In table header
<th
  className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-red-800"
  onClick={() => onSortChange('flag_count')}
>
  Flags {renderSortIcon('flag_count')}
</th>

// In table body
<td className="px-6 py-4 text-center">
  {question.flagCount > 0 ? (
    <span className={`px-2 py-1 text-xs rounded-full ${getFlagCountBadge(question.flagCount)}`}>
      {question.flagCount}
    </span>
  ) : (
    <span className="text-sm text-gray-400">-</span>
  )}
</td>
```

### Backend Query Including Flag Count
```typescript
// Source: Pattern from existing admin endpoints

// In backend/src/routes/admin.ts GET /api/admin/questions/explore
const questionsData = await db
  .select({
    id: questions.id,
    externalId: questions.externalId,
    text: questions.text,
    difficulty: questions.difficulty,
    qualityScore: questions.qualityScore,
    violationCount: questions.violationCount,
    flagCount: questions.flagCount,  // NEW: Include in SELECT
    status: questions.status,
    encounterCount: questions.encounterCount,
    correctCount: questions.correctCount,
    createdAt: questions.createdAt,
  })
  .from(questions)
  .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
  .orderBy(orderByClause)
  .limit(limit)
  .offset((page - 1) * limit);
```

### Batch URL Validation with Concurrency Control
```typescript
// Source: Adapted from fetch-sources.ts p-limit pattern

import pLimit from 'p-limit';

interface UrlValidationResult {
  url: string;
  isValid: boolean;
  statusCode?: number;
  error?: string;
}

async function validateUrlBatch(
  urls: string[],
  concurrency: number = 5,
  timeoutMs: number = 5000
): Promise<UrlValidationResult[]> {
  const limit = pLimit(concurrency);
  const results: UrlValidationResult[] = [];

  const tasks = urls.map(url =>
    limit(async () => {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'CivicTriviaBot/1.0 (link validation)' },
          signal: AbortSignal.timeout(timeoutMs),
          redirect: 'follow',
        });

        results.push({
          url,
          isValid: response.ok,
          statusCode: response.status,
        });
      } catch (error) {
        results.push({
          url,
          isValid: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })
  );

  await Promise.all(tasks);
  return results;
}
```

### Admin Script with Interactive Review
```typescript
// Source: Pattern from audit-questions.ts

/**
 * repair-broken-links.ts
 *
 * Finds and repairs broken source URLs using AI-assisted discovery
 *
 * Usage:
 *   npx tsx src/scripts/repair-broken-links.ts              # Scan and suggest
 *   npx tsx src/scripts/repair-broken-links.ts --batch 5    # Process 5 questions
 *   npx tsx src/scripts/repair-broken-links.ts --auto-apply # Apply without confirmation
 */

interface RepairCandidate {
  questionId: number;
  externalId: string;
  text: string;
  currentUrl: string;
  suggestedUrls: Array<{
    url: string;
    sourceName: string;
    isValid: boolean;
    relevanceScore: number;
  }>;
}

async function scanForBrokenLinks(batchSize?: number): Promise<RepairCandidate[]> {
  // Query questions with potentially broken URLs
  const questionsToCheck = await db
    .select({
      id: questions.id,
      externalId: questions.externalId,
      text: questions.text,
      options: questions.options,
      correctAnswer: questions.correctAnswer,
      source: questions.source,
    })
    .from(questions)
    .where(eq(questions.status, 'active'))
    .limit(batchSize || 320);

  // Validate current URLs
  const urlValidations = await validateUrlBatch(
    questionsToCheck.map(q => q.source.url)
  );

  const brokenLinks = questionsToCheck.filter((_, idx) =>
    !urlValidations[idx].isValid
  );

  console.log(`Found ${brokenLinks.length} questions with broken links`);

  // AI-assisted URL discovery for broken links
  const candidates: RepairCandidate[] = [];

  for (const question of brokenLinks) {
    const correctAnswer = question.options[question.correctAnswer];
    const discovered = await findSourceUrls(question.text, correctAnswer);

    // Validate AI-suggested URLs
    const validations = await validateUrlBatch(
      discovered.urls.map(u => u.url)
    );

    candidates.push({
      questionId: question.id,
      externalId: question.externalId,
      text: question.text.substring(0, 100) + '...',
      currentUrl: question.source.url,
      suggestedUrls: discovered.urls.map((u, idx) => ({
        ...u,
        isValid: validations[idx].isValid,
      })),
    });
  }

  return candidates;
}

// Interactive review and apply
async function reviewAndApply(candidates: RepairCandidate[], autoApply: boolean) {
  console.log(`\n=== Link Repair Candidates ===\n`);

  for (const candidate of candidates) {
    console.log(`Question: ${candidate.text}`);
    console.log(`Current URL: ${candidate.currentUrl} (BROKEN)`);
    console.log(`\nSuggested replacements:`);

    candidate.suggestedUrls.forEach((suggestion, idx) => {
      console.log(`  ${idx + 1}. ${suggestion.url}`);
      console.log(`     Source: ${suggestion.sourceName}`);
      console.log(`     Valid: ${suggestion.isValid ? '✓' : '✗'}`);
      console.log(`     Relevance: ${suggestion.relevanceScore}/10`);
    });

    if (!autoApply) {
      // In real implementation, use readline for interactive prompt
      console.log(`\nSelect option (1-${candidate.suggestedUrls.length}, s=skip, n=null): `);
      // ... interactive selection logic
    } else {
      // Auto-select highest scoring valid URL
      const bestUrl = candidate.suggestedUrls
        .filter(u => u.isValid)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)[0];

      if (bestUrl) {
        await db
          .update(questions)
          .set({
            source: {
              name: bestUrl.sourceName,
              url: bestUrl.url,
            },
            updatedAt: new Date(),
          })
          .where(eq(questions.id, candidate.questionId));

        console.log(`✓ Updated to: ${bestUrl.url}`);
      } else {
        await db
          .update(questions)
          .set({
            source: {
              name: 'No Source Found',
              url: null,
            },
            updatedAt: new Date(),
          })
          .where(eq(questions.id, candidate.questionId));

        console.log(`✗ No valid URLs found, set to null`);
      }
    }

    console.log('---\n');
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| axios for HTTP requests | Native fetch API | Node.js v18 (2022) | No external dependencies for URL validation, built-in timeout via AbortSignal |
| Custom HTTP client libs | AbortSignal.timeout() | Node.js v18 (2022) | Native timeout API, cleaner code, automatic cleanup |
| Manual redirect handling | fetch redirect: 'follow' | Always available | Fetch follows up to 20 redirects automatically |
| OpenAI for structured output | Anthropic Claude with JSON mode | Claude 3+ (2024) | Better instruction following, already in project |
| Library toast notifications | Custom hooks with timeouts | React 18+ (2022) | 50-line custom solution avoids 3-10KB dependency |
| TanStack Table | Plain HTML tables | N/A | Existing codebase pattern, no library needed for simple tables |

**Deprecated/outdated:**
- axios/got for simple URL checks: Native fetch is sufficient, one less dependency
- request library: Deprecated, use fetch instead
- Parsing redirect headers manually: fetch handles this automatically

## Open Questions

Things that couldn't be fully resolved:

1. **AI accuracy for finding source URLs**
   - What we know: Claude can suggest plausible URLs, needs validation before saving
   - What's unclear: Success rate for civic content (% of suggestions that are valid and relevant)
   - Recommendation: Start with small batch (10-20 questions), measure accuracy, adjust prompts if needed. Track metrics: % valid URLs found, % requiring manual review

2. **Optimal concurrency for URL validation**
   - What we know: p-limit already used with concurrency=3 for content fetching
   - What's unclear: Government servers may rate-limit HEAD requests differently than GET
   - Recommendation: Start with concurrency=5, monitor for rate limit errors (429 status), adjust down if needed

3. **Flag count filter UI design**
   - What we know: User decided sortable column + filterable, didn't specify filter UI
   - What's unclear: Should it be "Flagged only" toggle, count threshold dropdown, or both?
   - Recommendation: Implement simple "Flagged only" checkbox first (filters to flag_count > 0). Can add threshold dropdown later if needed

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns:
  - C:\Project Test\frontend\src\pages\admin\QuestionsPage.tsx - URL state management, table patterns
  - C:\Project Test\frontend\src\pages\admin\FlagReviewPage.tsx - Tab pattern, searchParams usage
  - C:\Project Test\frontend\src\pages\admin\components\QuestionTable.tsx - Sortable column pattern
  - C:\Project Test\backend\src\scripts\content-generation\anthropic-client.ts - AI configuration
  - C:\Project Test\backend\src\scripts\content-generation\rag\fetch-sources.ts - URL fetching, concurrency
  - C:\Project Test\backend\src\scripts\audit-questions.ts - Admin script pattern with interactive review
  - C:\Project Test\backend\src\db\schema.ts - Schema shows flag_count column exists (line 87)

### Secondary (MEDIUM confidence)
- [How to Create a Sortable and Filterable Table in React - SitePoint](https://www.sitepoint.com/create-sortable-filterable-table-react/) - General React table patterns
- [What are the Differences Between HTTP HEAD and GET Methods? - Apidog](https://apidog.com/blog/http-head-vs-get/) - HEAD vs GET semantics
- [A Complete Guide to Timeouts in Node.js - Better Stack](https://betterstack.com/community/guides/scaling-nodejs/nodejs-timeouts/) - AbortSignal.timeout() usage
- [How to Handle API Rate Limits Gracefully (2026 Guide) - API Status Check](https://apistatuscheck.com/blog/how-to-handle-api-rate-limits) - Batch processing best practices
- [Controlled Concurrency with Retries in Node.js using p-limit - Medium](https://medium.com/@sonishubham65/controlled-concurrency-with-retries-in-node-js-using-p-limit-063159ab8478) - p-limit patterns
- [React Router Deep Linking - React Navigation Docs](https://reactnavigation.org/docs/4.x/deep-linking/) - Query parameter patterns
- [Node.js Environment Variables Best Practices - GitHub Discussion](https://github.com/orgs/community/discussions/157077) - Env var validation
- [Prompt Engineering Best Practices - Anthropic Docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices) - Claude 4.x prompting

### Tertiary (LOW confidence)
- Web search results mention OpenAI web search tool for citations, but Anthropic SDK already in project is sufficient
- Various React table libraries (TanStack, Material React Table) not needed - existing codebase uses plain HTML tables

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and configured, no new dependencies
- Architecture: HIGH - Strong existing patterns in codebase (QuestionsPage, fetch-sources, audit-questions)
- Pitfalls: HIGH - Verified from existing code and Node.js documentation

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days - stable domain, Node.js and React patterns unlikely to change)
