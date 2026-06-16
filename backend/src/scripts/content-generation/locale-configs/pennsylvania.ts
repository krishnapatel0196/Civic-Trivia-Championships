import type { LocaleConfig } from './bloomington-in.js';

/**
 * Pennsylvania state locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - This is the COMMONWEALTH of Pennsylvania — always say "commonwealth" where relevant, not just "state"
 * - The legislature is called the "General Assembly" (not "State Legislature") — 50-member Senate + 203-member House
 * - Pennsylvania House has 203 members — the LARGEST lower chamber of any state legislature in the US
 * - Do NOT write questions about Philadelphia or Pittsburgh's local government — those belong to future city collections
 * - Independence Hall and Liberty Bell are national landmarks in Philadelphia but appropriate for STATE collection as
 *   they represent Pennsylvania's statehood role; do NOT ask about Philadelphia's mayor or city council
 * - "Pennsylvania Dutch" = descendants of German-speaking immigrants (NOT from Holland); "Dutch" = anglicization of "Deitsch"
 * - State capital is Harrisburg (NOT Philadelphia, which was the earlier colonial/national capital)
 * - No addresses or phone numbers in answer options (quality rule)
 * - No political party labels in any field — no Democrat/Republican/Independent anywhere
 *
 * CURRENT OFFICEHOLDERS:
 * - Governor: Josh Shapiro (term ends January 2027)
 * - Lieutenant Governor: Austin Davis (term ends January 2027)
 * - Attorney General: David W. Sunday Jr. (term ends ~January 2029)
 * - State Treasurer: Stacy Garrity (term ends ~January 2029)
 * - Auditor General: Timothy L. DeFoor (term ends ~January 2029)
 * - Supreme Court Chief Justice: Debra Todd (term ends December 2027)
 * - Senate President Pro Tempore: Kim Ward (session ends November 2026)
 * - House Speaker: Joanna McClinton (session ends November 2026)
 *
 * STATE-SCALE RULE: Questions must not overlap with any future city collections.
 * Test: "Could a future Philadelphia or Pittsburgh collection own this?" If yes, cut it.
 */
