import type { LocaleConfig } from './bloomington-in.js';

/**
 * Washington State locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - This is a STATE-LEVEL collection. Questions must be strictly state-scale.
 *   Do NOT write questions about Seattle city government, Bainbridge Island,
 *   or any specific city's local services, council, or history.
 *   Test: "Could a future city collection own this question?" If yes, cut it.
 * - Cities may appear ONLY as seats of state institutions (e.g., "Olympia is the
 *   state capital" = OK; anything about Olympia's city council = cut).
 * - Natural features are OK only when tied to statewide significance or policy.
 * - Washington is the ONLY U.S. state named after a president.
 * - The state capital is Olympia, NOT Seattle. Seattle is the largest city, not the capital.
 * - The governor is elected statewide every 4 years; there are no term limits.
 * - The Washington State Legislature has 49 districts; each elects 1 senator and 2 representatives.
 * - ALL officeholder questions MUST have expiresAt set.
 * - No addresses or phone numbers in answer options (quality rule).
 * - No political party labels anywhere — not in questions, options, or explanations.
 *
 * CURRENT STATEWIDE OFFICEHOLDERS (all terms end ~January 2029):
 * - Governor: Bob Ferguson (took office Jan 13, 2025)
 * - Lieutenant Governor: Denny Heck
 * - Attorney General: Nick Brown
 * - Secretary of State: Steve Hobbs
 */
