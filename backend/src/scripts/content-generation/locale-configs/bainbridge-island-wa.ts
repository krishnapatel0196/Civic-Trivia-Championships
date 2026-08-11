import type { LocaleConfig } from './bloomington-in.js';

/**
 * Bainbridge Island, WA locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - Bainbridge Island uses a COUNCIL-MANAGER form of government. The city council
 *   collectively appoints a City Manager who runs day-to-day operations. The mayor
 *   is NOT directly elected — the council votes from among its members each year.
 * - The island was the City of Winslow until November 7, 1991, when it was renamed
 *   Bainbridge Island after annexing the rest of the island.
 * - Do NOT confuse Bainbridge Island with Kitsap County government or with Seattle.
 *   The island IS in Kitsap County but is its own city with its own council.
 * - The ferry is operated by Washington State Ferries (a state agency), not the city.
 * - ALL officeholder questions MUST have expiresAt set.
 * - No addresses or phone numbers in answer options (quality rule).
 * - No political party labels anywhere — not in questions, options, or explanations.
 *
 * GOVERNMENT STRUCTURE:
 * - 7-member city council: 3 wards (North, South, Central), each with 2 seats, plus 1 at-large
 * - Mayor elected by council from among members (not by voters) — 1-year term
 * - Deputy Mayor also elected by council — 6-month term
 *
 * CURRENT OFFICEHOLDERS:
 * - Mayor: Clarence Moriwaki, Central Ward District 5 (term ends 2029-12-31)
 * - Deputy Mayor: Kirsten Hytopoulos, At-Large District 1 (term ends 2027-12-31)
 * - Brenda Fantroy-Johnson, North Ward District 2 (term ends 2027-12-31)
 * - Mike Nelson, South Ward District 3 (term ends 2029-12-31)
 * - Leslie Schneider, Central Ward District 4 (term ends 2027-12-31)
 * - Ashley Mathews, South Ward District 6 (term ends 2027-12-31)
 * - Lara Lant, North Ward District 7 (term ends 2029-12-31)
 * - State Senator: Drew Hansen (23rd Legislative District)
 * - State Representatives: Tarra Simmons (Position 1), Greg Nance (Position 2)
 */