export const pennsylvaniaConfig: LocaleConfig = {
  locale: 'pennsylvania',
  name: 'Pennsylvania',
  externalIdPrefix: 'penns',
  collectionSlug: 'pennsylvania',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'penns-state-government',
      name: 'State Government',
      description:
        'Pennsylvania state government structure, the General Assembly (50-member Senate + 203-member House of Representatives — largest lower chamber in the US), the Governor, Lieutenant Governor, constitutional officers (Attorney General, Treasurer, Auditor General), Supreme Court, and state executive departments. Include questions about term lengths, how bills become law, the bicameral structure, and current leadership roles. The PA House has 2-year terms; the Senate has 4-year staggered terms. The governor serves 4-year terms and may serve two consecutive terms. Do NOT ask about city-level government.',
    },
    {
      slug: 'penns-founding-history',
      name: 'Founding & Colonial History',
      description:
        'William Penn receiving the royal charter from King Charles II on March 4, 1681, founding Pennsylvania as a "Holy Experiment" in religious freedom and democratic governance. Penn\'s Quaker faith, his land treaties with the Lenape people, his founding of Philadelphia in 1682 on a grid plan, and the colony\'s guarantees of free trial by jury and freedom of religion. The name Pennsylvania means "Penn\'s Woods" (sylvania = Latin for woods/forest). Pennsylvania became the 2nd state to ratify the U.S. Constitution on December 12, 1787. New Sweden occupied the southeastern portion 1638–1655. Include questions about Penn\'s constitutional innovations that influenced the Founding Fathers.',
    },
    {
      slug: 'penns-national-history',
      name: 'National Historical Role',
      description:
        'Pennsylvania\'s outsized role in founding the United States. The First and Second Continental Congress met in Philadelphia. The Declaration of Independence was adopted in Philadelphia on July 4, 1776. The Constitutional Convention met in Philadelphia from May 25 to September 17, 1787. Independence Hall hosted both documents. Philadelphia served as the U.S. capital during the Revolution and again in the 1790s. The Liberty Bell was commissioned in 1752, inscribed with Leviticus 25:10, cracked on first strike, and recast by Pass and Stow. Benjamin Franklin founded the University of Pennsylvania in 1740. Pennsylvania is called the "Keystone State" because of its geographic position bridging regions, like the central stone of an arch.',
    },
    {
      slug: 'penns-civil-war',
      name: 'Civil War Era',
      description:
        'The Battle of Gettysburg (July 1–3, 1863) — fought on Pennsylvania soil between Union forces under Gen. George G. Meade and Confederate forces under Gen. Robert E. Lee. Confederate defeat and Lee\'s retreat on July 4 is considered the Civil War\'s turning point. Casualties totaled 46,000–51,000 combined, making it the bloodiest battle in American military history to that point. Day 3\'s climax was Pickett\'s Charge. President Lincoln delivered the Gettysburg Address on November 19, 1863 (271 words, "Four score and seven years ago...") at the dedication of Soldiers\' National Cemetery. Harrisburg hosted Camp Curtin, the largest Union Army training camp of the Civil War. Pennsylvania contributed more troops than any other northern state.',
    },
    {
      slug: 'penns-landmarks-culture',
      name: 'Landmarks & Culture',
      description:
        'Pennsylvania State Capitol in Harrisburg: designed by Joseph Miller Huston, Beaux-Arts style, dedicated October 4, 1906, 272 feet tall, green-tiled dome weighing 26,000 tons inspired by St. Peter\'s Basilica, topped by the gilded "Commonwealth" statue by Roland Hinton Perry. Theodore Roosevelt called it "the handsomest building I ever saw." The rotunda floor features Henry Chapman Mercer handmade tiles with 254 scenes from Pennsylvania history. Hershey, PA: founded 1903 by Milton S. Hershey; home of the Hershey Company; Chocolate Avenue; "The Sweetest Place on Earth." Gettysburg National Cemetery and Battlefield. Pennsylvania Dutch Country around Lancaster. Independence Hall and Liberty Bell Center in Philadelphia (national landmarks appropriate for state-level questions). Do NOT ask about Philadelphia local government.',
    },
    {
      slug: 'penns-geography-symbols',
      name: 'Geography & State Symbols',
      description:
        'Pennsylvania geography: 46,055 square miles (33rd largest state), 60% forested, highest point Mount Davis at 3,213 feet. Major rivers: Delaware, Susquehanna, Allegheny, Monongahela, Ohio, Schuylkill. Pennsylvania has the highest density of waterways of any state in the continental US. The Ohio River forms at Pittsburgh where the Allegheny and Monongahela meet. Pittsburgh is known as the "City of Bridges" with 446 bridges. State symbols: nickname "Keystone State," motto "Virtue, Liberty, and Independence," state bird ruffed grouse, state flower mountain laurel, state tree eastern hemlock, state mammal white-tailed deer, state beverage milk. Pennsylvania borders 6 states: New York, New Jersey, Delaware, Maryland, West Virginia, Ohio — plus Lake Erie.',
    },
    {
      slug: 'penns-economy-industry',
      name: 'Economy & Industry',
      description:
        'Pennsylvania\'s historical economic dominance in steel (Carnegie Steel founded by Andrew Carnegie in Pittsburgh, 1875; by 1910 Pittsburgh produced 1/3 to 1/2 of US steel), coal (anthracite near Wilkes-Barre and Hazleton), and early oil production. Bethlehem Steel in Bethlehem was world-leading until 1982. Pennsylvania led the nation in kerosene production in the 19th century. The H.J. Heinz Company originated in Pittsburgh. The Hershey Company, founded by Milton S. Hershey in 1903, is North America\'s largest chocolate manufacturer. Pennsylvania ranks 5th nationally in population (~13.1 million). Modern economy includes healthcare, education (University of Pittsburgh, Carnegie Mellon, Penn State, Temple, Drexel), and pharmaceutical/biotech. Three Mile Island nuclear incident occurred in 1979 near Harrisburg.',
    },
  ],

  topicDistribution: {
    'penns-state-government': 20,
    'penns-founding-history': 17,
    'penns-national-history': 15,
    'penns-civil-war': 12,
    'penns-landmarks-culture': 16,
    'penns-geography-symbols': 12,
    'penns-economy-industry': 8,
  },

  officeholders: [
    { name: 'Josh Shapiro', role: 'Governor', termEnd: '2027-01-21T00:00:00Z' },
    { name: 'Austin Davis', role: 'Lieutenant Governor', termEnd: '2027-01-21T00:00:00Z' },
    { name: 'David W. Sunday Jr.', role: 'Attorney General', termEnd: '2029-01-21T00:00:00Z' },
    { name: 'Stacy Garrity', role: 'State Treasurer', termEnd: '2029-01-21T00:00:00Z' },
    { name: 'Timothy L. DeFoor', role: 'Auditor General', termEnd: '2029-01-21T00:00:00Z' },
    { name: 'Debra Todd', role: 'Supreme Court Chief Justice', termEnd: '2027-12-31T00:00:00Z' },
    { name: 'Kim Ward', role: 'Senate President Pro Tempore', termEnd: '2026-11-30T00:00:00Z' },
    { name: 'Joanna McClinton', role: 'House Speaker', termEnd: '2026-11-30T00:00:00Z' },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Pennsylvania',
    'https://en.wikipedia.org/wiki/Pennsylvania_General_Assembly',
    'https://en.wikipedia.org/wiki/Pennsylvania_State_Capitol',
    'https://en.wikipedia.org/wiki/William_Penn',
    'https://en.wikipedia.org/wiki/Independence_Hall',
    'https://en.wikipedia.org/wiki/Liberty_Bell',
    'https://en.wikipedia.org/wiki/Battle_of_Gettysburg',
    'https://en.wikipedia.org/wiki/Gettysburg_Address',
    'https://en.wikipedia.org/wiki/Hershey,_Pennsylvania',
    'https://en.wikipedia.org/wiki/Josh_Shapiro',
  ],
};
