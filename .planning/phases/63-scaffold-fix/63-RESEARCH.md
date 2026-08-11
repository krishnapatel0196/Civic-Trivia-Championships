# Phase 63: Scaffold Fix - Research

**Researched:** 2026-03-15
**Domain:** TypeScript AST/text manipulation — bug fix in scaffold-collection.ts
**Confidence:** HIGH

## Summary

This phase fixes a single, well-scoped bug in `scaffold-collection.ts`. The `step3RegisterLocale` function uses a brace-depth scanner to locate the end of the `supportedLocales` object inside `generate-locale-questions.ts`, then inserts a new locale entry there. The scanner is fooled by a TypeScript type annotation on the very same line as the object declaration, causing the insertion to land inside the type annotation rather than inside the object body. The result: `generate-locale-questions.ts` is silently corrupted every time a collection is scaffolded.

The fix requires no new libraries, no architectural changes, and no changes to the surrounding workflow. The single function `step3RegisterLocale` in `scaffold-collection.ts` needs its insertion logic replaced with an approach that is not confused by brace characters inside type annotations. The cleanest approach is a marker/anchor string search — find the last entry already in the `supportedLocales` object and insert after it, rather than scanning for `}` by counting braces.

**Primary recommendation:** Replace the brace-depth scanner in `step3RegisterLocale` with a targeted string-anchor approach that finds the last existing locale entry line and inserts the new entry after it, for both `supportedLocales` and `configKeys`.

## Standard Stack

No new libraries are needed. This is a pure bug fix inside existing Node.js/TypeScript script code.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Node.js `fs` (readFileSync/writeFileSync) | built-in | Read and write the target file | Already in use — no change needed |
| Plain string manipulation | n/a | Locate insertion points and splice content | Simpler and safer than brace scanning for this use case |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Marker/anchor string search | TypeScript compiler API (ts-morph) | ts-morph is robust for arbitrary AST edits but is heavyweight overkill for inserting a single line into a fixed-shape file |
| Marker/anchor string search | Regex with multiline flags | Regex works but is harder to read and maintain than a plain `lastIndexOf` on a known unique anchor string |

No installation needed.

## Architecture Patterns

### The Bug: Brace-depth Scanner Fails on Inline Type Annotation

The `supportedLocales` variable declaration at line 101 of `generate-locale-questions.ts` is:

```typescript
const supportedLocales: Record<string, () => Promise<{ default?: LocaleConfig; [key: string]: unknown }>> = {
```

The existing scanner in `step3RegisterLocale` starts at `const supportedLocales:` and walks character by character, incrementing `braceDepth` on `{` and decrementing on `}`. The type annotation `Record<string, () => Promise<{ default?: ... }>>` contains one `{` and one `}`. The scanner hits the `}` at depth 1 and concludes it has found the object's closing brace — but it has only found the closing brace of the inline type parameter. `objectClosePos` is set to this position, which is mid-line-101, inside the type annotation.

The subsequent splice inserts `\n  ` plus the new locale entry at that position, corrupting the type annotation line. The file becomes unparseable or behaviorally broken for subsequent generation runs.

### The Fix: Anchor-based Insertion

Rather than counting braces, find the last existing locale entry by scanning for the final `',\n` pattern inside the `supportedLocales` block, or more reliably, find the last entry by string-matching the known last entry in the file and inserting after its line.

**Pattern: Last-entry anchor**

```typescript
// Source: direct code inspection of generate-locale-questions.ts lines 101–111

// Find the last entry line inside supportedLocales.
// All entries follow the pattern: "    'some-locale': () => import(..."
// The last one ends with ",\n" before the closing "};"
// Strategy: find supportedLocalesStart, then find the last occurrence of
// the pattern "    '" that is a locale entry line within that block.

const LOCALE_ENTRY_PATTERN = /^    '[a-z0-9-]+': \(\) => import\(/m;
```

