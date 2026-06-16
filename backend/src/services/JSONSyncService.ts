/**
 * JSON Sync Service
 * Synchronizes JSON source files after database archival/restore operations
 */

import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { questions, collections, collectionQuestions } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';

export interface SyncSummary {
  file: string;
  removed?: number;
  added?: number;
  remaining: number;
}

const COLLECTION_TO_FILE_MAP: Record<string, string> = {
  'Federal Civics': 'questions.json',
  'Bloomington, IN': 'bloomington-in-questions.json',
  'Los Angeles, CA': 'los-angeles-ca-questions.json',
  'Indiana': 'indiana-state-questions.json',
  'California': 'california-state-questions.json',
  'Fremont, CA': 'fremont-ca-questions.json',
};

export class JSONSyncService {
  private dataDir: string;

  constructor() {
    // Handle both cwd=project-root and cwd=backend/
    const candidateA = path.join(process.cwd(), 'backend', 'src', 'data');
    const candidateB = path.join(process.cwd(), 'src', 'data');
    this.dataDir = fs.existsSync(candidateA) ? candidateA : candidateB;
  }

  /**
   * Remove archived questions from JSON source files.
   * Handles two formats:
   *   - Bare array: questions.json = [{ id, text, ... }, ...]
   *   - Topic-based: locale files = { topics: [{ slug, questions: [{ id, ... }] }] }
   */
  syncAfterArchive(archivedExternalIds: string[]): SyncSummary[] {
    const summaries: SyncSummary[] = [];
    const archivedSet = new Set(archivedExternalIds);

    // Process each JSON file
    const jsonFiles = Object.values(COLLECTION_TO_FILE_MAP);
    for (const fileName of jsonFiles) {
      const filePath = path.join(this.dataDir, fileName);

      if (!fs.existsSync(filePath)) {
        continue;
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);

      let removedCount = 0;
      let remainingCount = 0;

      if (Array.isArray(parsed)) {
        // Bare array format (questions.json)
        const originalCount = parsed.length;
        const filtered = parsed.filter((q: any) => !archivedSet.has(q.id));
        removedCount = originalCount - filtered.length;
        remainingCount = filtered.length;

        if (removedCount > 0) {
          fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2) + '\n', 'utf-8');
        }
      } else if (parsed && parsed.topics && Array.isArray(parsed.topics)) {
        // Topic-based format ({ topics: [{ questions: [...] }] })
        for (const topic of parsed.topics) {
          if (!Array.isArray(topic.questions)) continue;
          const before = topic.questions.length;
          topic.questions = topic.questions.filter((q: any) => !archivedSet.has(q.id));
          removedCount += before - topic.questions.length;
          remainingCount += topic.questions.length;
        }

        if (removedCount > 0) {
          fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');
        }
      }

      if (removedCount > 0) {
        summaries.push({
          file: fileName,
          removed: removedCount,
          remaining: remainingCount,
        });
      }
    }

    return summaries;
  }

  /**
   * Re-add restored questions to JSON source files
   */
  async syncAfterRestore(restoredExternalIds: string[]): Promise<SyncSummary[]> {
    // Query DB for full question records with their collections
    const restoredQuestions = await db
      .select({
        id: questions.id,
        externalId: questions.externalId,
        text: questions.text,
        options: questions.options,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
        difficulty: questions.difficulty,
        topicId: questions.topicId,
        subcategory: questions.subcategory,
        source: questions.source,
        learningContent: questions.learningContent,
        collectionId: collections.id,
        collectionName: collections.name,
      })
      .from(questions)
      .leftJoin(collectionQuestions, eq(questions.id, collectionQuestions.questionId))
      .leftJoin(collections, eq(collectionQuestions.collectionId, collections.id))
      .where(inArray(questions.externalId, restoredExternalIds));

    // Group by collection
    const questionsByCollection = new Map<string, any[]>();
    for (const row of restoredQuestions) {
      const collectionName = row.collectionName;
      if (!collectionName) continue;

      if (!questionsByCollection.has(collectionName)) {
        questionsByCollection.set(collectionName, []);
      }

      // Build question object in JSON file format
      const questionJson = {
        id: row.externalId,
        text: row.text,
        options: row.options,
        correctAnswer: row.correctAnswer,
        explanation: row.explanation,
        difficulty: row.difficulty,
        topic: this.getTopicName(row.topicId),
        topicCategory: row.subcategory,
        source: row.source,
        learningContent: row.learningContent,
      };

      questionsByCollection.get(collectionName)!.push(questionJson);
    }

    // Sync each affected file
    const summaries: SyncSummary[] = [];
    for (const [collectionName, newQuestions] of questionsByCollection.entries()) {
      const fileName = COLLECTION_TO_FILE_MAP[collectionName];
      if (!fileName) {
        console.warn(`No file mapping for collection: ${collectionName}`);
        continue;
      }

      const filePath = path.join(this.dataDir, fileName);

      if (!fs.existsSync(filePath)) continue;

      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        // Bare array format (questions.json)
        const existingIds = new Set(parsed.map((q: any) => q.id));
        const toAdd = newQuestions.filter(q => !existingIds.has(q.id));

        if (toAdd.length > 0) {
          const merged = [...parsed, ...toAdd];
          fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
          summaries.push({ file: fileName, added: toAdd.length, remaining: merged.length });
        }
      } else if (parsed && parsed.topics && Array.isArray(parsed.topics)) {
        // Topic-based format — add to first matching topic or first topic
        const allExistingIds = new Set<string>();
        for (const topic of parsed.topics) {
          if (Array.isArray(topic.questions)) {
            for (const q of topic.questions) allExistingIds.add(q.id);
          }
        }

        const toAdd = newQuestions.filter(q => !allExistingIds.has(q.id));
        if (toAdd.length > 0 && parsed.topics.length > 0) {
          // Add to the first topic (best-effort; questions were removed from somewhere in the file)
          if (!Array.isArray(parsed.topics[0].questions)) parsed.topics[0].questions = [];
          parsed.topics[0].questions.push(...toAdd);
          fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');

          const totalRemaining = parsed.topics.reduce((sum: number, t: any) => sum + (t.questions?.length || 0), 0);
          summaries.push({ file: fileName, added: toAdd.length, remaining: totalRemaining });
        }
      }
    }

    return summaries;
  }

  /**
   * Map topic ID to topic name (helper method)
   * This is a simplified version - in production you might cache this or query once
   */
  private getTopicName(topicId: number): string {
    // Hardcoded mapping based on existing topics
    // In a real implementation, you'd query the topics table or cache this
    const topicMap: Record<number, string> = {
      1: 'Constitution',
      2: 'Government',
      3: 'History',
      4: 'Rights',
      5: 'Symbols',
    };
    return topicMap[topicId] || 'Unknown';
  }
}
