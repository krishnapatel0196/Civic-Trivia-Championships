import type { LocaleConfig } from './bloomington-in.js';

export const planoTxConfig: LocaleConfig = {
  locale: 'plano-tx',
  name: 'Plano, TX',
  externalIdPrefix: 'pla',
  collectionSlug: 'plano-tx',
  targetQuestions: 100,
  batchSize: 25,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description: 'Plano, TX city government — mayor, city council, departments, and municipal services',
    },
    {
      slug: 'civic-history',
      name: 'Civic History',
      description: 'Plano, TX founding, key civic events, and historical milestones',
    },
    {
      slug: 'local-services',
      name: 'Local Services',
      description: 'Plano, TX utilities, parks and recreation, public safety, and municipal services',
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
