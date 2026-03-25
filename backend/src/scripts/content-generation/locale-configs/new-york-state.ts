import type { LocaleConfig } from './bloomington-in.js';

/**
 * New York State locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - This is a STATE collection — questions must be state-scale only.
 *   Do NOT write questions about NYC city government, the NYC mayor, NYC Council,
 *   Albany city government, Buffalo city government, or any other city's local affairs.
 *   Cities may appear only as seats of state institutions (e.g., "The state capital is Albany").
 * - "Supreme Court" in New York is a TRIAL COURT, not the highest court.
 *   The Court of Appeals is New York's highest court. This is a well-known trivia trap.
 * - The Governor and Lt. Governor run jointly; both terms end ~January 2027.
 * - All four statewide elected offices (Governor, Lt. Gov, AG, Comptroller) are up in
 *   November 2026, with new terms beginning January 2027.
 * - Do not confuse the Erie Canal (completed 1825) with modern canals or the Canal System.
 * - Adirondack Park "Forever Wild" protection dates to 1892 (state constitution), not a
 *   federal designation.
 * - Niagara Falls State Park (1885) = first state park in the United States. Do not say
 *   "first national park" — that's Yellowstone (1872).
 * - SUNY was founded in 1948. Do not conflate with CUNY (City University of New York,
 *   a separate system serving NYC).
 * - New York City was the FIRST capital of the United States (1789–1790), not Albany.
 *   Albany is the current state capital.
 * - All officeholder questions MUST have expiresAt set to 2027-01-01T00:00:00Z.
 * - No addresses or phone numbers in answer options (quality rule).
 * - State questions only — anything about a specific city's local governance must be cut.
 *
 * CURRENT OFFICEHOLDERS (all terms end ~January 2027):
 * - Governor: Kathy Hochul (57th Governor; first woman; became governor Aug 24, 2021)
 * - Lieutenant Governor: Antonio Delgado (term ends Jan 2027)
 * - Attorney General: Letitia James (first Black woman to hold statewide NY office)
 * - Comptroller: Thomas DiNapoli (in office since 2007)
 * - Assembly Speaker: Carl Heastie (first African American Speaker, since Feb 3, 2015)
 * - Senate Majority Leader: Andrea Stewart-Cousins (first woman to hold this role)
 */
