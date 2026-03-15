import type { LocaleConfig } from './bloomington-in.js';

/**
 * Biloxi, MS locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - Biloxi is in Harrison County; the county seat is Gulfport -- do NOT attribute county government to Biloxi
 * - The man-made beach (26 miles) is the Harrison County Shore Protection Project beach --
 *   say 'Gulf Coast beach' or 'Biloxi area beach,' not 'within Biloxi city limits'
 * - ALL officeholder questions must have expiresAt: 2029-06-01T00:00:00Z -- verify during curation
 * - Casino questions cap at 9 -- trim during curation if casino content overflows
 * - Do NOT call Biloxi 'the gambling capital' -- primary frame is seafood heritage + civil rights history
 * - Beauvoir questions should be about the historic site, NOT general Jefferson Davis biography
 * - No addresses or phone numbers in answer options (quality rule)
 * - Ward 4 council member: verify 'Jamie Creel' vs. 'Fuller' on biloxi.ms.us before generation
 *
 * CURRENT OFFICEHOLDERS (all expire 2029-06-01T00:00:00Z):
 * - Mayor: Andrew "FoFo" Gilich, Jr. (3rd term, re-elected June 3, 2025, expires 2029-06-01)
 * - Ward 1: Wayne Gray
 * - Ward 2: Anthony Marshall
 * - Ward 3: Mike Nail
 * - Ward 4: Jamie Creel (VERIFY against biloxi.ms.us -- one source referenced 'Fuller')
 * - Ward 5: Paul Tisdale
 * - Ward 6: Kenny Glavan
 * - Ward 7: David Shoemaker
 */