export const bainbridgeIslandWaConfig: LocaleConfig = {
  locale: 'bainbridge-island-wa',
  name: 'Bainbridge Island, WA',
  externalIdPrefix: 'bniwa',
  collectionSlug: 'bainbridge-island-wa',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description: `Bainbridge Island operates under a council-manager form of government with a seven-member
city council. Two councilmembers represent each of three geographic wards (North, South, and Central),
and one at-large member represents the entire island. Council members serve staggered four-year terms.
The mayor and deputy mayor are selected by the council from among its members — the mayor serves a
one-year term, the deputy mayor a six-month term. The council appoints a City Manager to handle
day-to-day administration. Write questions about the council structure, how the mayor is selected,
the role of the City Manager, wards and districts, term lengths, and current officeholders.
Avoid any mention of political parties. Do not ask about county government.`,
    },
    {
      slug: 'japanese-american-history',
      name: 'Japanese American History',
      description: `Bainbridge Island has one of the most significant Japanese American histories in the
United States. Japanese immigrants began arriving in 1883. By the early 20th century, Nikkei farming
families had made the island the "strawberry capital of the Pacific Northwest." On March 30, 1942,
the 276 Japanese American residents of Bainbridge Island were the FIRST Japanese Americans in the
entire country to be forcibly removed under Executive Order 9066 — they were given only 6 days' notice.
227 residents departed by ferry to internment camps. The iconic photograph of Fumiko Hayashida holding
her infant daughter on that ferry became a defining image of the internment. The Bainbridge Island
Japanese American Exclusion Memorial opened July 30, 2011 on the south shore of Eagle Harbor. It was
designed by architect Johnpaul Jones and features a cedar story wall listing all 276 names. The memorial
is a unit of the Minidoka National Historic Site in Idaho. Its guiding phrase is "Nidoto Nai Yoni"
(二度とないように), meaning "Let It Not Happen Again." Write questions covering the strawberry farming era,
the 1942 forced removal, the memorial's design and opening, and the phrase "Nidoto Nai Yoni."`,
    },
    {
      slug: 'founding-industrial-history',
      name: 'Founding & Industrial History',
      description: `Bainbridge Island's civic history spans from Indigenous settlement through a major
industrial era. The Suquamish people inhabited the island for thousands of years across nine villages.
English explorer George Vancouver encountered the Suquamish in 1792. In 1841, U.S. Navy Lieutenant
Charles Wilkes mapped and named the island after Commodore William Bainbridge, who commanded the
frigate USS Constitution in the War of 1812. The first permanent Euro-American settlement was a
lumber mill at Port Madison built by George Meigs. In 1863, William Renton founded a sawmill at
Port Blakely that grew into the world's largest sawmill under one roof. The Hall Brothers Shipyard
at Port Blakely (1881–1904) launched 77 vessels of all types. The area that became downtown Winslow
was incorporated as the City of Winslow in 1947. On November 7, 1991, Winslow annexed the rest of
the island and was renamed the City of Bainbridge Island. Write questions about the Suquamish people,
Charles Wilkes, William Bainbridge, the Port Blakely mill, the Hall Brothers shipyard, the City of
Winslow incorporation, and the 1991 renaming.`,
    },
    {
      slug: 'landmarks-culture',
      name: 'Landmarks & Culture',
      description: `Bainbridge Island has several nationally and regionally significant landmarks and
cultural institutions. The Bainbridge Island Museum of Art (BIMA), located at 550 Winslow Way E,
opened in June 2013 with inaugural show "First Light." It was designed by Coates Design Architects
and earned LEED Gold certification. BIMA is free to the public and focuses on Puget Sound region
artists and an international Artists' Books collection. Pickleball was invented on Bainbridge Island
in the summer of 1965 by Joel Pritchard, Bill Bell, and Barney McCallum, when their families were
vacationing at Pleasant Beach. The game was named "pickleball" by Joan Pritchard after the "pickle
boat" in crew. Joel Pritchard later served as a U.S. Congressman and Washington Lieutenant Governor.
Pickle Ball, Inc. was incorporated in February 1968. Fort Ward, on the island's south end, was a
U.S. Army fort established in 1903 and later became a secret Navy radio listening post ("Station S")
in 1939, intercepting Japanese diplomatic messages before and during WWII. It closed in 1953 and the
historic district is on the National Register of Historic Places. The island's downtown area is
Winslow, with the ferry terminal connecting to Seattle in 35 minutes. Write questions about BIMA,
pickleball's invention, Joel Pritchard, Fort Ward/Station S, Winslow, and the ferry.`,
    },
    {
      slug: 'community-environment',
      name: 'Community & Environment',
      description: `Bainbridge Island is an island city in Puget Sound located in Kitsap County. The
2020 census counted 24,825 residents, making it the second-largest city in Kitsap County. The island
has four commercial centers: Winslow (downtown), Lynwood Center, Fletcher Bay, and Rolling Bay. The
Buy Nothing Project, a global gift economy movement, was founded on Bainbridge Island in July 2013.
The island is known as an affluent bedroom community of Seattle, with the 35-minute Washington State
Ferry crossing being a daily commute route. The Filipino-American Community Hall on the island is
listed on the National Register of Historic Places. The island was the site of the Country Club of
Seattle at Restoration Point. Write questions about the island's geography (Kitsap County, Puget Sound),
population facts, the four commercial centers, the Buy Nothing Project, Washington State Ferries as
the transit connection, and the Suquamish Tribe's continued presence in the area.`,
    },
    {
      slug: 'local-services',
      name: 'Local Services',
      description: `Bainbridge Island's local services include Kitsap Public Utility District for water
and electricity, Bainbridge Island School District (BISD) for public K-12 education, and Bainbridge
Island Fire Department for emergency services. The island is connected to Seattle and the mainland
via Washington State Ferries — the Bainbridge Island ferry route (to Seattle's Coleman Dock) is
one of the busiest in the system and takes approximately 35 minutes. State Route 305 is the primary
road artery through the island connecting the ferry dock to the Agate Pass Bridge, which links the
island to the Kitsap Peninsula. The Agate Pass Bridge opened in 1950. Write questions about the
Bainbridge Island School District, the ferry route to Seattle, State Route 305, the Agate Pass
Bridge, and Kitsap County as the island's county government context.`,
    },
  ],

  topicDistribution: {
    'city-government': 20,
    'japanese-american-history': 20,
    'founding-industrial-history': 18,
    'landmarks-culture': 18,
    'community-environment': 14,
    'local-services': 10,
  },

  officeholders: [
    { name: 'Clarence Moriwaki', role: 'Mayor', district: 'Central Ward, District 5', termEnd: '2029-12-31T00:00:00Z' },
    { name: 'Kirsten Hytopoulos', role: 'Deputy Mayor / At-Large Councilmember', district: 'At-Large, District 1', termEnd: '2027-12-31T00:00:00Z' },
    { name: 'Brenda Fantroy-Johnson', role: 'Councilmember', district: 'North Ward, District 2', termEnd: '2027-12-31T00:00:00Z' },
    { name: 'Mike Nelson', role: 'Councilmember', district: 'South Ward, District 3', termEnd: '2029-12-31T00:00:00Z' },
    { name: 'Leslie Schneider', role: 'Councilmember', district: 'Central Ward, District 4', termEnd: '2027-12-31T00:00:00Z' },
    { name: 'Ashley Mathews', role: 'Councilmember', district: 'South Ward, District 6', termEnd: '2027-12-31T00:00:00Z' },
    { name: 'Lara Lant', role: 'Councilmember', district: 'North Ward, District 7', termEnd: '2029-12-31T00:00:00Z' },
    { name: 'Drew Hansen', role: 'State Senator', district: '23rd Legislative District', termEnd: '2027-01-01T00:00:00Z' },
    { name: 'Tarra Simmons', role: 'State Representative, Position 1', district: '23rd Legislative District', termEnd: '2027-01-01T00:00:00Z' },
    { name: 'Greg Nance', role: 'State Representative, Position 2', district: '23rd Legislative District', termEnd: '2027-01-01T00:00:00Z' },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Bainbridge_Island,_Washington',
    'https://en.wikipedia.org/wiki/Bainbridge_Island_Japanese_American_Exclusion_Memorial',
    'https://en.wikipedia.org/wiki/Port_Blakely,_Bainbridge_Island,_Washington',
    'https://en.wikipedia.org/wiki/Fort_Ward_(Washington)',
    'https://en.wikipedia.org/wiki/Pickleball',
    'https://en.wikipedia.org/wiki/Washington%27s_23rd_legislative_district',
    'https://www.bainbridgewa.gov/217/City-Council',
    'https://en.wikipedia.org/wiki/Bainbridge_Island_Museum_of_Art',
  ],
};
