import type { LocaleConfig } from './bloomington-in.js';

/**
 * Plano, TX locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - Council-Manager form of government: City Manager (appointed) = chief executive; Mayor (elected) = presides over council
 * - Mayor John B. Muns: re-elected May 3, 2025, second term through 2029
 * - City Manager Mark Israelson: appointed May 2019, no fixed term — prefer structural questions
 * - 8 council places total (Mayor + 7 members), all at-large, four-year staggered terms, two-term limit
 * - Balloon Capital of Texas designated 1980 by Governor Bill Clements
 * - Companies are civic facts only — no brand promotion
 *
 * ELECTION SCHEDULE:
 * - Council odd-year elections: Places 2/4/6/8 on 2023 cycle (next 2027); Places 1/3/5/7 on 2025 cycle (next 2029)
 * - Mayor: 4-year term, expiresAt "2029-05-01T00:00:00Z"
 * - City Manager: no fixed term, prefer structural questions
 */
export const planoTxConfig: LocaleConfig = {
  locale: 'plano-tx',
  name: 'Plano, TX',
  externalIdPrefix: 'pla',
  collectionSlug: 'plano-tx',
  targetQuestions: 100,
  batchSize: 25,
  overshootFactor: 1.3,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description: 'Plano city government — council-manager structure, Mayor, 7-member City Council, City Manager, departments, and municipal services. Mayor and council serve staggered four-year terms, elected at-large.',
    },
    {
      slug: 'civic-history',
      name: 'Civic History',
      description: 'Plano founding (Peters Colony, 1840s), naming (Spanish "flat", 1852), incorporation (1873), Houston and Texas Central Railway (1872), 1881 fire, Balloon Capital of Texas designation (1980), Interurban Railway Museum.',
    },
    {
      slug: 'growth-story',
      name: 'Growth & Development',
      description: "Plano's arc from cotton-farming community to Sun Belt boomtown — population explosion (17,872 in 1970 to 128,713 in 1990), city planning decisions, infrastructure expansion, land use transitions from farmland to suburbs.",
    },
    {
      slug: 'economic-development',
      name: 'Economic Development',
      description: 'Civic economic development story — Frito-Lay HQ relocation (1985), JCPenney HQ move from NYC (1992), Toyota North American HQ relocation from Torrance CA (2017), Legacy West as city-planned mixed-use development. Civic angles: zoning, economic agreements, city planning decisions.',
    },
    {
      slug: 'community-identity',
      name: 'Community & Demographics',
      description: "Plano's demographic evolution — Asian American and South Asian community (largest Asian ethnic group: Asian Indian), Plano ISD civic role and academic reputation, demographic change as part of city's growth story. Represent the whole city.",
    },
  ],

  topicDistribution: {
    'city-government': 30,
    'civic-history': 25,
    'growth-story': 20,
    'economic-development': 15,
    'community-identity': 10,
  },

  sourceUrls: [
    'https://www.plano.gov/',
    'https://www.plano.gov/27/Government',
    'https://www.plano.gov/1345/Mayor-and-City-Council',
    'https://www.plano.gov/1348/Your-Mayor-and-City-Council-Members',
    'https://www.plano.gov/1317/City-Manager-Mark-Israelson',
    'https://www.plano.gov/1292/City-Management',
    'https://www.plano.gov/1797/City-of-Plano-History',
    'https://www.planotexas.org/192/The-Plano-Story',
    'https://www.planotomorrow.org/148/The-Plano-Story',
    'https://www.planoballoonfest.org/p/about',
    'https://en.wikipedia.org/wiki/Plano,_Texas',
    'https://en.wikipedia.org/wiki/Plano_Balloon_Festival',
    'https://www.tshaonline.org/handbook/entries/plano-tx',
    'https://interurbanrailwaymuseum.org/mission',
    'https://www.collincountytx.gov/Government',
  ],
};
