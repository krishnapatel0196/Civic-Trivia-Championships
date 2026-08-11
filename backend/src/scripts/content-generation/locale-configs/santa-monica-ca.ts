import type { LocaleConfig } from './bloomington-in.js';

/**
 * Santa Monica, CA locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - Santa Monica is its own independent city -- NOT part of Los Angeles city government
 *   - Use SMPD (Santa Monica Police Department), NOT LAPD
 *   - Use SMMUSD (Santa Monica-Malibu Unified School District), NOT LAUSD
 *   - Use Big Blue Bus (city transit), NOT LA Metro / LACMTA
 *   - SM city council is at-large -- NOT LA City Council districts
 * - Mayor is elected annually by City Council members, NOT directly by voters
 * - City Attorney and City Clerk are separately elected positions (notable civic fact)
 * - Route 66 western terminus: Santa Monica -- the pier sign is the cultural endpoint
 * - Questions must reflect governance and civic identity, NOT tourist beach trivia
 * - LA appears only as geographic context ("in LA County"); do not attribute county government to city
 * - ALL officeholder questions MUST have expiresAt -- verify termEnd dates during curation
 * - No addresses or phone numbers in answer options (quality rule)
 * - Verify state legislators (AD-51 / SD-26) district coverage before activation
 *
 * CURRENT OFFICEHOLDERS:
 * - Mayor: Caroline Torosis (term ends 2026-12-01)
 * - Mayor Pro Tem / Council: Jesse Zwick (term ends 2026-12-01)
 * - Council Member: Lana Negrete (term ends 2026-12-01)
 * - Council Member: Ellis Raskin (term ends 2028-12-01)
 * - City Attorney: Douglas Sloan (term ends 2026-12-01 -- VERIFY on smgov.net during curation)
 * - CA Assembly AD-51: Rick Chavez Zbur (term ends 2026-12-07)
 * - CA Senate SD-26: Maria Elena Durazo (term ends 2026-12-07)
 */
export const santaMonicaCaConfig: LocaleConfig = {
  locale: 'santa-monica-ca',
  name: 'Santa Monica, CA',
  externalIdPrefix: 'smo',
  collectionSlug: 'santa-monica-ca',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description:
        "Santa Monica council-manager government. 7-member at-large City Council, staggered 4-year terms. Mayor elected annually by council (NOT directly by voters). City Manager appointed by council. City Attorney and City Clerk are separately elected positions. ALL officeholder questions MUST have expiresAt. Current officeholders listed in officeholders array above. Mix of structure questions (durable) and current-officeholder questions (expiring).",
    },
    {
      slug: 'civic-history',
      name: 'Civic History',
      description:
        "Incorporated November 30, 1886. Named after Saint Monica. Originally Rancho San Vicente y Santa Monica land grant. John P. Jones laid out town 1875. Annexation by LA refused -- Santa Monica remained independent (this is a key civic fact). 1984 Olympic marathon finish line. 2028 Olympic venues planned. Tongva indigenous territory (original inhabitants).",
    },
    {
      slug: 'landmarks-culture',
      name: 'Landmarks & Culture',
      description:
        "Santa Monica Pier (opened 1909, owned/operated by City of SM, western Route 66 terminus, Pacific Park amusement park, SM Pier Aquarium). Third Street Promenade (pedestrian shopping district). Palisades Park (bluffs overlooking ocean). Santa Monica Place (mall). Civic Auditorium. Bergamot Station arts complex (former Red Car terminus). Questions should reflect civic/cultural significance, NOT tourist trivia.",
    },
    {
      slug: 'local-services',
      name: 'Local Services',
      description:
        "SMPD (Santa Monica Police Department -- independent from LAPD). Big Blue Bus (city-operated transit -- NOT LA Metro/LACMTA). SMFD (Santa Monica Fire Department). SM Public Library system. Santa Monica Airport (closed, converting to park -- Great Park). Heal the Bay (environmental nonprofit headquartered in SM).",
    },
    {
      slug: 'economy-development',
      name: 'Economy & Development',
      description:
        "Silicon Beach tech hub (major tech companies located in SM). Tourism/hospitality industry. Rent control (strong since 1979, one of the earliest and most protective in California). Third Street Promenade retail district. Major employers. Development and zoning history.",
    },
    {
      slug: 'community-environment',
      name: 'Community & Environment',
      description:
        "Santa Monica Bay and beach environment. Heal the Bay water quality monitoring. Sustainable City Plan (SM has been a sustainability leader since the 1990s). SMMUSD (Santa Monica-Malibu Unified School District -- NOT LAUSD). LGBTQ+ community. Tongva indigenous heritage. Environmental initiatives and climate action.",
    },
  ],

  // Target question percentages per topic (sums to 100)
  topicDistribution: {
    'city-government': 22,
    'civic-history': 18,
    'landmarks-culture': 18,
    'local-services': 15,
    'economy-development': 15,
    'community-environment': 12,
  },

  officeholders: [
    { name: 'Caroline Torosis', role: 'Mayor', termEnd: '2026-12-01T00:00:00Z' },
    { name: 'Jesse Zwick', role: 'City Council Member / Mayor Pro Tem', termEnd: '2026-12-01T00:00:00Z' },
    { name: 'Lana Negrete', role: 'City Council Member', termEnd: '2026-12-01T00:00:00Z' },
    { name: 'Ellis Raskin', role: 'City Council Member', termEnd: '2028-12-01T00:00:00Z' },
    { name: 'Douglas Sloan', role: 'City Attorney', termEnd: '2026-12-01T00:00:00Z' },
    { name: 'Rick Chavez Zbur', role: 'California State Assembly Member', district: 'AD-51', termEnd: '2026-12-07T00:00:00Z' },
    { name: 'Maria Elena Durazo', role: 'California State Senator', district: 'SD-26', termEnd: '2026-12-07T00:00:00Z' },
  ],

  // Wikipedia-first source URLs per carry-forward rule (Phase 58-02)
  sourceUrls: [
    'https://en.wikipedia.org/wiki/Santa_Monica,_California',
    'https://en.wikipedia.org/wiki/Santa_Monica_Pier',
    'https://en.wikipedia.org/wiki/Third_Street_Promenade',
    'https://en.wikipedia.org/wiki/Big_Blue_Bus',
    'https://en.wikipedia.org/wiki/Santa_Monica-Malibu_Unified_School_District',
    'https://en.wikipedia.org/wiki/Bergamot_Station',
    'https://en.wikipedia.org/wiki/Santa_Monica_Civic_Auditorium',
    'https://en.wikipedia.org/wiki/Santa_Monica_Airport',
    'https://en.wikipedia.org/wiki/Tongva',
    'https://www.smgov.net/departments/council/content.aspx?id=13705',
  ],
};