A simpler, more reliable anchor: search for the closing `};` of the `supportedLocales` block using a **line-oriented** approach rather than a character scanner. Find the `supportedLocalesStart`, then search forward line by line for the first line that is exactly `  };` (two-space indent + `};`) — this is unambiguous because no entry line takes that form.

**Pattern: Line-by-line closing-line detection**

```typescript
// Source: direct code inspection — the closing line of supportedLocales in
// generate-locale-questions.ts is:
//   "  };"
// (two leading spaces, then }; — no type-annotation content on that line)

function findSupportedLocalesClosingLine(content: string, startPos: number): number {
  const lines = content.slice(startPos).split('\n');
  let braceDepth = 0;
  let charPos = startPos;

  for (const line of lines) {
    for (const ch of line) {
      if (ch === '{') braceDepth++;
      else if (ch === '}') {
        braceDepth--;
        if (braceDepth === 0) {
          // Return position of this closing brace within full content
          return charPos + line.indexOf('}');
        }
      }
    }
    charPos += line.length + 1; // +1 for '\n'
  }
  return -1;
}
```

Wait — but the type annotation `{ default?: LocaleConfig; ... }` is on the SAME line as the object opening `{`. The line-by-line approach still counts both braces on line 101. The root issue is that any brace counting approach that starts scanning from `const supportedLocales:` will hit the type-annotation braces before the object-literal braces.

**Correct Fix: Start scanning from the `= {` assignment, not from `const supportedLocales:`**

The object literal begins at ` = {` on the declaration line. Skip past the type annotation by finding the `= {` that opens the actual object value:

