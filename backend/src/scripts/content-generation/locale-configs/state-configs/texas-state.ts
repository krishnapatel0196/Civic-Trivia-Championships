import type { LocaleConfig } from './bloomington-in.js';

export const texasStateConfig: LocaleConfig = {
  locale: 'texas-state',
  name: 'Texas',
  externalIdPrefix: 'tex',
  collectionSlug: 'texas-state',
  targetQuestions: 100,
  batchSize: 25,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description: 'Texas city government — mayor, city council, departments, and municipal services',
    },
    {
      slug: 'civic-history',
      name: 'Civic History',
      description: 'Texas founding, key civic events, and historical milestones',
    },
    {
      slug: 'local-services',
      name: 'Local Services',
      description: 'Texas utilities, parks and recreation, public safety, and municipal services',
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
