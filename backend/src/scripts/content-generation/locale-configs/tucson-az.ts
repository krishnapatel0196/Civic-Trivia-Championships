import type { LocaleConfig } from './bloomington-in.js';

/**
 * Tucson, AZ locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - Tucson uses a COUNCIL-MANAGER form of government. The mayor and 6 ward council
 *   members are elected; a professional city manager (Tim Thomure, appointed July 2024)
 *   runs day-to-day operations. Do NOT write questions implying the mayor has executive
 *   powers like a strong-mayor city.
 * - There are 6 WARDS (not districts, not at-large). Primary elections are ward-based;
 *   general elections are citywide.
 * - Do NOT conflate Tucson city services with Pima County services. Tucson is the
 *   county seat of Pima County but they are separate governments.
 * - Do NOT attribute University of Arizona governance to the city — it is governed by
 *   the Arizona Board of Regents, not Tucson city council.
 * - San Xavier del Bac Mission is on TOHONO O'ODHAM NATION land, not city land.
 * - Saguaro National Park is a FEDERAL park (NPS), not city-managed.
 * - Do NOT overlap with the Arizona state collection. No statehood facts, state symbols,
 *   or state-level government questions belong here.
 * - No addresses or phone numbers in answer options (quality rule).
 * - ALL officeholder questions MUST have expiresAt set.
 *
 * CURRENT OFFICEHOLDERS:
 * - Mayor: Regina Romero (first female and first Latina mayor; elected 2019, reelected
 *   2023 with 61%; term ends 2027)
 * - Ward 1: Lane Santa Cruz (term ends 2027)
 * - Ward 2: Paul Cunningham (term ends 2027)
 * - Ward 3: Kevin Dahl (term ends Dec 3, 2029)
 * - Ward 4: Nikki Lee (term ends 2027)
 * - Ward 5: Selina Barajas (term ends Dec 3, 2029)
 * - Ward 6: Miranda Schubert (term ends Dec 3, 2029)
 * - City Manager: Tim Thomure (appointed March 19, 2024; started July 1, 2024)
 *
 * CONTENT NOTES:
 * - Cap AMARG/"Boneyard" questions at 3
 * - The "A" on Sentinel Peak (painted March 4, 1916) represents UA
 * - Tucson = oldest incorporated city in Arizona (incorporated 1877)
 * - Nickname: "The Old Pueblo"
 * - Tucson Gem & Mineral Show (February) = world's largest gem show
 * - El Tour de Tucson (Saturday before Thanksgiving) = major cycling event since 1983
 * - Sun Link streetcar opened July 2014, 3.9 miles, 23 stops
 */
