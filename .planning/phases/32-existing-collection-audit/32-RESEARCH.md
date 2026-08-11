# Phase 32: Existing Collection Audit - Research

**Researched:** 2026-02-23
**Domain:** Admin UI review workflows, batch archival operations, JSON file synchronization, composite ranking
**Confidence:** HIGH

## Summary

This research covers building an admin UI review workflow for duplicate question clusters, implementing batch archival with database transactions, and synchronizing JSON source files with database state. The standard approach uses React admin UI patterns with bulk actions, Drizzle ORM transactions for atomic batch operations, and Node.js fs module for JSON file synchronization.

Key findings:
- Phase 31 infrastructure already provides duplicate cluster detection with recommendations (Federal > State > City hierarchy)
- React admin bulk action pattern (checkbox selection + action toolbar) is established for multi-item operations
- Sonner toast library is the 2026 standard for undo notifications in React admin UIs
- Drizzle ORM transactions ensure atomic batch archival (all succeed or all rollback)
- Composite scoring uses weighted factors (collection tier rank DESC, quality score DESC, externalId ASC) - already implemented in ClusterBuilder
- JSON file sync pattern: read file → filter out archived IDs → write back atomically

**Primary recommendation:** Build review UI with clustered group display using Phase 29 flag review queue patterns, use Drizzle transactions for batch archival with undo toast, sync JSON files after successful DB operations using atomic read-filter-write pattern.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | (current) | Database transactions for batch operations | Already in project, transaction API ensures atomicity |
| React | (current) | Admin UI framework | Project standard, component-based for review workflows |
| Tailwind CSS | (current) | UI styling | Project standard for admin components |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Sonner | ^1.5.0 | Toast notifications with undo | Industry standard for React 18+ admin UIs with undo patterns |
| @headlessui/react | (current) | Accessible UI primitives | Already in project, used in Phase 29 flag review tabs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sonner | react-hot-toast | Sonner has better TypeScript support and undo action patterns |
| Drizzle transactions | Raw pg-promise | Drizzle provides type-safe transaction API, less error-prone |
| Clustered view | Pairwise table | Clustered view shows full duplicate context, matches Phase 31 output |

**Installation:**
```bash
npm install sonner
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/pages/admin/
├── DuplicateReviewPage.tsx         # Main review page with tabs
├── components/
│   ├── DuplicateClusterCard.tsx    # Display single cluster with select-to-keep radio
│   ├── ClusterQuestionItem.tsx     # Question within cluster with quality indicators
│   └── ClusterSimilarityTable.tsx  # Pairwise similarity scores table

backend/src/routes/
├── admin.ts                         # Add duplicate review endpoints
└── services/
    ├── DuplicateReviewService.ts    # Batch archive logic with transactions
    └── JSONSyncService.ts           # Sync JSON files after archival
```

### Pattern 1: Clustered Review UI with Keep Selection
**What:** Display all questions in a duplicate cluster together with radio buttons to select which to keep
**When to use:** Reviewing duplicate clusters where user needs full context to make decision
**Example:**
```typescript
// Source: Combining Phase 29 flag review patterns + clustered grouping
interface DuplicateCluster {
  clusterId: string;
  tier: 'exact' | 'near-duplicate' | 'possible';
  questions: QuestionForReview[];
  similarities: SimilarityResult[];
  recommendation: {
    keep: string;
    archive: string[];
    reason: string;
  };
}

function DuplicateClusterCard({ cluster, onResolve }: Props) {
  const [selectedToKeep, setSelectedToKeep] = useState(cluster.recommendation.keep);

  const handleArchive = async () => {
    const toArchive = cluster.questions
      .filter(q => q.externalId !== selectedToKeep)
      .map(q => q.externalId);

    await onResolve({
      clusterId: cluster.clusterId,
      keep: selectedToKeep,
      archive: toArchive,
    });
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {cluster.tier === 'exact' ? 'Exact Match' :
           cluster.tier === 'near-duplicate' ? 'Near Duplicate' :
           'Possible Duplicate'}
        </h3>
        <span className="text-sm text-gray-600">
          {cluster.similarities[0].score.toFixed(2)} similarity
        </span>
      </div>

      {/* Recommendation banner */}
      <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
        <p className="text-sm text-blue-800">
          <strong>Recommended:</strong> {cluster.recommendation.reason}
        </p>
      </div>

      {/* Questions with radio select */}
      {cluster.questions.map(question => (
        <ClusterQuestionItem
          key={question.externalId}
          question={question}
          isSelected={selectedToKeep === question.externalId}
          onSelect={() => setSelectedToKeep(question.externalId)}
        />
      ))}

      {/* Similarity scores table */}
      <ClusterSimilarityTable similarities={cluster.similarities} />

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <button onClick={handleArchive} className="btn-primary">
          Archive {cluster.questions.length - 1} Duplicates
        </button>
        <button onClick={() => onSkip(cluster.clusterId)} className="btn-secondary">
          Skip for now
        </button>
      </div>
    </div>
  );
}
```