```typescript
// Source: direct code inspection of generate-locale-questions.ts line 101
// The declaration line ends with: `>> = {`
// Strategy: find "const supportedLocales:", then within that line find " = {",
// and begin brace scanning from THAT position (the actual object open brace).

const declarationStart = content.indexOf('const supportedLocales:');
const assignmentOpen = content.indexOf(' = {', declarationStart);
// assignmentOpen points to the space before '= {'; the '{' is at assignmentOpen + 3
// Begin brace depth scan from assignmentOpen + 3
```

This approach skips over the type annotation entirely because `= {` always marks the start of the actual object literal in TypeScript variable declarations. The scanner will then correctly count the one opening `{` and find its matching `}`, which is the true end of the `supportedLocales` object.

The same class of fix applies to `configKeys` — but the `configKeys` array has no type annotation and its current `[` scanner works correctly. Verify this before changing it.

### Anti-Patterns to Avoid

- **Brace scanning from the declaration keyword**: Scanning from `const supportedLocales:` picks up type-annotation braces before reaching the object literal. Always scan from the `= {` assignment instead.
- **Regex with `.` matching `\n`**: TypeScript type annotations can span lines; a multiline regex that grabs `{[^}]*}` would need careful flags and is fragile.
- **Rewriting the target file's structure to "fix" the scanner**: Do not change `generate-locale-questions.ts` to work around the scanner. Fix the scanner to work with the file as it is.
- **Using ts-morph or TypeScript compiler API**: Correct but adds a heavy dependency for a trivial fix. Overkill here.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding the object literal start | A smarter brace scanner from the variable name | Find ` = {` after the variable declaration | The `= {` pattern unambiguously marks the start of the object literal in all TypeScript variable assignments |
| Verifying the fix works | Manual inspection | `git diff` comparison after running scaffold on a test slug with `--dry-run` equivalent | Shows byte-level changes; catch regressions immediately |

**Key insight:** The file being modified (`generate-locale-questions.ts`) has a stable, known structure. The insertion logic does not need to handle arbitrary TypeScript — it only needs to handle this one specific file. A targeted, file-structure-aware approach (find ` = {`, find matching `}`) is more reliable than a general brace scanner.

## Common Pitfalls

### Pitfall 1: Fixing `supportedLocales` but breaking `configKeys`
**What goes wrong:** The configKeys fix is considered "already working" and left alone, but the `configKeys` entry format (`, 'configVarNameConfig'`) may also have subtle issues — for example, it inserts before `]` with no trailing newline, producing an inconsistently formatted line.
**Why it happens:** The two insertion sites look similar but have different surrounding code structure.
**How to avoid:** After fixing `supportedLocales`, verify the `configKeys` insertion produces syntactically and stylistically correct output. Check that it matches the formatting convention of the existing entries.
**Warning signs:** TypeScript compiler errors when running `npx tsx generate-locale-questions.ts` after scaffold.

### Pitfall 2: The new locale entry ends up as the last entry without a trailing comma
**What goes wrong:** JavaScript/TypeScript allows trailing commas in object literals, but the insertion may produce `'new-locale': ...,\n  }` (trailing comma before `}`) or `'new-locale': ...` (no comma). Both are valid, but the style should be consistent with existing entries.
**Why it happens:** The inserted string in the current code ends with `,\n  ` — the comma is present. Verify the fixed version preserves this.
**How to avoid:** Check the insertion string includes a trailing comma and that the resulting file passes `npx tsc --noEmit` (or `npx tsx --check`) without errors.
**Warning signs:** TypeScript errors about trailing commas (in strict mode) or missing commas.

### Pitfall 3: The fix only works for the current file structure
**What goes wrong:** The `= {` approach works today but would break if the `supportedLocales` declaration ever changes shape (e.g., split across lines for the type annotation).
**Why it happens:** String-based file manipulation is inherently fragile to refactors of the target file.
**How to avoid:** Add a clear error message if ` = {` is not found after `const supportedLocales:`, matching the existing error-exit pattern already in the function.
**Warning signs:** Script exits with "Could not find..." error after `generate-locale-questions.ts` is refactored.

### Pitfall 4: Scaffold corrupts the file AND exits 0
**What goes wrong:** The current bug corrupts the file silently. A future regression should be caught by the script itself.
**Why it happens:** `writeFileSync` always succeeds if the path is writable; there is no post-write validation.
**How to avoid:** After writing, verify the file can be parsed — at minimum confirm the two anchors (`const supportedLocales:` and `const configKeys = [`) still appear in the output and the new slug appears in both. A basic sanity check is sufficient; full TypeScript compilation is not required from within scaffold.
**Warning signs:** The workaround `git checkout -- generate-locale-questions.ts` is still needed.

## Code Examples

### Current buggy brace scan (what to replace)
```typescript
// Source: scaffold-collection.ts lines 379–403 (current buggy code)
// Problem: starts scanning from 'const supportedLocales:' which includes
// the type annotation braces { default?: LocaleConfig; [key: string]: unknown }
// before the object literal's own { is reached.

let braceDepth = 0;
let inObject = false;
let objectClosePos = -1;

for (let i = supportedLocalesStart; i < content.length; i++) {
  if (content[i] === '{') {
    braceDepth++;
    inObject = true;
  } else if (content[i] === '}' && inObject) {
    braceDepth--;
    if (braceDepth === 0) {
      objectClosePos = i;  // BUG: this fires on the type annotation's closing brace
      break;
    }
  }
}
```

### Corrected approach: start from `= {`
```typescript
// Source: direct analysis of generate-locale-questions.ts line 101
// The declaration is:
//   const supportedLocales: Record<string, () => Promise<{ ... }>> = {
// The type annotation closes at ">>" before "= {".
// Starting the scan from "= {" skips all type-annotation braces.

const supportedLocalesStart = content.indexOf('const supportedLocales:');
if (supportedLocalesStart === -1) {
  console.error('Error: Could not find `const supportedLocales:` in generate-locale-questions.ts');
  process.exit(1);
}

// Find the object literal open brace, skipping the type annotation
const assignmentPos = content.indexOf(' = {', supportedLocalesStart);
if (assignmentPos === -1) {
  console.error('Error: Could not find ` = {` assignment for supportedLocales');
  process.exit(1);
}
const objectOpenPos = assignmentPos + 3; // position of '{'

// Now scan from the actual object open brace — depth starts at 0
let braceDepth = 0;
let objectClosePos = -1;

for (let i = objectOpenPos; i < content.length; i++) {
  if (content[i] === '{') {
    braceDepth++;
  } else if (content[i] === '}') {
    braceDepth--;
    if (braceDepth === 0) {
      objectClosePos = i;
      break;
    }
  }
}
```

### Verification after scaffold (post-fix smoke test)
```bash
# Run from backend/ directory
# 1. Note current hash of generate-locale-questions.ts
BEFORE=$(sha256sum src/scripts/content-generation/generate-locale-questions.ts)

# 2. Scaffold a test collection (use a throwaway slug)
npx tsx src/scripts/scaffold-collection.ts \
  --name "Test City, TX" \
  --slug test-city-tx \
  --prefix tct \
  --theme "#123456"

# 3. Verify the file changed in ONLY the expected ways
#    (new locale entry present, no corruption of existing lines)
git diff src/scripts/content-generation/generate-locale-questions.ts

# 4. Verify the new entry appears in both insertion sites
grep "test-city-tx" src/scripts/content-generation/generate-locale-questions.ts
grep "testCityTxConfig" src/scripts/content-generation/generate-locale-questions.ts

# 5. Clean up test scaffold artifacts (do not commit them)
git checkout -- src/scripts/content-generation/generate-locale-questions.ts
git checkout -- src/db/seed/collections.ts
rm src/scripts/content-generation/locale-configs/test-city-tx.ts
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual registration (add locale to supportedLocales and configKeys by hand) | `scaffold-collection.ts` step3 automates registration | Added in earlier phase | Automation is correct goal; implementation has one bug in brace scanning start position |

**Deprecated/outdated:**
- Post-scaffold workaround `git checkout -- generate-locale-questions.ts`: Documented in MEMORY.md and collection creation flow. Remove from all documentation once fixed.

## Open Questions

1. **Does `configKeys` insertion have its own subtle issue?**
   - What we know: The configKeys array is single-line, `[` counting starts from `const configKeys = [`, and there are no generic type parameters to confuse it. The insertion adds `, 'newConfig'` before `]`.
   - What's unclear: Whether the resulting single line grows to an unwieldy length. Currently 9 entries; adding one more is fine for the near term.
   - Recommendation: Verify the configKeys insertion produces valid output in the verification step. No change needed unless a problem is found.

2. **Should scaffold emit a post-write sanity check?**
   - What we know: The current script has no validation of its own writes.
   - What's unclear: Whether adding `readFileSync` + grep for the new slug after writing is worth the complexity.
   - Recommendation: Add a lightweight post-write check — read the file back, assert the new slug appears in both insertion locations, exit with error if not. This is a 5-line guard that catches any future regression immediately.

## Sources

### Primary (HIGH confidence)
- Direct source code inspection: `backend/src/scripts/scaffold-collection.ts` (full file, lines 354–441 for step3RegisterLocale)
- Direct source code inspection: `backend/src/scripts/content-generation/generate-locale-questions.ts` (lines 101–126 for supportedLocales/configKeys structure)
- Project MEMORY.md: "Scaffold Bug 2 (known): step3 inserts into type annotation line — revert generate-locale-questions.ts to HEAD"

### Secondary (MEDIUM confidence)
- N/A — no external libraries or ecosystem research required for this fix

### Tertiary (LOW confidence)
- N/A

## Metadata

**Confidence breakdown:**
- Bug root cause: HIGH — directly verified by reading both source files; the brace scanner starting position relative to the type annotation is unambiguous
- Fix approach: HIGH — the `= {` anchor approach is straightforward and directly addresses the root cause
- Pitfalls: HIGH — all pitfalls derived from direct code inspection, not speculation
- Verification steps: HIGH — derived from the git-based workaround already in use

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable internal codebase; valid until either file is refactored)