export const tucsonAzConfig: LocaleConfig = {
  locale: 'tucson-az',
  name: 'Tucson, AZ',
  externalIdPrefix: 'tucaz',
  collectionSlug: 'tucson-az',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description:
        'Tucson uses a council-manager form of government with an elected mayor and 6 ward council members who appoint a professional city manager. Cover: the 6-ward structure, four-year terms, odd-year elections, citywide general elections, current Mayor Regina Romero (first female and first Latina mayor, reelected 2023 with 61%), City Manager Tim Thomure (appointed July 2024), the ward numbers and council members, and how the council-manager system works. Do not write questions about Pima County government or University of Arizona governance.',
    },
    {
      slug: 'founding-history',
      name: 'Founding & History',
      description:
        'Tucson is one of the oldest continuously inhabited areas in North America. Key facts: Presidio San Agustín del Tucson founded August 20, 1775 by Lt. Col. Hugo O\'Conor; Tohono O\'odham village of Stjukshon predated Spanish arrival; name origin from O\'odham "Stjukshon" meaning "village at the foot of the black mountain"; Gadsden Purchase (1854) brought Tucson into the U.S.; territorial capital 1867–1877; Southern Pacific Railroad arrived March 20, 1880; incorporated 1877 (oldest incorporated city in Arizona); "Old Pueblo" nickname origin; Confederate forces briefly occupied Tucson in 1862. Do not include Arizona statehood facts.',
    },
    {
      slug: 'university-military',
      name: 'University & Military',
      description:
        'Two major institutions define Tucson: the University of Arizona and Davis-Monthan AFB. UA: founded 1885 (first public university in Arizona, predating statehood), ~56,500 enrollment, mascot the Wildcats (Wilbur and Wilma), notable Wyant College of Optical Sciences (Nobel laureates), Eller College of Management, College of Medicine. The "A" on Sentinel Peak was first painted March 4, 1916. Davis-Monthan AFB: named for two local aviators (Lt. Samuel H. Davis and 2nd Lt. Oscar Monthan); home of 355th Wing; AMARG "Boneyard" — world\'s largest aircraft storage facility, 4,400+ aircraft on 2,600 acres, dry desert climate ideal for preservation. Cap AMARG questions at 3.',
    },
    {
      slug: 'landmarks-culture',
      name: 'Landmarks & Culture',
      description:
        'Tucson\'s civic landmarks and cultural events. Sentinel Peak ("A Mountain"): dark volcanic rock west of downtown, ~2,900 ft elevation. Saguaro National Park: only U.S. national park wrapping around a city; two districts — Rincon Mountain District (east, ~66,947 acres, established 1933) and Tucson Mountain District (west, ~24,498 acres, added 1961 by President Kennedy). Tucson Gem & Mineral Show: world\'s largest gem show, held annually in February at Tucson Convention Center (181,000 sq ft), first held 1955. El Tour de Tucson: cycling event since 1983 founded by Richard DeBernardis, held Saturday before Thanksgiving, 7,000–10,000 riders, raised $138M+ for charity. Sun Link streetcar: opened July 2014, 3.9 miles, 23 stops, $196M cost, connects UA to downtown.',
    },
    {
      slug: 'missions-heritage',
      name: 'Missions & Indigenous Heritage',
      description:
        'Tucson\'s Spanish colonial and indigenous heritage. Mission San Xavier del Bac: founded 1692 by Jesuit Father Eusebio Francisco Kino; current church built by Franciscans 1783–1797 after Spain expelled Jesuits in 1767; Spanish Colonial Baroque style — finest example in the U.S.; nicknamed "The White Dove of the Desert"; located ~9 miles south of downtown on Tohono O\'odham Nation San Xavier District; National Historic Landmark; still an active parish. Presidio San Agustín del Tucson (founded 1775 by Lt. Col. Hugo O\'Conor) — preserved remains in downtown museum. Tohono O\'odham Nation: ancestral stewards of the Sonoran Desert. Hohokam people farmed the area ~4,000 years ago.',
    },
    {
      slug: 'economy-environment',
      name: 'Economy & Environment',
      description:
        'Tucson\'s economy and natural environment. Major employers: Raytheon Missiles & Defense (~13,000 employees, largest private employer — Tucson is the "missile capital of the U.S."), University of Arizona, Banner–University Medical Center, Davis-Monthan AFB. "Optics Valley": Tucson is a global hub for telescope mirror production and optics R&D (UA\'s Wyant College of Optical Sciences). Five surrounding mountain ranges: Santa Catalinas (north, Mt. Lemmon 9,157 ft), Rincon (east), Santa Rita (south), Tucson Mountains (west), Tortolita (northwest). Monsoon season officially begins June 15; intense afternoon thunderstorms July–September. Biosphere 2 (~30 miles north in Oracle) operated by University of Arizona. Kitt Peak National Observatory ~56 miles southwest.',
    },
  ],

  topicDistribution: {
    'city-government': 18,
    'founding-history': 17,
    'university-military': 17,
    'landmarks-culture': 18,
    'missions-heritage': 15,
    'economy-environment': 15,
  },

  officeholders: [
    { name: 'Regina Romero', role: 'Mayor', termEnd: '2027-12-01T00:00:00Z' },
    { name: 'Lane Santa Cruz', role: 'Ward 1 Council Member', termEnd: '2027-12-01T00:00:00Z' },
    { name: 'Paul Cunningham', role: 'Ward 2 Council Member', termEnd: '2027-12-01T00:00:00Z' },
    { name: 'Kevin Dahl', role: 'Ward 3 Council Member', termEnd: '2029-12-03T00:00:00Z' },
    { name: 'Nikki Lee', role: 'Ward 4 Council Member', termEnd: '2027-12-01T00:00:00Z' },
    { name: 'Selina Barajas', role: 'Ward 5 Council Member', termEnd: '2029-12-03T00:00:00Z' },
    { name: 'Miranda Schubert', role: 'Ward 6 Council Member', termEnd: '2029-12-03T00:00:00Z' },
    { name: 'Tim Thomure', role: 'City Manager', termEnd: '2027-12-01T00:00:00Z' },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Tucson,_Arizona',
    'https://en.wikipedia.org/wiki/University_of_Arizona',
    'https://en.wikipedia.org/wiki/Davis%E2%80%93Monthan_Air_Force_Base',
    'https://en.wikipedia.org/wiki/San_Xavier_del_Bac',
    'https://en.wikipedia.org/wiki/Saguaro_National_Park',
    'https://en.wikipedia.org/wiki/Sun_Link',
    'https://en.wikipedia.org/wiki/Sentinel_Peak_(Tucson)',
  ],
};