export const washingtonStateConfig: LocaleConfig = {
  locale: 'washington-state',
  name: 'Washington',
  externalIdPrefix: 'washs',
  collectionSlug: 'washington-state',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'state-government',
      name: 'State Government',
      description: `Washington State operates under a constitution adopted in 1889 when it achieved statehood.
The governor is elected statewide to a 4-year term with no term limits. The current governor is Bob Ferguson,
who took office January 13, 2025. The lieutenant governor is Denny Heck, the attorney general is Nick Brown,
and the secretary of state is Steve Hobbs — all elected in November 2024.
The Washington State Legislature is bicameral: the Senate has 49 members (one per legislative district),
serving staggered 4-year terms; the House has 98 members (two per district), serving 2-year terms.
The state has 49 legislative districts. The Washington Supreme Court is the state's highest court with 9 justices.
Write questions about the governor's role and current officeholder, the legislature's structure (49 districts,
49 senators, 98 representatives), how the lieutenant governor's role differs, and Washington's constitution.
Do NOT write questions about any city's local government, mayor, or city council.`,
    },
    {
      slug: 'state-history',
      name: 'State History',
      description: `Washington became the 42nd state on November 11, 1889. It is the only U.S. state named
after a president — George Washington. Washington Territory was created March 2, 1853, carved out of Oregon
Territory. The name "Washington" was chosen by Congress to honor the first president; the name "Columbia"
was rejected because the federal district already used it. Spanish explorer Bruno de Heceta made the first
recorded European landing in Washington in 1775. English explorer George Vancouver mapped the region in 1792.
Lewis and Clark entered the future state on October 10, 1805. The Oregon Treaty of 1846 set the boundary
with British Canada at the 49th parallel. The Monticello Convention of 1852 laid the groundwork for
Washington Territory's creation. Sonora Smart Dodd of Spokane organized the first statewide Father's Day
celebration on June 19, 1910, leading eventually to the 1972 federal holiday.
The Hanford Site was established in 1943 as part of the Manhattan Project — it housed the world's first
full-scale plutonium production reactor (the B Reactor) and produced the plutonium used in the Fat Man
bomb dropped on Nagasaki. Write questions about statehood date and number, the territory's creation,
naming after Washington, Lewis and Clark, the Oregon Treaty, Hanford's Manhattan Project role, and Father's Day origins.`,
    },
    {
      slug: 'natural-geography',
      name: 'Natural Geography',
      description: `Washington State's geography is defined by the Cascade Range, which bisects the state
north to south creating two climatically distinct regions. Western Washington has a mild oceanic climate
with temperate rainforests; eastern Washington is semi-arid. Mount Rainier (14,410 feet) is the highest
peak in the state and the most topographically prominent mountain in the contiguous United States. It has
26 major glaciers and is classified as a Decade Volcano due to eruption risk. Mount Rainier National Park
was established March 2, 1899, as America's fifth national park, by President William McKinley.
Mount St. Helens erupted catastrophically on May 18, 1980, killing 57 people — the deadliest volcanic
event in modern U.S. history. Mount Baker set a world snowfall record in 1999 with 1,140 inches in a
single season. The state covers 71,362 square miles (18th largest). The Columbia River, the largest river
in the Pacific Northwest, flows through eastern and southern Washington. The Olympic Peninsula's Hoh
Rainforest is one of the only temperate rainforests in the contiguous United States. Write questions about
Mount Rainier's elevation and prominence, Mount St. Helens' 1980 eruption, the Cascade Range's east/west
climate division, the Columbia River, state size ranking, and the temperate rainforest.`,
    },
    {
      slug: 'landmarks-institutions',
      name: 'Landmarks & Institutions',
      description: `Washington State's most significant statewide landmarks include:
The Washington State Capitol in Olympia, completed in 1928, designed by architects Walter Wilder and
Harry White. Its dome stands 287 feet high — the tallest self-supporting masonry dome in North America
and fifth tallest in the world. The north entrance has 42 granite steps honoring Washington as the 42nd
state. The interior features bronze fixtures by Louis Comfort Tiffany and a large chandelier. The exterior
uses Wilkeson sandstone (quarried in Washington State).
Grand Coulee Dam on the Columbia River, construction began July 16, 1933, completed January 31, 1943.
Built by the U.S. Bureau of Reclamation. At 550 feet tall and 5,223 feet long, with an installed capacity
of 6,809 MW, it is the largest power station in the United States by nameplate capacity. It has no fish
passage, permanently blocking salmon migration above the dam.
The Hanford B Reactor, the world's first full-scale plutonium production reactor, is now a National
Historic Landmark open as a museum at the Hanford Site near the Tri-Cities in eastern Washington.
Mount Rainier National Park, established 1899, is among the country's oldest national parks.
Write questions about the Capitol dome height and distinction, the 42 steps, Grand Coulee Dam's records,
its location on the Columbia River, the dam's power capacity, and Mount Rainier National Park's founding.`,
    },
    {
      slug: 'economy-industry',
      name: 'Economy & Industry',
      description: `Washington State has a diverse economy with several nationally leading industries.
Agriculture: Washington is the largest U.S. producer of apples, hops, pears, blueberries, spearmint oil,
and sweet cherries. It is the third-largest wine-producing state. The state is the second-largest lumber
producer nationally.
Aviation/Defense: Boeing, founded in Seattle in 1916, remains one of the world's largest aircraft
manufacturers and a major Washington employer.
Technology: Microsoft (headquartered in Redmond, WA), Amazon (headquartered in Seattle), and Starbucks
(founded in Seattle in 1971) are global companies based in Washington State.
Fishing: Washington has significant commercial salmon, halibut, and bottomfish industries.
Hydroelectric power: Grand Coulee Dam is the largest power producer in the U.S.
Write ONLY state-scale questions: Washington is the largest producer of X, Boeing was founded in Y,
Microsoft is headquartered in Redmond WA. Do NOT write questions about Seattle's local economy or city
services — only companies and industries that are statewide or nationally significant from Washington.`,
    },
    {
      slug: 'state-symbols-culture',
      name: 'State Symbols & Culture',
      description: `Washington State has a rich set of official state symbols:
- Nickname: "The Evergreen State" (unofficial but universally recognized)
- Motto: "Alki" (Chinook jargon meaning "By and By")
- Flower: Coast rhododendron
- Bird: Willow goldfinch (American goldfinch)
- Tree: Western hemlock
- Fish: Steelhead trout
- Mammal (endemic land): Olympic marmot; (aquatic): Orca
- Insect: Green darner dragonfly
- Food: Apple
- Gemstone: Petrified wood
- Dinosaur: Suciasaurus rex (discovered on Sucia Island in Puget Sound)
- Sport: Pickleball (invented on Bainbridge Island in 1965; designated official state sport)
- Ship: Lady Washington (replica 18th-century merchant sailing vessel)
- Dance: Square dance
- Anthem: "Washington, My Home"
- Washington is the only U.S. state named after a president.
- Father's Day traces its origins to Spokane, WA — Sonora Smart Dodd organized the first statewide
  celebration on June 19, 1910.
Write questions about the state nickname, motto meaning, flower, bird, tree, fish, aquatic mammal (orca),
the sport (pickleball), state food (apple), state gemstone, state dinosaur, and the Father's Day connection to Spokane.`,
    },
  ],

  topicDistribution: {
    'state-government': 20,
    'state-history': 18,
    'natural-geography': 18,
    'landmarks-institutions': 17,
    'economy-industry': 15,
    'state-symbols-culture': 12,
  },

  officeholders: [
    { name: 'Bob Ferguson', role: 'Governor', district: 'Statewide', termEnd: '2029-01-08T00:00:00Z' },
    { name: 'Denny Heck', role: 'Lieutenant Governor', district: 'Statewide', termEnd: '2029-01-08T00:00:00Z' },
    { name: 'Nick Brown', role: 'Attorney General', district: 'Statewide', termEnd: '2029-01-08T00:00:00Z' },
    { name: 'Steve Hobbs', role: 'Secretary of State', district: 'Statewide', termEnd: '2029-01-08T00:00:00Z' },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Washington_(state)',
    'https://en.wikipedia.org/wiki/Washington_State_Capitol',
    'https://en.wikipedia.org/wiki/Grand_Coulee_Dam',
    'https://en.wikipedia.org/wiki/Hanford_Site',
    'https://en.wikipedia.org/wiki/Mount_Rainier',
    'https://en.wikipedia.org/wiki/Mount_St._Helens',
    'https://en.wikipedia.org/wiki/Washington_State_Legislature',
    'https://en.wikipedia.org/wiki/History_of_Washington_(state)',
  ],
};
