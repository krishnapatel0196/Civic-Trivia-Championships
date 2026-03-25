import type { LocaleConfig } from './bloomington-in.js';

/**
 * Philadelphia, PA locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - Philadelphia IS the county — it is a consolidated city-county. "Philadelphia County" and
 *   "City of Philadelphia" refer to the same government. Do NOT write questions that distinguish
 *   a separate county government from the city government.
 * - This collection covers Independence Hall and the Liberty Bell as PHILADELPHIA CITY landmarks.
 *   The Pennsylvania state collection covered them from a statewide national history angle.
 *   Philadelphia questions may approach these landmarks from a local/city angle (e.g., location
 *   in Old City, the Liberty Bell Center) but avoid duplicating exact PA state collection questions.
 * - Do NOT ask about Pennsylvania state government officials (governor, General Assembly, etc.)
 * - City Council: 17 members total — 10 district (one per geographic district) + 7 at-large.
 *   Both groups serve 4-year terms. Current terms expire January 2028.
 * - The "Curse of Billy Penn": informal height agreement broken in 1987 by One Liberty Place;
 *   Philadelphia went 25 years without a championship; broken by Phillies' 2008 World Series win.
 * - No addresses or phone numbers in answer options (quality rule)
 * - No political party labels in any field — no Democrat/Republican/Independent anywhere
 *
 * CURRENT OFFICEHOLDERS:
 * - Mayor: Cherelle Parker (took office January 1, 2024; term ends January 2028)
 * - City Council President: Kenyatta Johnson (District 2; term ends January 2028)
 * - District Attorney: Larry Krasner (third term; sworn in January 2026; term ends ~January 2030)
 * - City Controller: Christy Brady (second term; sworn in January 2026; term ends ~January 2030)
 * - Council At-Large Majority Leader: Katherine Gilmore Richardson (term ends January 2028)
 * - Council At-Large Minority Leader: Kendra Brooks (term ends January 2028)
 */
