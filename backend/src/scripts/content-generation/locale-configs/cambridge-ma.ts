import type { LocaleConfig } from './bloomington-in.js';

/**
 * Cambridge, MA locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES (corrections from research):
 * - Cambridge City Hall is Richardsonian Romanesque (1888), NOT neoclassical
 * - Living wage ordinance passed May 1999, NOT 1998; Cambridge was NOT the first US city (Baltimore was first, 1994)
 * - Plan E PR story: voters REJECTED Plan E in 1938, APPROVED it in 1940, first election 1941
 * - Mayor = presiding officer of City Council (not chief executive); City Manager = chief executive (appointed)
 *
 * ELECTION SCHEDULE:
 * - City Council: 2-year terms, odd-year elections (November 2025 → terms end January 2028)
 * - Mayor: elected by City Councillors after each election → expiresAt "2028-01-01T00:00:00Z"
 * - City Manager (Yi-An Huang, appointed 2023): no fixed term — prefer structural questions
 */
export const cambridgeMaConfig: LocaleConfig = {
  locale: 'cambridge-ma',
  name: 'Cambridge, MA',
  externalIdPrefix: 'cam',
  collectionSlug: 'cambridge-ma',
  targetQuestions: 100,
  batchSize: 25,
  overshootFactor: 1.3,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description: 'Cambridge city government — Plan E City Manager charter, 9-member at-large City Council, Council-elected Mayor, city departments, and municipal services',
    },
    {
      slug: 'civic-history',
      name: 'Civic History',
      description: 'Cambridge founding (1630), colonial history, incorporation as a city (1846), four original villages, Cambridge City Hall (1888 Richardsonian Romanesque), and civic milestones',
    },
    {
      slug: 'elections-voting',
      name: 'Elections & Voting',
      description: 'Cambridge proportional representation/ranked-choice voting system — Plan E adoption (1940), two-year terms, at-large elections, how PR quota works, election schedule',
    },
    {
      slug: 'civic-firsts-policy',
      name: 'Civic Firsts & Policy',
      description: 'Cambridge civic innovations: living wage ordinance (1999), Affordable Housing Overlay, zoning history (first ordinance 1924), DNA research moratorium (1976), same-sex marriage licenses (2004)',
    },
    {
      slug: 'neighborhoods-community',
      name: 'Neighborhoods & Community',
      description: 'East Cambridge, Cambridgeport, North Cambridge, Inman Square — Portuguese and Azorean community history, Haitian community, working families, housing advocacy, civic activists',
    },
    {
      slug: 'schools-libraries',
      name: 'Schools & Libraries',
      description: 'Cambridge Public Schools, Cambridge Rindge and Latin School (CRLS), Cambridge Public Library — civic roles and history',
    },
  ],

  topicDistribution: {
    'city-government': 30,
    'civic-history': 25,
    'elections-voting': 15,
    'civic-firsts-policy': 15,
    'neighborhoods-community': 10,
    'schools-libraries': 5,
  },

  sourceUrls: [
    'https://www.cambridgema.gov/',
    'https://www.cambridgema.gov/departments/citycouncil',
    'https://www.cambridgema.gov/Departments/citymanagersoffice',
    'https://www.cambridgema.gov/departments/mayorsoffice',
    'https://www.cambridgema.gov/departments/electioncommission/cambridgemunicipalelections',
    'https://www.cambridgema.gov/historic/cambridgehistory',
    'https://www.cambridgema.gov/historic/cambridgehistory/elevenfacts',
    'https://www.cambridgema.gov/Departments/Purchasing/Publications/livingwageordinance',
    'https://www.cambridgema.gov/CDD',
    'https://www.cambridgema.gov/Departments/electioncommission',
    'https://www.cambridgema.gov/historic',
    'https://www.cambridgeday.com',
    'https://www.wbur.org',
    'https://crls.cpsd.us/about_crls/school_history',
    'https://historycambridge.org',
    'https://en.wikipedia.org/wiki/Cambridge,_Massachusetts',
    'https://en.wikipedia.org/wiki/Cambridge_City_Hall_(Massachusetts)',
  ],
};