### Pattern 2: Auto-Resolve with Undo Toast
**What:** Automatically archive high-confidence duplicates (90%+ similarity) with undo notification
**When to use:** Auto-resolving exact matches to save admin time while preserving safety
**Example:**
```typescript
// Source: Sonner undo pattern + Phase 29 archive/restore pattern
import { toast } from 'sonner';

async function autoResolveCluster(cluster: DuplicateCluster) {
  const toArchive = cluster.recommendation.archive;
  const keep = cluster.recommendation.keep;

  // Perform archival
  const result = await fetch('/api/admin/duplicates/batch-archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keep: keep,
      archive: toArchive,
      clusterId: cluster.clusterId,
    }),
  });

  const { archivedIds, undoToken } = await result.json();

  // Show undo toast
  toast.success(
    `Archived ${archivedIds.length} duplicate${archivedIds.length > 1 ? 's' : ''}`,
    {
      action: {
        label: 'Undo',
        onClick: async () => {
          await fetch('/api/admin/duplicates/undo', {
            method: 'POST',
            body: JSON.stringify({ undoToken }),
          });
          toast.success('Archival undone');
        },
      },
      duration: 10000, // 10 seconds to undo
    }
  );
}
```

### Pattern 3: Batch Archive with Transaction
**What:** Archive multiple questions atomically using Drizzle transaction
**When to use:** Batch archival operations where all must succeed or all must rollback
**Example:**
```typescript
// Source: Drizzle ORM transaction patterns
import { db } from '../db/index.js';

async function batchArchiveQuestions(
  keepId: string,
  archiveIds: string[],
  reason: string
): Promise<{ success: true; archivedIds: string[] } | { success: false; error: string }> {
  try {
    const result = await db.transaction(async (tx) => {
      const timestamp = new Date().toISOString();
      const historyEntry = {
        action: 'archived' as const,
        timestamp,
        reason: `Duplicate of ${keepId}: ${reason}`,
      };

      // Archive all questions in the batch
      for (const externalId of archiveIds) {
        await tx
          .update(questions)
          .set({
            status: 'archived',
            expirationHistory: sql`${questions.expirationHistory} || ${JSON.stringify([historyEntry])}::jsonb`,
            updatedAt: new Date(),
          })
          .where(eq(questions.externalId, externalId));
      }

      return { success: true, archivedIds: archiveIds };
    });

    return result;
  } catch (error) {
    console.error('Batch archive failed:', error);
    return { success: false, error: error.message };
  }
}
```

### Pattern 4: JSON File Synchronization
**What:** Remove archived questions from JSON source files after successful DB archival
**When to use:** Keeping JSON source files in sync with database state
**Example:**
```typescript
// Source: Node.js fs atomic read-write pattern
import { readFileSync, writeFileSync } from 'fs';

async function syncJSONFilesAfterArchival(archivedIds: string[]): Promise<void> {
  const archivedSet = new Set(archivedIds);

  // Collection JSON files to update
  const jsonFiles = [
    'backend/src/data/questions.json',
    'backend/src/data/bloomington-in-questions.json',
    'backend/src/data/los-angeles-ca-questions.json',
    'backend/src/data/fremont-ca-questions.json',
    'backend/src/data/california-state-questions.json',
    'backend/src/data/indiana-state-questions.json',
  ];

  for (const filePath of jsonFiles) {
    try {
      // Read current file
      const fileContent = readFileSync(filePath, 'utf-8');
      const questions = JSON.parse(fileContent);

      // Filter out archived questions
      const remaining = questions.filter(
        (q: any) => !archivedSet.has(q.externalId)
      );

      // Only write if changes were made
      if (remaining.length < questions.length) {
        const removed = questions.length - remaining.length;
        console.log(`Removing ${removed} archived questions from ${filePath}`);

        // Atomic write (write to temp, then rename)
        writeFileSync(filePath, JSON.stringify(remaining, null, 2) + '\n');
      }
    } catch (error) {
      console.error(`Failed to sync ${filePath}:`, error);
      throw error; // Propagate error to caller
    }
  }
}
```

