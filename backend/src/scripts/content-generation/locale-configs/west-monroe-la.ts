import type { LocaleConfig } from './bloomington-in.js';

/**
 * West Monroe, LA locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - West Monroe is a SEPARATE city from Monroe — they share the Ouachita River but have
 *   completely distinct governments. Never attribute Monroe city services to West Monroe.
 * - West Monroe is in Ouachita Parish but is governed independently from the parish.
 * - Government form: Mayor-Alderman (Mayor-Council). Legislative body is the Board of Aldermen (5 members, at-large).
 * - There are no wards — aldermen are elected at-large.
 * - Do NOT conflate Duck Commander (the business) with city government.
 * - No addresses or phone numbers in answer options (quality rule).
 *
 * CURRENT OFFICEHOLDERS:
 * - Mayor: Staci Albritton Mitchell (re-elected 2022, took office July 1, 2018; term ends ~2026)
 * - Alderman: James D. "Polk" Brian
 * - Alderman: Morgan Lowe Buxton
 * - Alderman: Thom Hamilton
 * - Alderman: Rodney Welch
 * - Alderman: Ben Westerburg
 * - State Rep District 15: Foy Bryan Gadberry (Republican; elected 2019; term through 2028)
 * - State Senate District 33: Stewart Cathey Jr.
 *
 * EXPIRATION: Mayor and alderman questions → 2026-07-01. State Rep Gadberry → 2028-01-01.
 */
