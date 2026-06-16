import type { LocaleConfig } from './bloomington-in.js';

/**
 * Arizona state locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - This is a STATE collection — questions must be strictly state-scale only.
 *   Do NOT write questions about Phoenix city hall, Tucson city council, Mesa
 *   local government, or any city-specific facts a future city collection could own.
 *   Test: "Could a future city collection own this question?" — if yes, cut it.
 * - Cities may appear ONLY as seats of state institutions (e.g., "the state capital
 *   is Phoenix") or as geographic context for state-level features.
 * - Natural features (Grand Canyon, Colorado River) are OK when tied to state history,
 *   national designation, or statewide policy — not city-specific tourism.
 * - Arizona does NOT observe Daylight Saving Time (except the Navajo Nation).
 * - Arizona has an elected Mine Inspector — one of very few states with this office.
 * - The Arizona Legislature has 30 districts; each elects 1 senator + 2 representatives.
 * - All officeholder questions MUST have expiresAt set.
 * - No addresses or phone numbers in answer options (quality rule).
 * - Do not conflate Navajo Nation governance with Arizona state government.
 *
 * CURRENT OFFICEHOLDERS (terms end Jan 2027 unless noted):
 * - Governor: Katie Hobbs (took office Jan 2, 2023; term ends Jan 4, 2027)
 * - Attorney General: Kris Mayes (term ends Jan 2027)
 * - Secretary of State: Adrian Fontes (term ends Jan 2027)
 * - State Treasurer: Kimberly Yee (term ends Jan 2027)
 * - Superintendent of Public Instruction: Tom Horne (term ends Jan 2027)
 * - Senate President: Warren Petersen (57th Legislature, 2025–2026)
 * - House Speaker: Steve Montenegro (57th Legislature, 2025–2026)
 * - U.S. Senator: Mark Kelly (term ends Jan 2029)
 * - U.S. Senator: Ruben Gallego (term ends Jan 2031)
 *
 * CONTENT CAPS:
 * - Max 1 question per officeholder
 * - Cap casino/gambling questions at 2 (not a dominant AZ theme)
 * - Native American history: up to 4 questions, tied to statewide significance
 */