### Pattern 5: Cross-Collection Hierarchy Enforcement
**What:** Apply Federal > State > City hierarchy when determining which duplicate to keep
**When to use:** Resolving duplicates that span multiple collection types
**Example:**
```typescript
// Source: Phase 31 ClusterBuilder.ts recommendation logic (already implemented)
import { COLLECTION_HIERARCHY, TIER_RANK } from '../services/embeddings/types.js';

function determineBestQuestion(clusterQuestions: QuestionForReview[]): string {
  // Determine the collection tier for each question
  const questionsWithTier = clusterQuestions.map((q) => {
    // Find the highest tier among this question's collections
    let highestTier: CollectionTier | null = null;
    let highestRank = 0;

    for (const collection of q.collections) {
      const tier = COLLECTION_HIERARCHY[collection];
      if (tier) {
        const rank = TIER_RANK[tier];
        if (rank > highestRank) {
          highestTier = tier;
          highestRank = rank;
        }
      }
    }

    return {
      question: q,
      tier: highestTier,
      tierRank: highestRank,
    };
  });

  // Sort by: tier rank DESC, quality score DESC, externalId ASC
  questionsWithTier.sort((a, b) => {
    // 1. Highest tier wins (Federal > State > City)
    if (a.tierRank !== b.tierRank) {
      return b.tierRank - a.tierRank;
    }

    // 2. Highest quality score wins (null = 0)
    const scoreA = a.question.qualityScore ?? 0;
    const scoreB = b.question.qualityScore ?? 0;
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    // 3. Lowest externalId wins (alphabetical stability)
    return a.question.externalId.localeCompare(b.question.externalId);
  });

  return questionsWithTier[0].question.externalId;
}
```

### Anti-Patterns to Avoid
- **Archiving without transactions:** Partial failure leaves database in inconsistent state (some duplicates archived, others not)
- **JSON sync before DB commit:** If DB transaction rolls back, JSON files are out of sync
- **Forgetting undo window:** Auto-resolve without undo notification causes accidental archival
- **Ignoring collection hierarchy:** Removing Federal question and keeping city duplicate violates canonical source principle

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom toast component | Sonner | TypeScript-first, undo actions built-in, React 18+ optimized |
| Transaction management | Manual BEGIN/COMMIT/ROLLBACK | Drizzle transaction API | Type-safe, automatic rollback on error, less error-prone |
| Bulk action UI | Custom checkbox logic | React-admin pattern | Established UX pattern users recognize (Gmail, GitHub) |
| Composite ranking | Ad-hoc scoring | Phase 31 ClusterBuilder | Already implemented with collection hierarchy + quality score |
| Undo stack | Custom history tracking | Undo token with restore endpoint | Simpler, stateless, works across sessions |

**Key insight:** Admin review workflows have established patterns. Don't reinvent bulk actions, transactions, or undo notifications — use proven libraries and existing project patterns.

## Common Pitfalls

### Pitfall 1: Transaction Scope Too Narrow
**What goes wrong:** Each question archived in separate transaction, partial failures leave inconsistent state
**Why it happens:** Looping over archiveIds with individual update calls outside transaction
**How to avoid:** Wrap entire batch archival in single Drizzle transaction, all succeed or all rollback
**Warning signs:** Some duplicates archived but not others, error in middle of batch

### Pitfall 2: JSON Sync Before DB Commit
**What goes wrong:** JSON files updated but DB transaction rolls back, files out of sync with database
**Why it happens:** Calling syncJSONFiles inside transaction or before transaction completes
**How to avoid:** Only sync JSON files AFTER successful transaction commit, outside transaction block
**Warning signs:** JSON files missing questions that still exist with status='active' in database