export const westMonroeLaConfig: LocaleConfig = {
  locale: 'west-monroe-la',
  name: 'West Monroe, LA',
  externalIdPrefix: 'wmnla',
  collectionSlug: 'west-monroe-la',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'wmnla-city-government',
      name: 'City Government',
      description: `West Monroe's mayor-alderman form of government. Mayor Staci Albritton Mitchell (re-elected 2022; first female mayor; background in agricultural economics and small business). The Board of Aldermen has 5 at-large members: James "Polk" Brian, Morgan Lowe Buxton, Thom Hamilton, Rodney Welch, Ben Westerburg. Cover: how many aldermen, how they are elected (at-large vs. ward), the mayor's role, city departments, the city's first charter (1889), and municipal services like the city court and utilities department. Do NOT write questions about Monroe's government.`,
    },
    {
      slug: 'wmnla-founding-history',
      name: 'Founding & History',
      description: `West Monroe has been known by three names: Byron (1837, platted by John Campbell), Cotton Port/Cottonport (1854, Dr. Christopher Dabbs), and West Monroe (1883, renamed to avoid postal confusion). The name "West Monroe" was coined by railroad workers. The Vicksburg, Shreveport and Pacific Railroad bridge (1882) transformed the settlement. First charter: 1889 with a Mayor and Board of Trustees. The Endom Bridge (1899) was the first highway bridge connecting Monroe and West Monroe, named for Judge Robert Endom and Mayor Fred Endom. Monroe Gas Field discovered 1916. The Brown Paper Mill opened 1924. Duck Commander founded 1972. Cover the sequence of names, who founded each phase, the railroad's role, the first bridge, and key dates.`,
    },
    {
      slug: 'wmnla-landmarks-culture',
      name: 'Landmarks & Culture',
      description: `Key landmarks: Kiroli Park (150-acre city park with botanical garden, suspension bridge, covered bridge, observation tower, dog park, mountain bike trails, fishing ponds; hosts Northeast Louisiana Celtic Festival first Saturday in October and Christmas at Kiroli; includes "Smiles Park" all-inclusive playground). Antique Alley (5+ blocks of 50+ antique stores in historic downtown; recognized by Southern Living; officially established 1987). Duck Commander headquarters and museum (117 Kings Lane; 10,000 sq. ft.; Phil Robertson founded Duck Commander in 1972; Duck Dynasty ran on A&E 2012–2017; revival announced 2025). Ike Hamilton Expo Center (opened 2002; equestrian and agricultural events). Endom Bridge (historic Ouachita River crossing). Cover specific details about each landmark's size, history, and features.`,
    },
    {
      slug: 'wmnla-economy-industry',
      name: 'Economy & Industry',
      description: `Anchor industries: Graphic Packaging International (the Brown Paper Mill site; opened 1924 as Brown Paper Mill; went through Olin Mathieson Chemicals → Olincraft → Manville Forest Products → Riverwood International → Graphic Packaging). The paper/timber industry dominated 70% of Ouachita Parish's economy in the 1930s. Monroe Gas Field (discovered 1916) was one of the largest natural gas fields in the southeastern US. Lumen Technologies (formerly CenturyLink/CenturyTel) is headquartered in neighboring Monroe and is the largest NYSE-listed company in the metro area. Duck Commander is a major tourism and retail driver. Retail and healthcare are dominant employment sectors today. Do not attribute Lumen/CenturyLink headquarters to West Monroe — it's in Monroe.`,
    },
    {
      slug: 'wmnla-local-services',
      name: 'Local Services',
      description: `West Monroe municipal services: Glenwood Regional Medical Center (278-bed hospital; established 1962; West Monroe's major healthcare facility; Staci Mitchell chairs its board). Kiroli Park as a parks and recreation asset. The city's utility department. Public safety (police and fire). The Ouachita River levee system modernized after the 1927 Great Mississippi Flood. Black Bayou Lake National Wildlife Refuge (5,300 acres; adjacent to the metro; paddling, fishing, birding; American alligator habitat). Ike Hamilton Expo Center as a community facility. Questions should distinguish city-operated services from parish-level or state-level services.`,
    },
    {
      slug: 'wmnla-community-environment',
      name: 'Community & Environment',
      description: `West Monroe sits on the west bank of the Ouachita River, directly across from Monroe — they are known as the "Twin Cities of Northeast Louisiana." Population: 13,103 (2020 census). Area: approximately 7.7 square miles. Second-largest city in Ouachita Parish. The Ouachita River (605 miles) is named for the Ouachita Native American tribe and was historically a steamboat trade route. The Northeast Louisiana Celtic Festival takes place at Kiroli Park (first Saturday in October). "Antique Alley" draws regional shoppers. Duck Dynasty brought international tourism 2012–2017. Cover geography, population, the Twin Cities identity, and the river's role in civic life.`,
    },
    {
      slug: 'wmnla-notable-people',
      name: 'Notable People',
      description: `Notable people born or raised in West Monroe: Bill Russell (born February 12, 1934; NBA Hall of Fame center; Boston Celtics; won 11 NBA championships in 13 seasons; widely considered one of the greatest players ever). Webb Pierce (born August 8, 1921; Country Music Hall of Fame inductee 2001; more #1 hits than any other country artist in the 1950s; pioneered honky-tonk; biggest hit "In the Jailhouse Now" charted 37 weeks in 1955; had his own radio show at age 15). Phil Robertson (founded Duck Commander 1972; Louisiana Tech master's in English; star of Duck Dynasty). Andrew Whitworth (attended West Monroe High School; NFL offensive tackle 16 seasons; Cincinnati Bengals + LA Rams; oldest offensive lineman to win a Super Bowl). Max 1 question per person.`,
    },
  ],

  topicDistribution: {
    'wmnla-city-government': 20,
    'wmnla-founding-history': 15,
    'wmnla-landmarks-culture': 20,
    'wmnla-economy-industry': 13,
    'wmnla-local-services': 12,
    'wmnla-community-environment': 10,
    'wmnla-notable-people': 10,
  },

  officeholders: [
    { name: 'Staci Albritton Mitchell', role: 'Mayor', termEnd: '2026-07-01T00:00:00Z' },
    { name: 'James D. "Polk" Brian', role: 'Alderman', termEnd: '2026-07-01T00:00:00Z' },
    { name: 'Morgan Lowe Buxton', role: 'Alderman', termEnd: '2026-07-01T00:00:00Z' },
    { name: 'Thom Hamilton', role: 'Alderman', termEnd: '2026-07-01T00:00:00Z' },
    { name: 'Rodney Welch', role: 'Alderman', termEnd: '2026-07-01T00:00:00Z' },
    { name: 'Ben Westerburg', role: 'Alderman', termEnd: '2026-07-01T00:00:00Z' },
    { name: 'Foy Bryan Gadberry', role: 'State Representative District 15', termEnd: '2028-01-01T00:00:00Z' },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/West_Monroe,_Louisiana',
    'https://en.wikipedia.org/wiki/Bill_Russell',
    'https://en.wikipedia.org/wiki/Webb_Pierce',
    'https://en.wikipedia.org/wiki/Duck_Commander',
    'https://en.wikipedia.org/wiki/Duck_Dynasty',
    'https://en.wikipedia.org/wiki/Andrew_Whitworth',
    'https://www.cityofwestmonroe.com/188/Our-Mayor',
    'https://www.cityofwestmonroe.com/177/Board-of-Aldermen',
  ],
};
