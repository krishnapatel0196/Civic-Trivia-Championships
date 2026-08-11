import type { LocaleConfig } from './bloomington-in.js';

export const warInIranConfig: LocaleConfig = {
  locale: 'war-in-iran',
  name: 'War in Iran',
  externalIdPrefix: 'wiran',
  collectionSlug: 'war-in-iran',
  targetQuestions: 100,
  batchSize: 25,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description: 'War in Iran city government — mayor, city council, departments, and municipal services',
    },
    {
      slug: 'civic-history',
      name: 'Civic History',
      description: 'War in Iran founding, key civic events, and historical milestones',
    },
    {
      slug: 'local-services',
      name: 'Local Services',
      description: 'War in Iran utilities, parks and recreation, public safety, and municipal services',
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