export const philadelphiaPaConfig: LocaleConfig = {
  locale: 'philadelphia-pa',
  name: 'Philadelphia, PA',
  externalIdPrefix: 'phipa',
  collectionSlug: 'philadelphia-pa',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'phipa-city-government',
      name: 'City Government',
      description:
        'Philadelphia city government: mayor-council system, consolidated city-county status (city and county are the same government), 17-member City Council (10 district + 7 at-large), term lengths (4 years), current Mayor Cherelle Parker (2024–2028), Council President Kenyatta Johnson, District Attorney Larry Krasner, City Controller Christy Brady. Include questions about council structure, how city-county consolidation works, independently elected offices, and the mayor\'s powers. Do NOT ask about Pennsylvania state government officials. Do NOT include addresses or phone numbers in any answer option.',
    },
    {
      slug: 'phipa-founding-history',
      name: 'Founding & Early History',
      description:
        'William Penn founded Philadelphia in 1682 between the Schuylkill and Delaware rivers. The city name comes from Greek for "brotherly love" (philos = love, adelphos = brother). Penn envisioned a grid city of spacious homes but residents crowded the Delaware River port instead. Penn purchased the land from the Lenape people. Philadelphia was the colonial capital of Pennsylvania and the most important colonial British North American city. Penn\'s grid plan featured numbered streets one direction and tree-named avenues the other. Philadelphia was the largest city in the American colonies and the young United States.',
    },
    {
      slug: 'phipa-american-revolution',
      name: 'American Revolution & National History',
      description:
        'Philadelphia\'s central role in American history: First Continental Congress (1774) met at Carpenters\' Hall; Second Continental Congress met here 1775–1783; Declaration of Independence adopted at Independence Hall July 4, 1776; Constitutional Convention held at Independence Hall May 25–September 17, 1787; Philadelphia served as the U.S. capital 1790–1800 while Washington D.C. was under construction. Independence Hall is a UNESCO World Heritage Site (1979). The Liberty Bell was commissioned 1752, cracked, recast by Pass and Stow, and is now housed in the Liberty Bell Center (since 2003). Philadelphia holds 67 National Historic Landmarks.',
    },
    {
      slug: 'phipa-landmarks-culture',
      name: 'Landmarks & Culture',
      description:
        'Philadelphia City Hall: located at Broad and Market Streets (1 Penn Square), Second Empire architectural style, built 1871–1901, 548 feet tall including the 37-foot bronze William Penn statue by sculptor Alexander Milne Calder, world\'s largest free-standing masonry building, ~700 rooms. The William Penn statue height (548 ft) was an informal ceiling until One Liberty Place broke it in 1987. Reading Terminal Market: opened 1893 under the Reading Railroad train shed, 100+ merchants, one of the oldest continuously operating public markets in the U.S. Eastern State Penitentiary: opened 1829, Gothic Revival, world\'s first true penitentiary, notable inmates Al Capone and Willie Sutton. Philadelphia Museum of Art: 240,000+ objects, established 1876, famous for the 72 "Rocky Steps" from the 1976 film. Fairmount Park: 2,052 acres, Philadelphia\'s largest park, contains Boathouse Row. Benjamin Franklin Parkway: modeled on the Champs-Élysées, connects City Hall to the Art Museum. Mural Arts Philadelphia: founded 1986 by Jane Golden, 4,000+ murals, nation\'s largest public art program.',
    },
    {
      slug: 'phipa-sports-entertainment',
      name: 'Sports & Entertainment',
      description:
        'Philadelphia sports teams: Eagles (NFL, founded 1933, Super Bowl LII 2018, Super Bowl LIX 2025), Phillies (MLB, founded 1883, oldest continuous one-name one-city pro sports franchise, World Series 1980 and 2008), 76ers (NBA, originally Syracuse Nationals 1946, moved to Philadelphia 1963, championships 1967 and 1983), Flyers (NHL, founded 1967, "Broad Street Bullies" nickname, Stanley Cup 1974 and 1975 — first NHL expansion team to win the Cup). All four major venues are in the South Philadelphia Sports Complex. The Philadelphia cheesesteak was invented in the early 1930s by Pat Olivieri; Cheez Whiz is the most popular cheese at Pat\'s King of Steaks. The "Curse of Billy Penn" (1987–2008): One Liberty Place broke the informal height agreement; 25 years without a major sports championship; broken by Phillies\' 2008 World Series win.',
    },
    {
      slug: 'phipa-education-institutions',
      name: 'Education & Institutions',
      description:
        'University of Pennsylvania: founded 1740 by Benjamin Franklin (chartered 1755), University City in West Philadelphia, Ivy League, first medical school in North America (1765), first collegiate business school (Wharton School, 1881), first American student union (Houston Hall, 1896). Temple University: founded 1884 by Baptist minister Russell Conwell, North Philadelphia. Drexel University: founded 1891 by financier Anthony J. Drexel, known for its co-op program, acquired the Academy of Natural Sciences (America\'s oldest natural history museum, 1812) in 2011. Philadelphia Orchestra: founded 1900 by Fritz Scheel, one of the "Big Five" American orchestras, home at Kimmel Center since 2001, pioneered electrical recordings, radio broadcasts, television, and China tour (1973). Barnes Foundation: founded 1922 by Albert C. Barnes, contains 181 Renoirs and 69 Cézannes, collection ~$25 billion, moved from Merion to Parkway 2012. Philadelphia Zoo: first U.S. zoo, opened July 1, 1874 (chartered 1859 by Pennsylvania legislature).',
    },
    {
      slug: 'phipa-neighborhoods-services',
      name: 'Neighborhoods & City Services',
      description:
        'SEPTA (Southeastern Pennsylvania Transportation Authority): established 1963 by Pennsylvania General Assembly, commenced operations 1964, only U.S. transit authority operating all five types of terrestrial transit (motorbuses, trolleybuses, light rail, rapid transit, commuter rail), serves five counties (Philadelphia, Delaware, Montgomery, Bucks, Chester), sixth-largest rapid transit system in the U.S. Key neighborhoods: Old City (historic, Independence Hall area), Society Hill (colonial residential, one of oldest), University City (Penn and Drexel), Fishtown (arts/revitalization, Delaware River), South Philadelphia (sports stadiums, Italian Market), Center City (downtown core). 30th Street Station: opened 1933, third-busiest Amtrak hub nationally, renamed William H. Gray III 30th Street Station in 2020. Philadelphia population: approximately 1.6 million (2020 census), 6th largest U.S. city, 1st in Pennsylvania. Philadelphia has more outdoor sculptures and murals than any other American city.',
    },
  ],

  topicDistribution: {
    'phipa-city-government': 20,
    'phipa-founding-history': 14,
    'phipa-american-revolution': 14,
    'phipa-landmarks-culture': 18,
    'phipa-sports-entertainment': 12,
    'phipa-education-institutions': 13,
    'phipa-neighborhoods-services': 9,
  },

  officeholders: [
    { name: 'Cherelle Parker', role: 'Mayor', termEnd: '2028-01-01T00:00:00Z' },
    { name: 'Kenyatta Johnson', role: 'City Council President (District 2)', termEnd: '2028-01-01T00:00:00Z' },
    { name: 'Larry Krasner', role: 'District Attorney', termEnd: '2030-01-01T00:00:00Z' },
    { name: 'Christy Brady', role: 'City Controller', termEnd: '2030-01-01T00:00:00Z' },
    { name: 'Katherine Gilmore Richardson', role: 'City Council At-Large Majority Leader', termEnd: '2028-01-01T00:00:00Z' },
    { name: 'Kendra Brooks', role: 'City Council At-Large Minority Leader', termEnd: '2028-01-01T00:00:00Z' },
    { name: 'Mark Squilla', role: 'City Council District 1', termEnd: '2028-01-01T00:00:00Z' },
    { name: 'Isaiah Thomas', role: 'City Council At-Large Majority Whip', termEnd: '2028-01-01T00:00:00Z' },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Philadelphia',
    'https://en.wikipedia.org/wiki/Philadelphia_City_Hall',
    'https://en.wikipedia.org/wiki/Philadelphia_City_Council',
    'https://en.wikipedia.org/wiki/Cherelle_Parker',
    'https://en.wikipedia.org/wiki/Eastern_State_Penitentiary',
    'https://en.wikipedia.org/wiki/Reading_Terminal_Market',
    'https://en.wikipedia.org/wiki/Philadelphia_Museum_of_Art',
    'https://en.wikipedia.org/wiki/Fairmount_Park',
    'https://en.wikipedia.org/wiki/Philadelphia_Eagles',
    'https://en.wikipedia.org/wiki/University_of_Pennsylvania',
    'https://en.wikipedia.org/wiki/SEPTA',
    'https://en.wikipedia.org/wiki/Philadelphia_Zoo',
  ],
};
