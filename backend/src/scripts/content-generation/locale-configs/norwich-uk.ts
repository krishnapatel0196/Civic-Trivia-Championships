import type { LocaleConfig } from './bloomington-in.js';

/**
 * Norwich, England locale configuration for civic trivia question generation.
 * Used by generate-locale-questions.ts to produce the Norwich collection.
 *
 * NOTE: This is the first non-US collection in the system (localeCode: 'en-GB').
 *
 * TWO-TIER GOVERNANCE CONTEXT:
 * Norwich operates under a two-tier local government system:
 * - NORWICH CITY COUNCIL: responsible for housing, planning, leisure, bin collections,
 *   council tax billing, and environmental health.
 * - NORFOLK COUNTY COUNCIL: responsible for roads, schools, education, social care,
 *   libraries, public health, and the fire service.
 * Questions must attribute responsibilities to the correct tier — do not mix them up.
 *
 * LORD MAYOR NOTE:
 * Norwich has a Lord Mayor (ceremonial role), NOT an elected executive mayor.
 * Do not confuse with executive mayors in other UK cities (e.g., London, Bristol).
 *
 * TOPIC DISTRIBUTION RATIONALE:
 * 50%+ of questions are dedicated to council mechanics and services per project
 * content strategy. The city-council-mechanics and city-council-services topics
 * together account for 30 of 90 questions (33%), with norfolk-county and
 * elections-democracy adding further civic coverage.
 *
 * ELECTION SCOPE — LOCAL ONLY:
 * Do NOT generate questions about MPs, Westminster, parliamentary constituencies,
 * or by-elections. Stick to Norwich City Council and Norfolk County Council elections.
 * Reason: MP questions expire unpredictably (any by-election can change the seat),
 * and parliamentary terminology is unfamiliar to the primarily US audience.
 * - Norwich City Council: Elections by thirds in three out of four years
 * - Norfolk County Council: Full council elections every four years
 * - Sources: norwich.gov.uk/elections, norfolk.gov.uk
 */
export const norwichConfig: LocaleConfig = {
  locale: 'norwich-uk',
  name: 'Norwich, England',
  externalIdPrefix: 'nor',
  collectionSlug: 'norwich-uk',
  targetQuestions: 90,
  batchSize: 15, // Smaller batches for topic-based generation — 8 topics, ~2 batches per topic
  overshootFactor: 1.2, // Generate ~108, curate to ~90

  topicCategories: [
    {
      slug: 'city-council-mechanics',
      name: 'City Council Mechanics',
      description: 'Norwich City Council structure, procedures, elections, and wards',
    },
    {
      slug: 'city-council-services',
      name: 'City Council Services',
      description: 'Norwich City Council services: housing, planning, leisure, bin collections, council tax',
    },
    {
      slug: 'civic-history',
      name: 'Civic History',
      description: 'Norwich civic history: medieval charter, notable milestones, past Lord Mayors',
    },
    {
      slug: 'landmarks-institutions',
      name: 'Landmarks & Institutions',
      description: 'Norwich Cathedral, Norwich Castle, Guildhall, Elm Hill, and cultural institutions',
    },
    {
      slug: 'economy-culture',
      name: 'Economy & Culture',
      description: 'Norwich economy, Norwich Market, UEA, Norwich Research Park, creative industries',
    },
    {
      slug: 'norfolk-county',
      name: 'Norfolk County Council',
      description: 'Norfolk County Council responsibilities: roads, schools, social care, libraries',
    },
    {
      slug: 'sports-community',
      name: 'Sports & Community',
      description: 'Norwich City FC, community events, UNESCO City of Literature, City of Sanctuary',
    },
    {
      slug: 'elections-democracy',
      name: 'Elections & Democracy',
      description: 'UK local elections, wards, Norwich City Council voting, voter participation — LOCAL elections only, not parliamentary',
    },
  ],

  // Target question counts per topic (sums to 90)
  // Heavy local government coverage per content strategy (50%+ dedicated to council)
  topicDistribution: {
    'city-council-mechanics': 15,
    'city-council-services': 15,
    'civic-history': 10,
    'landmarks-institutions': 10,
    'economy-culture': 10,
    'norfolk-county': 10, // 80/20 split: ~10 county questions vs 30 city council
    'sports-community': 10,
    'elections-democracy': 10,
  },

  // Authoritative source URLs for RAG — fetched and parsed before generation
  sourceUrls: [
    // Norwich City Council
    'https://www.norwich.gov.uk',
    'https://www.norwich.gov.uk/info/20003/your_council',
    'https://www.norwich.gov.uk/info/20004/councillors_democracy_and_elections',

    // Norfolk County Council
    'https://www.norfolk.gov.uk',
    'https://www.norfolk.gov.uk/what-we-do-and-how-we-work',

    // Reference / History
    'https://en.wikipedia.org/wiki/Norwich',
    'https://en.wikipedia.org/wiki/Norwich_City_Council',
    'https://en.wikipedia.org/wiki/Norfolk_County_Council',

    // Local news and institutions
    'https://www.bbc.co.uk/news/england/norfolk',
    'https://www.cathedral.org.uk',
  ],
};
