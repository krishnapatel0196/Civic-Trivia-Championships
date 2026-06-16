/**
 * Source diversity tracking with adaptive caps for generation pipeline.
 * 15% soft cap (warning, not blocking) with adaptive scaling for source-poor locales.
 */

export class SourceTracker {
  private sourceCounts: Map<string, number>;
  private totalQuestions: number;

  constructor(existingQuestions: Array<{ source: { name: string; url: string } }>) {
    this.sourceCounts = new Map();
    this.totalQuestions = existingQuestions.length;

    // Count existing source usage by domain
    for (const q of existingQuestions) {
      const sourceKey = this.getSourceKey(q.source);
      this.sourceCounts.set(sourceKey, (this.sourceCounts.get(sourceKey) || 0) + 1);
    }
  }

  /**
   * Extract hostname from URL, remove www. prefix.
   * Falls back to full URL if parsing fails.
   */
  private getSourceKey(source: { name: string; url: string }): string {
    try {
      const url = new URL(source.url);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return source.url; // Fallback to full URL if parsing fails
    }
  }

  /**
   * Check if this source is within diversity cap.
   * Returns { allowed: true } with optional warning if cap exceeded.
   * Per CONTEXT.md: 15% is a SOFT WARNING, not a hard block.
   */
  checkSource(source: { name: string; url: string }): { allowed: boolean; warning?: string } {
    const sourceKey = this.getSourceKey(source);
    const currentCount = this.sourceCounts.get(sourceKey) || 0;
    const currentPercentage = this.totalQuestions > 0 ? currentCount / this.totalQuestions : 0;

    const adaptiveCap = this.getAdaptiveCap();

    if (currentPercentage >= adaptiveCap) {
      return {
        allowed: true, // Soft warning - always return allowed
        warning: `Source "${sourceKey}" at ${(currentPercentage * 100).toFixed(1)}% (${currentCount}/${
          this.totalQuestions
        }), exceeds ${(adaptiveCap * 100).toFixed(0)}% cap`,
      };
    }

    return { allowed: true };
  }

  /**
   * Adaptive cap: scale based on number of unique source domains
   * - 5+ unique sources: 0.15 (15% standard)
   * - 4 unique sources: 0.20 (20%)
   * - 3 or fewer: 0.25 (25%)
   */
  private getAdaptiveCap(): number {
    const uniqueSources = this.sourceCounts.size;
    if (uniqueSources >= 5) return 0.15;
    if (uniqueSources === 4) return 0.20;
    return 0.25;
  }

  /**
   * Record that a new question used this source
   */
  recordSource(source: { name: string; url: string }): void {
    const sourceKey = this.getSourceKey(source);
    this.sourceCounts.set(sourceKey, (this.sourceCounts.get(sourceKey) || 0) + 1);
    this.totalQuestions++;
  }

  /**
   * Get source diversity summary for reporting
   * Returns array sorted by count descending
   */
  getSummary(): Array<{ sourceKey: string; count: number; percentage: number }> {
    return Array.from(this.sourceCounts.entries())
      .map(([sourceKey, count]) => ({
        sourceKey,
        count,
        percentage: this.totalQuestions > 0 ? count / this.totalQuestions : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }
}