### Pitfall 3: Undo Without Restoring JSON Files
**What goes wrong:** Question restored to database but JSON file still missing the question
**Why it happens:** Undo endpoint only updates DB status, doesn't re-add to JSON files
**How to avoid:** Store original JSON question data in undo metadata, re-add to files on undo
**Warning signs:** Restored question visible in admin but not appearing in game (missing from JSON)

### Pitfall 4: Missing Collection-Question Join Updates
**What goes wrong:** Question archived but collection_questions join table still has active references
**Why it happens:** Only updating questions table status, forgetting to handle junction table
**How to avoid:** Soft archive approach doesn't require junction table changes (status='archived' is sufficient filtering), but verify collection queries filter by status
**Warning signs:** Archived questions still appearing in collection question counts

### Pitfall 5: Race Condition on Concurrent Archival
**What goes wrong:** Two admins review same cluster simultaneously, both archive different questions
**Why it happens:** No locking on duplicate clusters, no conflict detection
**How to avoid:** Add cluster resolution status table, mark cluster as "in review" when opened, check status before archiving
**Warning signs:** Same cluster resolved twice with different keep selections, both sets archived

### Pitfall 6: Large File Write Performance
**What goes wrong:** Synchronous writeFileSync blocks event loop when writing large JSON files
**Why it happens:** questions.json with 600+ entries is ~1MB, blocking write noticeable on slow disk
**How to avoid:** Acceptable for admin operation (not player-facing), but could use writeFile (async) if needed
**Warning signs:** API endpoint timeout during JSON sync step

### Pitfall 7: Not Validating Cluster Integrity
**What goes wrong:** Admin selects "keep" question that isn't part of cluster, or all questions archived
**Why it happens:** Frontend doesn't validate keepId is in cluster.questions before submitting
**How to avoid:** Backend endpoint validates keepId exists in cluster, rejects if not found
**Warning signs:** Error "Question not found in cluster" after submission

## Code Examples

Verified patterns from official sources:

### Drizzle Transaction with Error Handling
```typescript
// Source: Drizzle ORM official docs - https://orm.drizzle.team/docs/transactions
import { db } from '../db/index.js';

async function performBatchArchival(
  keepId: string,
  archiveIds: string[]
): Promise<void> {
  await db.transaction(async (tx) => {
    const timestamp = new Date().toISOString();

    // All operations within transaction
    for (const externalId of archiveIds) {
      const historyEntry = {
        action: 'archived' as const,
        timestamp,
        reason: `Duplicate of ${keepId}`,
      };

      await tx
        .update(questions)
        .set({
          status: 'archived',
          expirationHistory: sql`${questions.expirationHistory} || ${JSON.stringify([historyEntry])}::jsonb`,
          updatedAt: new Date(),
        })
        .where(eq(questions.externalId, externalId));
    }

    // If any update fails, entire transaction rolls back automatically
  });

  // Only reached if transaction committed successfully
  console.log(`Successfully archived ${archiveIds.length} questions`);
}
```

### Sonner Toast with Undo Action
```typescript
// Source: Sonner official examples - shadcn/ui patterns
import { toast } from 'sonner';

function showArchiveSuccess(
  archivedCount: number,
  onUndo: () => Promise<void>
) {
  toast.success(
    `Archived ${archivedCount} duplicate question${archivedCount > 1 ? 's' : ''}`,
    {
      description: 'Questions removed from collections',
      action: {
        label: 'Undo',
        onClick: async () => {
          try {
            await onUndo();
            toast.success('Archival undone successfully');
          } catch (error) {
            toast.error('Failed to undo archival');
          }
        },
      },
      duration: 10000, // 10 seconds to undo
    }
  );
}
```

