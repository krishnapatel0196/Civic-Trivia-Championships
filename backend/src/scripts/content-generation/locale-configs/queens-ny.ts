import type { LocaleConfig } from './bloomington-in.js';

/**
 * Queens, NY locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - Queens is a BOROUGH of New York City, not an independent city. There is no
 *   Queens mayor or Queens city council — civic authority flows through the NYC
 *   Mayor, NYC City Council (13 districts in Queens: Districts 20–32), and the
 *   Queens Borough President.
 * - Do NOT attribute NYC-wide services to "Queens" as if Queens runs them
 *   independently. Frame as "Queens residents are served by..." or "NYC's..."
 * - Do NOT confuse the Borough President role with a mayor. The BP is an advocate
 *   and land-use reviewer, not an executive with independent budget authority.
 * - Queens County and Queens Borough are coextensive — same geographic area.
 * - Queens Public Library is a SEPARATE system from the NYC Public Library (NYPL).
 *   NYPL serves Manhattan, Bronx, and Staten Island. Brooklyn Public Library is
 *   also separate. Do not conflate them.
 * - LaGuardia Airport is in Queens (East Elmhurst). JFK is in Queens (Jamaica).
 *   Do NOT say they are in "New York City" without specifying Queens.
 * - Flushing Meadows–Corona Park hosted the 1939 AND 1964 World's Fairs — both.
 *   Don't write a question implying only one was held there.
 * - Citi Field replaced Shea Stadium (demolished 2009) — don't conflate them.
 * - ALL officeholder questions MUST have expiresAt set.
 * - No addresses or phone numbers in answer options (quality rule).
 *
 * CURRENT OFFICEHOLDERS (verified 2026-03-24):
 * - Borough President: Donovan Richards Jr. (term ends 2030-01-01)
 * - District Attorney: Melinda Katz (term ends 2028-01-01)
 * - NYC Council Districts 20–32 serve Queens (13 districts, 12 Dem + 1 Rep)
 * - State Senate Districts 12–17 cover Queens
 * - State Assembly Districts 22–37 cover Queens
 *
 * CONTENT CAPS:
 * - Max 1 question per officeholder (strict rule)
 * - Cap airport questions at 6 total (3 per airport)
 * - Cap World's Fair questions at 5 total
 */
