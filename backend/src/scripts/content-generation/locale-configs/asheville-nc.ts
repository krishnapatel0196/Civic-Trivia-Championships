import type { LocaleConfig } from './bloomington-in.js';

/**
 * Asheville, NC locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - Asheville uses council-manager government: City Manager (DK Wesley, as of Jan 12, 2026)
 *   handles operations; 7-member City Council (Mayor + 6) sets policy.
 * - All 6 council seats are AT-LARGE — no wards or districts.
 * - Do NOT conflate Buncombe County government with Asheville city government.
 *   County has its own Board of Commissioners — do not attribute county services to the city.
 * - Biltmore Estate is privately owned (Vanderbilt family), not a city facility.
 * - "The Land of the Sky" nickname was coined by author Francis Tiernan in 1878.
 * - "Beer City USA" title won via national poll, first in 2009.
 * - Hurricane Helene struck September 27, 2024 — significant recent event.
 * - ALL officeholder questions MUST have expiresAt set.
 * - No addresses or phone numbers in answer options (quality rule).
 *
 * CURRENT OFFICEHOLDERS (as of 2026):
 * - Mayor: Esther E. Manheimer (term ends December 2026; elected 2013, seeking 4th term)
 * - Vice Mayor: S. Antanette Mosley (term ends December 2026)
 * - Council Member: Sheneika Smith (term ends December 2026)
 * - Council Member: Maggie Ullman (term ends December 2026)
 * - Council Member: Kim Roney (term ends December 2028)
 * - Council Member: Sage Turner (term ends December 2028)
 * - Council Member: Bo Hess (term ends December 2028)
 * - City Manager: Dakisha "DK" Wesley (sworn in January 12, 2026)
 *
 * STATE LEGISLATORS (Buncombe County):
 * - NC House District 114: Rep. Eric Ager (D)
 * - NC House District 115: Rep. Lindsey Prather (D)
 * - NC House District 116: Rep. Brian Turner (D)
 * - NC Senate District 49: Sen. Julie Mayfield (D)
 */