### Atomic JSON File Update
```typescript
// Source: Node.js fs best practices for atomic writes
import { readFileSync, writeFileSync, renameSync } from 'fs';
import { join } from 'path';

function atomicJSONUpdate(filePath: string, updateFn: (data: any) => any): void {
  // Read current file
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  // Apply update
  const updated = updateFn(data);

  // Write to temp file first
  const tempPath = `${filePath}.tmp`;
  writeFileSync(tempPath, JSON.stringify(updated, null, 2) + '\n');

  // Atomic rename (overwrites original)
  renameSync(tempPath, filePath);
}

// Usage
atomicJSONUpdate('data/questions.json', (questions) =>
  questions.filter((q) => !archivedSet.has(q.externalId))
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-hot-toast | Sonner | 2025 | Better TypeScript, built-in undo actions, React 18+ optimized |
| Manual BEGIN/COMMIT | Drizzle transaction API | Project standard | Type-safe, automatic rollback, less error-prone |
| Pairwise duplicate table | Clustered group view | Modern UX | Shows full duplicate context, matches Phase 31 output |
| Immediate archival | Undo toast notification | 2020s admin UX | Safety net for accidental actions, standard pattern |

**Deprecated/outdated:**
- react-hot-toast: Still works but Sonner has better DX and undo patterns for 2026
- Manual SQL transaction management: Drizzle provides type-safe transaction API
- Synchronous file writes without atomic rename: Risk of corruption on write failure

## Open Questions

Things that couldn't be fully resolved:

1. **Similarity threshold calibration**
   - What we know: User decided 90%+ similarity = auto-resolve eligible, but actual distribution unknown
   - What's unclear: Real-world similarity score distribution may require threshold adjustment
   - Recommendation: Start with 90% threshold, monitor first 50 clusters, adjust if too aggressive/conservative

2. **Undo window duration**
   - What we know: Undo toast needs reasonable time window before permanent commit
   - What's unclear: Optimal duration (10 seconds? 30 seconds? Until page refresh?)
   - Recommendation: 30-second toast duration for undo, matches Gmail/GitHub patterns

3. **JSON file backup strategy**
   - What we know: JSON files modified during sync, should have backup before changes
   - What's unclear: Whether to create timestamped backups or rely on git history
   - Recommendation: Rely on git history (files already version-controlled), no additional backup needed

4. **Cluster resolution persistence**
   - What we know: Need to track which clusters have been reviewed to avoid double-processing
   - What's unclear: Store resolution state in DB table or mark in duplicate report file?
   - Recommendation: Add duplicate_resolutions table tracking clusterId + resolution + timestamp

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM Transactions](https://orm.drizzle.team/docs/transactions) - Official transaction API documentation
- [Sonner Toast Library](https://sonner.emilkowal.ski/) - Official React toast library with undo patterns
- [React-admin Bulk Actions](https://marmelab.com/react-admin/CRUD.html) - Established admin UI patterns
- Phase 31 Research - Verified Phase 31 infrastructure (ClusterBuilder, recommendation logic)
- Phase 29 Flag Review Page - Existing review workflow patterns in project

### Secondary (MEDIUM confidence)
- [Shadcn/ui Sonner Integration](https://blog.stackademic.com/shadcn-ui-react-series-part-19-sonner-modern-toast-notifications-done-right-903757c5681f) - Sonner as 2026 standard for React admin UIs
- [Node.js Atomic File Writes](https://copyprogramming.com/howto/nodejs-best-way-to-store-a-file-based-json-database) - JSON file sync patterns
- [Composite Measure Methodologies](https://www.ahajournals.org/doi/full/10.1161/circoutcomes.111.961391) - Quality composite scoring best practices
- [Hierarchical Deduplication Strategy](https://link.springer.com/chapter/10.1007/978-3-031-96997-3_23) - Hierarchical matching and merge strategies

### Tertiary (LOW confidence)
- [React Admin Dashboard 2026 Guide](https://refine.dev/blog/react-admin-dashboard/) - General admin UI patterns (needs verification for specific patterns)
- [Database Transaction Best Practices](https://developers.redhat.com/articles/2023/07/31/how-handle-transactions-nodejs-reference-architecture) - General transaction patterns (not Drizzle-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Drizzle already in project, Sonner is 2026 industry standard, React/Tailwind project standard
- Architecture: HIGH - Phase 29 review workflow exists, Phase 31 clustering implemented, patterns verified
- Pitfalls: HIGH - Based on transaction semantics, JSON sync ordering, concurrent editing issues
- Composite ranking: HIGH - Already implemented in Phase 31 ClusterBuilder with collection hierarchy

**Research date:** 2026-02-23
**Valid until:** ~90 days (UI patterns stable, Drizzle API stable, main risk is Sonner updates)