export const queensNyConfig: LocaleConfig = {
  locale: 'queens-ny',
  name: 'Queens, NY',
  externalIdPrefix: 'queny',
  collectionSlug: 'queens-ny',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'borough-government',
      name: 'Borough Government',
      description:
        'Queens borough and NYC government as it applies to Queens residents. Cover: the Borough President role (advocate, land use review, budget advisory — NOT a mayor), Queens District Attorney, the 13 NYC City Council districts in Queens (Districts 20–32), NYC Mayor as the chief executive serving all five boroughs, Queens Community Boards (14 boards, advisory role on land use and zoning), and the Queens Borough Hall location in Kew Gardens. Write structural questions about how Queens fits into NYC government (home rule, borough system, city charter). Do NOT write questions implying Queens has its own mayor or independent city government. Include: Donovan Richards Jr. (Borough President, term ends 2030), Melinda Katz (District Attorney, term ends 2028).',
    },
    {
      slug: 'founding-history',
      name: 'Founding & History',
      description:
        'Queens colonial and civic history. Key facts: Queens County established 1683 by royal charter, named for Queen Catherine of Braganza (consort of Charles II). First European settlement by Dutch near Flushing Bay in 1636. Flushing (1645), Jamaica (1656), Newtown (1642) among earliest settlements. Queens became a NYC borough January 1, 1898. Jamaica was original name "Yameco" (Lenape). Queensboro Bridge completed 1909, formally renamed Ed Koch Queensboro Bridge in 2011. Queens is largest NYC borough by area (108+ square miles). If Queens were an independent city, its 2.4M population would make it the 4th-largest city in the US. Avoid over-weighting colonial detail — keep it civic-relevant.',
    },
    {
      slug: 'landmarks-culture',
      name: 'Landmarks & Culture',
      description:
        'Queens iconic landmarks, cultural institutions, and what makes the borough visually and culturally distinctive. Key landmarks: Flushing Meadows–Corona Park (site of 1939 and 1964 World\'s Fairs; home of the Unisphere), Queens Museum (founded 1972; houses the Panorama of NYC model), USTA Billie Jean King National Tennis Center (home of US Open since 1978; Arthur Ashe Stadium capacity 23,200 — world\'s largest tennis stadium), Kaufman Astoria Studios (founded 1920 by Famous Players–Lasky; went silent-era → military use → modern studio), Socrates Sculpture Park (waterfront art space), Queens County Farm Museum (47-acre working farm in Glen Oaks, origins 1697). Cover the Unisphere specifically: built for 1964 World\'s Fair, represents world peace. Cap World\'s Fair questions at 5.',
    },
    {
      slug: 'diversity-immigration',
      name: 'Diversity & Immigration',
      description:
        'Queens\' identity as the world\'s most linguistically diverse place — and the civic infrastructure that supports it. Key facts: 138+ languages spoken in the borough (as of 2000 census data); ranked most diverse urban area in the world. 47% of residents foreign-born (2024). Queens Public Library serves immigrants with collections in 200+ languages — first U.S. public library to provide comprehensive new-American programs (1977). Queens has the largest Asian American population by county outside the Western U.S. Key neighborhoods by heritage: Flushing (Chinese and Korean), Jackson Heights (South Asian, Colombian), Astoria (Greek, Middle Eastern), Jamaica (Caribbean and African American). NYC\'s second Chinatown is in Flushing. Do NOT conflate neighborhood identity with borough government.',
    },
    {
      slug: 'sports-airports',
      name: 'Sports & Airports',
      description:
        'Queens sports venues and the two major airports. New York Mets: play at Citi Field (opened April 13, 2009; replaced Shea Stadium; cost $850M; designed by Populous; naming rights Citigroup at $20M/year). US Open tennis: held annually at USTA Billie Jean King National Tennis Center in Flushing Meadows since 1978 (previously at West Side Tennis Club in Forest Hills, also in Queens). LaGuardia Airport: opened October 15, 1939; named for Mayor Fiorello La Guardia after his death in 1947. JFK Airport: originally Idlewild Airport; renamed December 24, 1963, one month after President Kennedy\'s assassination; renamed by Mayor Robert F. Wagner Jr. Aqueduct Racetrack in South Ozone Park. Cap airport questions at 6 total.',
    },
    {
      slug: 'local-services',
      name: 'Local Services & Infrastructure',
      description:
        'Public services and infrastructure in Queens. Queens Public Library: founded 1896, 66 branch locations, independent from NYPL, serves ~2.3 million residents, collections in 200+ languages. Transportation: Queens is a major transit hub — Jamaica Center connects J/Z/E/AirTrain JFK (AirTrain opened 2003). Two subway lines serve the borough extensively. The Long Island Rail Road (LIRR) serves commuters from multiple Queens stations. Community Boards (14 in Queens) review land use, zoning applications, and make budget recommendations to the Borough President and City Council. Include questions about the borough\'s role in NYC\'s water, sanitation, and parks systems. NYC Parks operates Flushing Meadows–Corona Park (1,255 acres — NYC\'s fourth-largest park).',
    },
    {
      slug: 'state-federal',
      name: 'State & Federal Representation',
      description:
        'Queens\' representation in state and federal government. New York State Senate Districts 12–17 cover Queens: Michael Gianaris (SD-12, retiring 2026), Jessica Ramos (SD-13), Leroy Comrie (SD-14), Joseph P. Addabbo Jr. (SD-15), John C. Liu (SD-16), Stephen T. Chan (SD-17, Republican). State Assembly Districts 22–37 cover Queens. Notable: Michael Gianaris has served 25+ years in state office (Assembly + Senate), is Deputy Majority Leader, and announced retirement in 2026. Queens has historically produced prominent federal figures. Do NOT write questions about federal officials unless they are specifically from Queens or represent Queens districts. Cap this topic and avoid duplicating borough-government content.',
    },
  ],

  topicDistribution: {
    'borough-government': 22,
    'founding-history': 16,
    'landmarks-culture': 20,
    'diversity-immigration': 15,
    'sports-airports': 18,
    'local-services': 14,
    'state-federal': 15,
  },

  officeholders: [
    {
      name: 'Donovan Richards Jr.',
      role: 'Queens Borough President',
      termEnd: '2030-01-01T00:00:00Z',
    },
    {
      name: 'Melinda Katz',
      role: 'Queens District Attorney',
      termEnd: '2028-01-01T00:00:00Z',
    },
    {
      name: 'Michael Gianaris',
      role: 'New York State Senator, District 12',
      termEnd: '2026-12-31T00:00:00Z',
    },
    {
      name: 'Jessica Ramos',
      role: 'New York State Senator, District 13',
      termEnd: '2028-12-31T00:00:00Z',
    },
    {
      name: 'Leroy Comrie',
      role: 'New York State Senator, District 14',
      termEnd: '2028-12-31T00:00:00Z',
    },
    {
      name: 'Joseph P. Addabbo Jr.',
      role: 'New York State Senator, District 15',
      termEnd: '2028-12-31T00:00:00Z',
    },
    {
      name: 'John C. Liu',
      role: 'New York State Senator, District 16',
      termEnd: '2028-12-31T00:00:00Z',
    },
    {
      name: 'Stephen T. Chan',
      role: 'New York State Senator, District 17',
      termEnd: '2028-12-31T00:00:00Z',
    },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Queens',
    'https://en.wikipedia.org/wiki/Flushing_Meadows%E2%80%93Corona_Park',
    'https://en.wikipedia.org/wiki/Kaufman_Astoria_Studios',
    'https://en.wikipedia.org/wiki/USTA_Billie_Jean_King_National_Tennis_Center',
    'https://en.wikipedia.org/wiki/Citi_Field',
    'https://en.wikipedia.org/wiki/LaGuardia_Airport',
    'https://en.wikipedia.org/wiki/John_F._Kennedy_International_Airport',
    'https://en.wikipedia.org/wiki/Ed_Koch_Queensboro_Bridge',
    'https://en.wikipedia.org/wiki/Queens_Museum',
    'https://en.wikipedia.org/wiki/Queens_County_Farm_Museum',
    'https://en.wikipedia.org/wiki/Jamaica,_Queens',
    'https://en.wikipedia.org/wiki/Queens_Public_Library',
  ],
};
