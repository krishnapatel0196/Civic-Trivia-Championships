import type { LocaleConfig } from './bloomington-in.js';

export const cambridgeMaConfig: LocaleConfig = {
  locale: 'cambridge-ma',
  name: 'Cambridge, MA',
  externalIdPrefix: 'cam',
  collectionSlug: 'cambridge-ma',
  targetQuestions: 100,
  batchSize: 25,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description: 'Cambridge, MA city government — mayor, city council, departments, and municipal services',
    },
    {
      slug: 'civic-history',
      name: 'Civic History',
      description: 'Cambridge, MA founding, key civic events, and historical milestones',
    },
    {
      slug: 'local-services',
      name: 'Local Services',
      description: 'Cambridge, MA utilities, parks and recreation, public safety, and municipal services',
    },
  ],

  // Target question counts per topic (sums to 100)
  topicDistribution: {
    'city-government': 40,
    'civic-history': 30,
    'local-services': 30,
  },

  // TODO: Add authoritative source URLs for RAG — fetched and parsed before generation
  sourceUrls: [],
};