export const ashevilleNcConfig: LocaleConfig = {
  locale: 'asheville-nc',
  name: 'Asheville, NC',
  externalIdPrefix: 'ashnc',
  collectionSlug: 'asheville-nc',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description:
        'Asheville uses a council-manager form of government. The seven-member City Council consists of a separately elected Mayor plus six at-large council members — there are no wards or districts. The City Manager (currently Dakisha "DK" Wesley, sworn in January 12, 2026) handles daily operations. Mayor Esther Manheimer has served since 2013 and is seeking a fourth term in 2026. Focus on: government structure, how many council members, election cycle (4-year staggered terms), roles of mayor vs. city manager, current officeholders. Avoid attributing county functions (Buncombe County Board of Commissioners) to city government.',
    },
    {
      slug: 'founding-history',
      name: 'Founding & History',
      description:
        'Asheville was founded in 1793 by John Burton as "Morristown," then renamed Asheville in 1797 to honor NC Governor Samuel Ashe. Buncombe County was established December 5, 1791. The Buncombe Turnpike (completed 1827) transformed the city into a trade crossroads. The Western NC Railroad arrived October 3, 1880, sparking explosive growth. Incorporated as a city in 1883. Key events: the Great Flood of 1916 (22 inches of rain, 80 deaths); the Great Depression debt crisis (Asheville had the highest per capita municipal debt in the US; finished paying bonds only in 1977); Hurricane Helene (September 27, 2024). Focus on: founding names and dates, key infrastructure milestones, the Depression debt story, Buncombe County establishment.',
    },
    {
      slug: 'landmarks-architecture',
      name: 'Landmarks & Architecture',
      description:
        'Biltmore Estate: built 1889–1895 for George Washington Vanderbilt II; architect Richard Morris Hunt; landscape by Frederick Law Olmsted; 250 rooms, 175,000 sq ft; America\'s largest home; opened Christmas Eve 1895. Basilica of Saint Lawrence: designed by Rafael Guastavino; completed 1909; elliptical dome 82×58 ft — one of the largest freestanding elliptical domes in the US; no wood or steel; elevated to minor basilica by Pope John Paul II in 1993. Grove Park Inn: opened 1913 by E.W. Grove; built from massive local boulders. Grove Arcade: completed 1929; architect Charles N. Parker; 269,000 sq ft; reopened 2002. Jackson Building (1924): first skyscraper in Western NC; architect Ronald Greene. Asheville City Hall designed by Art Deco architect Douglas D. Ellington. Thomas Wolfe Memorial: National Historic Landmark.',
    },
    {
      slug: 'notable-people',
      name: 'Notable People',
      description:
        'Thomas Wolfe (1900–1938): born in Asheville; wrote Look Homeward, Angel (1929), which fictionalized Asheville as "Altamont"; banned locally after publication; died age 37. O. Henry (William Sydney Porter, 1862–1910): short story writer; lived in Asheville; buried at Riverside Cemetery. Zebulon Baird Vance (1830–1894): born near Asheville; served as NC Governor (37th and 43rd) and U.S. Senator. Rafael Guastavino (1842–1908): Spanish architect; designed the Basilica; his tile-vaulting technique appears in Grand Central Terminal. E.W. Grove: pharmaceutical millionaire who built Grove Park Inn and Grove Arcade. Francis Tiernan ("Christian Reid"): coined "The Land of the Sky" in 1878. Riverside Cemetery notable burials: Thomas Wolfe, O. Henry, Zebulon Vance, 18 German WWI soldiers.',
    },
    {
      slug: 'economy-culture',
      name: 'Economy & Culture',
      description:
        'Asheville is nationally known as "Beer City USA" — won the online poll 4 of 5 times starting 2009; has 60+ breweries and one of the highest per capita brewery ratios in the US. Tourism is a major economic driver (~20% of Buncombe County GDP pre-Helene; $3 billion annual visitor spending). Hurricane Helene (Sept 2024) devastated tourism (down 70% in Q4 2024) and caused Buncombe County unemployment to spike from 2.5% to 10.4%. River Arts District is home to hundreds of artists and studios. UNCA founded 1927 as Buncombe County Junior College — first tuition-free public college in NC; joined UNC system 1969. Biltmore operates one of the most-visited wineries in the US.',
    },
    {
      slug: 'natural-environment',
      name: 'Natural Environment',
      description:
        'Asheville sits at approximately 2,200 feet elevation in the Blue Ridge Mountains, surrounded by peaks exceeding 5,000 feet. Located at the confluence of the Swannanoa River and the French Broad River. The Blue Ridge Parkway runs near the city and has its headquarters in Asheville; constructed mid-1930s using Civilian Conservation Corps labor. The city\'s elevation drives both its tourism appeal and flooding vulnerability (Great Flood of 1916; Hurricane Helene 2024). Asheville is the county seat of Buncombe County (population 269,452 in 2020 Census). The Swannanoa Valley was historically a Cherokee hunting ground before European settlement.',
    },
  ],

  topicDistribution: {
    'city-government': 20,
    'founding-history': 18,
    'landmarks-architecture': 22,
    'notable-people': 12,
    'economy-culture': 18,
    'natural-environment': 10,
  },

  officeholders: [
    {
      name: 'Esther E. Manheimer',
      role: 'Mayor',
      termEnd: '2026-12-01T00:00:00Z',
    },
    {
      name: 'S. Antanette Mosley',
      role: 'Vice Mayor',
      termEnd: '2026-12-01T00:00:00Z',
    },
    {
      name: 'Sheneika Smith',
      role: 'Council Member',
      termEnd: '2026-12-01T00:00:00Z',
    },
    {
      name: 'Maggie Ullman',
      role: 'Council Member',
      termEnd: '2026-12-01T00:00:00Z',
    },
    {
      name: 'Kim Roney',
      role: 'Council Member',
      termEnd: '2028-12-01T00:00:00Z',
    },
    {
      name: 'Sage Turner',
      role: 'Council Member',
      termEnd: '2028-12-01T00:00:00Z',
    },
    {
      name: 'Bo Hess',
      role: 'Council Member',
      termEnd: '2028-12-01T00:00:00Z',
    },
    {
      name: 'Dakisha "DK" Wesley',
      role: 'City Manager',
      termEnd: '2028-12-01T00:00:00Z',
    },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Asheville,_North_Carolina',
    'https://en.wikipedia.org/wiki/Biltmore_Estate',
    'https://en.wikipedia.org/wiki/Basilica_of_St._Lawrence,_Asheville',
    'https://en.wikipedia.org/wiki/Grove_Park_Inn',
    'https://en.wikipedia.org/wiki/Grove_Arcade',
    'https://en.wikipedia.org/wiki/Thomas_Wolfe',
    'https://en.wikipedia.org/wiki/O._Henry',
    'https://en.wikipedia.org/wiki/Zebulon_Baird_Vance',
    'https://en.wikipedia.org/wiki/Rafael_Guastavino',
    'https://en.wikipedia.org/wiki/University_of_North_Carolina_Asheville',
    'https://en.wikipedia.org/wiki/Blue_Ridge_Parkway',
  ],
};
