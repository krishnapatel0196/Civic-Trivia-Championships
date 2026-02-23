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
    this.dataDir = path.join(process.cwd(), 'backend', 'src', 'data');
  }

  /**
   * Remove archived questions from JSON source files
   */
  syncAfterArchive(archivedExternalIds: string[]): SyncSummary[] {
    const summaries: SyncSummary[] = [];
    const archivedSet = new Set(archivedExternalIds);

    // Process each JSON file
    const jsonFiles = Object.values(COLLECTION_TO_FILE_MAP);
    for (const fileName of jsonFiles) {
      const filePath = path.join(this.dataDir, fileName);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        continue;
      }

      // Read and parse
      const raw = fs.readFileSync(filePath, 'utf-8');
      const questionsArray = JSON.parse(raw);

      // Filter out archived questions
      const originalCount = questionsArray.length;
      const filtered = questionsArray.filter(
        (q: any) => !archivedSet.has(q.id)
      );
      const removedCount = originalCount - filtered.length;

      // Only write back if changes were made
      if (removedCount > 0) {
        const formatted = JSON.stringify(filtered, null, 2) + '\n';
        fs.writeFileSync(filePath, formatted, 'utf-8');

        summaries.push({
          file: fileName,
          removed: removedCount,
          remaining: filtered.length,
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

      // Read existing file
      let existingQuestions: any[] = [];
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        existingQuestions = JSON.parse(raw);
      }

      // Merge new questions (avoid duplicates)
      const existingIds = new Set(existingQuestions.map((q: any) => q.id));
      const toAdd = newQuestions.filter(q => !existingIds.has(q.id));

      if (toAdd.length > 0) {
        const merged = [...existingQuestions, ...toAdd];
        const formatted = JSON.stringify(merged, null, 2) + '\n';
        fs.writeFileSync(filePath, formatted, 'utf-8');

        summaries.push({
          file: fileName,
          added: toAdd.length,
          remaining: merged.length,
        });
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