export const newYorkStateConfig: LocaleConfig = {
  locale: 'new-york-state',
  name: 'New York State',
  externalIdPrefix: 'nysts',
  collectionSlug: 'new-york-state',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'state-government',
      name: 'State Government',
      description:
        'New York State government structure, branches, and institutions. Cover: the bicameral legislature (63-member Senate, 150-member Assembly, both 2-year terms); the Court of Appeals as the highest court (7 judges, 14-year terms); the fact that "Supreme Court" in NY is a trial court NOT the highest court; the four Appellate Divisions; the Public Service Commission; the constitutional convention referendum requirement (every 20 years); the four state constitutions (1777, 1821, 1846, 1894); how the Governor and Lt. Governor run jointly. Do NOT write questions about NYC city government or any city\'s local structure.',
    },
    {
      slug: 'state-history',
      name: 'State History',
      description:
        'New York State founding and historical milestones. Cover: ratification of the U.S. Constitution as the 11th state on July 26, 1788 (vote 30–27 at Poughkeepsie convention); first state constitution adopted April 20, 1777 during the Revolutionary War; New York City as the first U.S. capital (1789–1790) and George Washington\'s inauguration at Federal Hall on April 30, 1789; the Erie Canal (construction started July 4, 1817 in Rome NY; completed October 26, 1825; 363 miles long; championed by Governor DeWitt Clinton; mockingly called "Clinton\'s Folly"); the Seneca Falls Convention of 1848 (first women\'s rights convention in U.S. history); Adirondack "Forever Wild" constitutional protection (1892). Questions should be state-level history only.',
    },
    {
      slug: 'landmarks-geography',
      name: 'Landmarks & Geography',
      description:
        'New York State\'s notable landmarks, parks, and geographic features. Cover: the New York State Capitol in Albany (construction 1867–1899, cost $25 million — most expensive U.S. government building at the time; five architects including H.H. Richardson and Isaac Perry; designated National Historic Landmark 1979); the Great Western Staircase ("Million Dollar Staircase") with 444 steps and 78 carved faces; Niagara Falls State Park (established 1885, first state park in the United States); Adirondack Park (over 6 million acres, largest protected area in contiguous U.S.); the Erie Canal as a geographic/engineering landmark. Do NOT write questions specific to NYC landmarks (Brooklyn Bridge, Statue of Liberty) — those belong to a future NYC collection.',
    },
    {
      slug: 'economy-demographics',
      name: 'Economy & Demographics',
      description:
        'New York State economy, population, and key industries. Cover: state population (~20.1 million, 4th most populous state); state GDP ($2.322 trillion, 3rd largest state economy); finance as dominant industry (29.2% of GDP); tourism as second-largest industry; New York as 3rd largest dairy producer in the U.S.; the "Empire State" nickname (by 1850 NY led the nation in population, manufacturing, and commerce); Albany as the state capital. Do NOT write questions about NYC\'s specific economy or finances.',
    },
    {
      slug: 'education-institutions',
      name: 'Education & Institutions',
      description:
        'New York State\'s public education system and major institutions. Cover: SUNY (State University of New York) — founded 1948, largest comprehensive public university system in the U.S., 64 schools, ~400,000 students, 93% of New Yorkers live within 15 miles of a SUNY campus; distinguish SUNY (statewide) from CUNY (City University of New York, a separate system for NYC). Do NOT write questions about specific private universities like Cornell, Columbia, or NYU — those are not state institutions.',
    },
    {
      slug: 'current-officials',
      name: 'Current Officials',
      description:
        'Current New York State officeholders. All questions in this topic MUST have expiresAt set. Cover: Governor Kathy Hochul (57th Governor, first woman governor of NY, assumed office Aug 24, 2021 after Andrew Cuomo resigned, won full term in 2022); Lt. Governor Antonio Delgado; Attorney General Letitia James (first Black woman to hold statewide office in NY); Comptroller Thomas DiNapoli (in office since 2007, running for 5th full term); Assembly Speaker Carl Heastie (first African American Speaker, since Feb 3, 2015); Senate Majority Leader Andrea Stewart-Cousins (first woman to hold this role). Maximum 1 question per officeholder.',
    },
  ],

  topicDistribution: {
    'state-government': 25,
    'state-history': 25,
    'landmarks-geography': 18,
    'economy-demographics': 12,
    'education-institutions': 10,
    'current-officials': 10,
  },

  officeholders: [
    {
      name: 'Kathy Hochul',
      role: 'Governor',
      termEnd: '2027-01-01T00:00:00Z',
    },
    {
      name: 'Antonio Delgado',
      role: 'Lieutenant Governor',
      termEnd: '2027-01-01T00:00:00Z',
    },
    {
      name: 'Letitia James',
      role: 'Attorney General',
      termEnd: '2027-01-01T00:00:00Z',
    },
    {
      name: 'Thomas DiNapoli',
      role: 'Comptroller',
      termEnd: '2027-01-01T00:00:00Z',
    },
    {
      name: 'Carl Heastie',
      role: 'Assembly Speaker',
      termEnd: '2027-01-01T00:00:00Z',
    },
    {
      name: 'Andrea Stewart-Cousins',
      role: 'Senate Majority Leader',
      termEnd: '2027-01-01T00:00:00Z',
    },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/New_York_(state)',
    'https://en.wikipedia.org/wiki/Kathy_Hochul',
    'https://en.wikipedia.org/wiki/New_York_State_Legislature',
    'https://en.wikipedia.org/wiki/New_York_State_Capitol',
    'https://en.wikipedia.org/wiki/Erie_Canal',
    'https://en.wikipedia.org/wiki/Niagara_Falls_State_Park',
    'https://en.wikipedia.org/wiki/Adirondack_Park',
    'https://en.wikipedia.org/wiki/State_University_of_New_York',
    'https://en.wikipedia.org/wiki/Letitia_James',
    'https://en.wikipedia.org/wiki/Thomas_DiNapoli',
    'https://en.wikipedia.org/wiki/Carl_Heastie',
    'https://en.wikipedia.org/wiki/Andrea_Stewart-Cousins',
  ],
};