export const biloxiMsConfig: LocaleConfig = {
  locale: 'biloxi-ms',
  name: 'Biloxi, MS',
  externalIdPrefix: 'bxl',
  collectionSlug: 'biloxi-ms',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description: "Strong Mayor-Council government adopted 1978 (effective 1981). Mayor: Andrew 'FoFo' Gilich, Jr. -- 3rd term, re-elected June 3, 2025, term expires 2029-06-01. 7-member City Council (one per ward), all elected June 2025, all expire 2029-06-01: Ward 1 Wayne Gray, Ward 2 Anthony Marshall, Ward 3 Mike Nail, Ward 4 Jamie Creel, Ward 5 Paul Tisdale, Ward 6 Kenny Glavan, Ward 7 David Shoemaker. ALL officeholder questions MUST have expiresAt: 2029-06-01T00:00:00Z. Mix of structure questions (durable) and current-officeholder questions (expiring, target 8-10 expiring from this topic).",
    },
    {
      slug: 'founding-history',
      name: 'Founding History',
      description: "Founded 1699 by Pierre Le Moyne d'Iberville as one of the oldest European settlements in the Gulf South. Capital of French Louisiana 1720-1723 (before New Orleans). Name origin: Biloxi people (indigenous Siouan-speaking nation, 'first people'). Explored and claimed for France. Harrison County established 1841. Biloxi incorporated as a city in 1838. Key dates and founding figures.",
    },
    {
      slug: 'seafood-heritage',
      name: 'Seafood Heritage',
      description: "Known as 'Seafood Capital of the World.' Historic seafood canneries (shrimp, oysters, crab) -- industry peak in early-to-mid 20th century. Maritime & Seafood Industry Museum (opened 1986, destroyed by Katrina 2005, rebuilt 2014 at new location on Point Cadet). Biloxi Schooner (replica oyster schooner). Vietnamese fishing community (arrived late 1970s-1980s, significant contribution to Gulf Coast fishing industry). Annual Blessing of the Fleet (since 1929, one of the oldest in the US).",
    },
    {
      slug: 'landmarks-culture',
      name: 'Landmarks & Culture',
      description: "Biloxi Lighthouse (cast-iron tower, built 1848, survives in US-90 highway median -- one of the few lighthouses in the middle of a highway). Beauvoir (last home of Jefferson Davis, now a museum -- questions about Beauvoir as a historic site, NOT Jefferson Davis biography). George Ohr ('Mad Potter of Biloxi,' pottery pioneer, Ohr-O'Keefe Museum designed by Frank Gehry). Mardi Gras in Biloxi (predates New Orleans Mardi Gras, documented celebrations since 1699). Gulf Coast beach (26-mile man-made beach -- Harrison County Shore Protection Project; say 'Gulf Coast beach' or 'Biloxi area beach,' NOT 'within Biloxi city limits').",
    },
    {
      slug: 'civil-rights',
      name: 'Civil Rights History',
      description: "Biloxi Wade-Ins (1959-1963): Dr. Gilbert R. Mason Sr. led beach desegregation protests, Bloody Sunday (April 24, 1960 -- white mob attacked Black beachgoers), resulted in beaches being closed rather than integrated. Federal court ruling (1968) ordered beach integration. Dr. Mason was the first Black physician to practice in Biloxi. Civil rights history is central to Biloxi's identity -- do not minimize or sensationalize.",
    },
    {
      slug: 'military-geography',
      name: 'Military & Geography',
      description: "Keesler Air Force Base (established 1941, named for 2nd Lt. Samuel R. Keesler Jr., 81st Training Wing -- premier electronics and computer training installation for the Air Force). Ship Island (part of Gulf Islands National Seashore, accessible by ferry from Biloxi, Fort Massachusetts on West Ship Island -- Civil War era). Harrison County geography: Biloxi is on a peninsula between Biloxi Bay and the Mississippi Sound. Biloxi is NOT the county seat of Harrison County -- that is Gulfport.",
    },
    {
      slug: 'casino-resilience',
      name: 'Casino & Resilience',
      description: "Mississippi Gaming Control Act of 1990 legalized dockside gaming along the Gulf Coast. First casinos opened 1992. Major casinos: Beau Rivage (MGM Resorts), Hard Rock, IP Casino Resort Spa, Golden Nugget. Hurricane Katrina (August 29, 2005) devastated Biloxi -- storm surge reached 28 feet, destroyed or severely damaged all 11 casinos, 90% of structures within half a mile of coast destroyed. Post-Katrina rebuild allowed casinos to build on land (previously required to be on water). Biloxi's recovery is a resilience story, not a gambling story. CAP: Maximum 9 questions on this topic -- trim during curation if casino content overflows.",
    },
  ],

  // Target question percentages per topic (sums to 100)
  topicDistribution: {
    'city-government': 20,
    'founding-history': 13,
    'seafood-heritage': 15,
    'landmarks-culture': 18,
    'civil-rights': 11,
    'military-geography': 13,
    'casino-resilience': 10,
  },

  officeholders: [
    { name: 'Andrew "FoFo" Gilich, Jr.', role: 'Mayor', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'Wayne Gray', role: 'City Council', district: 'Ward 1', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'Anthony Marshall', role: 'City Council', district: 'Ward 2', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'Mike Nail', role: 'City Council', district: 'Ward 3', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'Jamie Creel', role: 'City Council', district: 'Ward 4', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'Paul Tisdale', role: 'City Council', district: 'Ward 5', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'Kenny Glavan', role: 'City Council', district: 'Ward 6', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'David Shoemaker', role: 'City Council', district: 'Ward 7', termEnd: '2029-06-01T00:00:00Z' },
  ],

  // Wikipedia-first source URLs per carry-forward rule (Phase 58-02)
  // Do NOT use biloxi.ms.us as primary source -- government portal pages return navigation/sitemap content
  sourceUrls: [
    'https://en.wikipedia.org/wiki/Biloxi,_Mississippi',
    'https://en.wikipedia.org/wiki/Biloxi_Lighthouse',
    'https://en.wikipedia.org/wiki/Beauvoir_(Biloxi,_Mississippi)',
    'https://en.wikipedia.org/wiki/Biloxi_wade-ins',
    'https://en.wikipedia.org/wiki/Keesler_Air_Force_Base',
    'https://en.wikipedia.org/wiki/Maritime_%26_Seafood_Industry_Museum',
    'https://en.wikipedia.org/wiki/George_Ohr',
    'https://en.wikipedia.org/wiki/Gulf_Islands_National_Seashore',
    'https://en.wikipedia.org/wiki/Gilbert_R._Mason_Sr.',
    'https://en.wikipedia.org/wiki/Biloxi_people',
    'https://en.wikipedia.org/wiki/Hurricane_Katrina',
    'https://en.wikipedia.org/wiki/Beau_Rivage_(Biloxi)',
  ],
};