export const arizonaConfig: LocaleConfig = {
  locale: 'arizona',
  name: 'Arizona',
  externalIdPrefix: 'arizs',
  collectionSlug: 'arizona',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'state-government',
      name: 'State Government',
      description:
        'Arizona state government structure: the Governor, Legislature (30-district bicameral system), state executive offices, term limits (Prop 107, 1992), and the unique elected Mine Inspector. Include questions on current officeholders (all expiring), constitutional structure, and the role of the Arizona Supreme Court. Avoid city-level government entirely. Note: Arizona has 5 independently elected statewide executive officers beyond the governor.',
    },
    {
      slug: 'statehood-history',
      name: 'Statehood & History',
      description:
        'Arizona became the 48th and last contiguous state on February 14, 1912 (Valentine\'s Day), signed by President William Howard Taft. Cover the Gadsden Purchase (1853, $10 million), separation from New Mexico Territory as Arizona Territory in 1863, territorial capital moves (Prescott → Tucson → Prescott → Phoenix), the Gunfight at the O.K. Corral (October 26, 1881, Tombstone), and Ed Schieffelin founding Tombstone (1879). Include Francisco Vásquez de Coronado\'s 1540–1542 expedition and the Treaty of Guadalupe Hidalgo (1848). Avoid overlap with city-specific local history.',
    },
    {
      slug: 'geography-landmarks',
      name: 'Geography & Landmarks',
      description:
        'Focus on state-scale natural and civic landmarks: Grand Canyon (277 miles long, 1+ mile deep, NPS 1919, UNESCO 1979), Colorado River, Monument Valley (Navajo Tribal Park, straddles AZ–UT border), Antelope Canyon (Navajo Nation near Page), Horseshoe Bend (near Page), Petrified Forest National Park, Painted Desert, Hoover Dam (completed 1935, AZ–NV border), Glen Canyon Dam (completed 1966, creates Lake Powell), London Bridge (relocated to Lake Havasu City, purchased 1968 for $2.46M). The Four Corners monument (AZ, UT, CO, NM) is the only such point in the U.S. Sedona red rocks and Flagstaff are OK as state geographic facts — avoid their local government.',
    },
    {
      slug: 'native-nations',
      name: 'Native Nations',
      description:
        'Arizona has 22 federally recognized Native American tribes — more than almost any other state. Key facts: Navajo Nation (27,000+ sq miles, largest tribal land in U.S., Diné people), Hopi village of Oraibi (oldest continuously inhabited settlement in the U.S., dating to at least 1150 AD), Tohono O\'odham Nation (2.8 million acres, descendants of Hohokam), and the Hohokam irrigation canal system (ancestors of O\'odham, predating European arrival). Navajo Code Talkers served in WWII. Four Corners is managed by the Navajo Nation. Keep questions at the statewide/tribal-nation level — not city specific.',
    },
    {
      slug: 'economy-industry',
      name: 'Economy & Industry',
      description:
        'Arizona\'s economy historically centered on the "Five C\'s": Copper, Cattle, Cotton, Citrus, and Climate — all represented on the Great Seal. Arizona produces more copper than all other 49 states combined (>60% of U.S. supply); the Morenci Mine in Greenlee County is one of the world\'s largest open-pit copper mines. Modern economy includes aerospace & defense (3rd highest U.S. concentration; Honeywell Aerospace, Raytheon Technologies), semiconductors, and agriculture ($23B impact). Arizona contributes $500B+ to national GDP. Do not focus on specific city economic development projects.',
    },
    {
      slug: 'state-symbols',
      name: 'State Symbols & Identity',
      description:
        'Arizona state symbols: state bird (Cactus Wren), state flower (Saguaro Cactus Blossom, adopted 1931), state tree (Palo Verde), state gem (Turquoise), state metal (Copper), state mammal (Ringtail), state fish (Apache Trout), state reptile (Arizona Ridge-Nosed Rattlesnake), state butterfly (Two-tailed Swallowtail), state fossil (Petrified Wood), state neckwear (Bola Tie), state firearm (Colt Single Action Army Revolver), state song ("The Arizona March Song," written 1915, adopted 1919). Motto: "Ditat Deus" (God Enriches). Nickname: The Grand Canyon State. State colors: Blue and Gold. Arizona does NOT observe Daylight Saving Time (since 1968, except the Navajo Nation).',
    },
    {
      slug: 'universities-science',
      name: 'Universities & Science',
      description:
        'Arizona Board of Regents governs three public universities: Arizona State University (Tempe, founded 1885, ~160,000+ enrollment, one of largest public universities in U.S.), University of Arizona (Tucson, founded 1885, ~53,000 enrollment), and Northern Arizona University (Flagstaff, founded 1899, ~28,000 enrollment). Flagstaff\'s Lowell Observatory is where Clyde Tombaugh discovered Pluto in 1930. Saguaro National Park (~92,000 acres near Tucson) created 1933. Do not write questions tied to specific campus city politics.',
    },
  ],

  topicDistribution: {
    'state-government': 20,
    'statehood-history': 18,
    'geography-landmarks': 18,
    'native-nations': 10,
    'economy-industry': 12,
    'state-symbols': 12,
    'universities-science': 10,
  },

  officeholders: [
    { name: 'Katie Hobbs', role: 'Governor', termEnd: '2027-01-04T00:00:00Z' },
    { name: 'Kris Mayes', role: 'Attorney General', termEnd: '2027-01-06T00:00:00Z' },
    { name: 'Adrian Fontes', role: 'Secretary of State', termEnd: '2027-01-06T00:00:00Z' },
    { name: 'Kimberly Yee', role: 'State Treasurer', termEnd: '2027-01-06T00:00:00Z' },
    { name: 'Tom Horne', role: 'Superintendent of Public Instruction', termEnd: '2027-01-06T00:00:00Z' },
    { name: 'Warren Petersen', role: 'Senate President', termEnd: '2027-01-12T00:00:00Z' },
    { name: 'Steve Montenegro', role: 'House Speaker', termEnd: '2027-01-12T00:00:00Z' },
    { name: 'Mark Kelly', role: 'U.S. Senator', termEnd: '2029-01-03T00:00:00Z' },
    { name: 'Ruben Gallego', role: 'U.S. Senator', termEnd: '2031-01-03T00:00:00Z' },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Arizona',
    'https://en.wikipedia.org/wiki/Arizona_State_Capitol',
    'https://en.wikipedia.org/wiki/Arizona_Legislature',
    'https://en.wikipedia.org/wiki/Grand_Canyon',
    'https://en.wikipedia.org/wiki/Monument_Valley',
    'https://en.wikipedia.org/wiki/Saguaro_cactus',
    'https://en.wikipedia.org/wiki/Navajo_Nation',
    'https://en.wikipedia.org/wiki/Hopi_people',
    'https://en.wikipedia.org/wiki/Gadsden_Purchase',
    'https://en.wikipedia.org/wiki/Gunfight_at_the_O.K._Corral',
    'https://en.wikipedia.org/wiki/London_Bridge_(Lake_Havasu_City)',
    'https://en.wikipedia.org/wiki/Copper_mining_in_Arizona',
    'https://en.wikipedia.org/wiki/Hoover_Dam',
    'https://en.wikipedia.org/wiki/Glen_Canyon_Dam',
    'https://en.wikipedia.org/wiki/Lowell_Observatory',
  ],
};
