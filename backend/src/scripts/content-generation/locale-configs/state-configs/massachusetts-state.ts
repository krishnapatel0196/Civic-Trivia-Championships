import type { LocaleConfig } from '../bloomington-in.js';

/**
 * Massachusetts state configuration for civic trivia question generation.
 * Used by generate-locale-questions.ts to produce the Massachusetts state collection.
 *
 * CRITICAL ACCURACY NOTES:
 * - The state legislature is called "the General Court" — NEVER "state legislature," "state assembly," etc.
 * - The Governor's Council is an 8-member elected body — one of MA's most distinctive civic structures
 * - The 1780 Constitution is the world's OLDEST FUNCTIONING WRITTEN CONSTITUTION still in use (precise superlative)
 * - Massachusetts abolished most county governments in the late 1990s — counties are geographic/judicial districts only
 * - MCAS is no longer a high school graduation requirement as of late 2025 — frame carefully
 * - Boston city facts are NOT Massachusetts state facts
 * - Federal subjects (US Senators Warren and Markey) are NOT state subjects
 */
export const massachusettsStateConfig: LocaleConfig = {
  locale: 'massachusetts-state',
  name: 'Massachusetts',
  externalIdPrefix: 'mas',
  collectionSlug: 'massachusetts-state',
  targetQuestions: 100,
  batchSize: 25,

  topicCategories: [
    // Government Structure (~40%)
    {
      slug: 'general-court',
      name: 'General Court',
      description: 'The Massachusetts General Court — the official name of the state legislature. Bicameral: 40-member Senate and 160-member House of Representatives. Composition, powers, how bills become law, legislative sessions, leadership.',
    },
    {
      slug: 'governor-executive',
      name: 'Governor & Executive Branch',
      description: 'Governor, Lieutenant Governor, and other elected constitutional officers (Attorney General, Treasurer, Auditor, Secretary of State). Term limits, executive powers, elected statewide offices.',
    },
    {
      slug: 'governors-council',
      name: "Governor's Council",
      description: "The Massachusetts Governor's Executive Council — an 8-member elected body (plus Lt. Governor as ex officio) that confirms gubernatorial appointments to the judiciary and other positions. One of the few such bodies remaining in any US state.",
    },
    {
      slug: 'state-courts',
      name: 'State Courts & Judiciary',
      description: 'Massachusetts court system: Supreme Judicial Court (SJC), Appeals Court, Superior Court, District Courts. Judicial selection process, landmark SJC decisions, relationship to federal courts.',
    },
    // Civic Processes (~30%)
    {
      slug: 'elections-voting',
      name: 'Elections & Voting',
      description: 'State election procedures, voter registration, election administration, legislative and statewide election cycles, ballot questions.',
    },
    {
      slug: 'civic-policy',
      name: 'Civic Policy & Home Rule',
      description: 'Major state civic policy milestones (2006 Chapter 58 health reform, clean energy policy), home rule structure (1966 constitutional amendment), relationship between state and municipalities, county government abolition.',
    },
    // Broader Civics (~30%)
    {
      slug: 'civic-history',
      name: 'Massachusetts Civic History',
      description: "Massachusetts civic history: Mayflower Compact (1620), colonial government, Shays' Rebellion (1786-1787), abolitionism (William Lloyd Garrison, Massachusetts Anti-Slavery Society), women's suffrage, landmark SJC decisions with civic significance (Goodridge v. Dept. of Public Health, 2003).",
    },
    {
      slug: 'state-constitution',
      name: 'Massachusetts Constitution',
      description: "The Massachusetts Constitution of 1780 — the world's oldest functioning written constitution still in use, drafted primarily by John Adams. Key provisions, the Declaration of Rights, constitutional amendment process.",
    },
  ],

  topicDistribution: {
    // Government Structure (40 questions)
    'general-court': 15,
    'governor-executive': 12,
    'governors-council': 8,
    'state-courts': 5,
    // Civic Processes (30 questions)
    'elections-voting': 15,
    'civic-policy': 15,
    // Broader Civics (30 questions)
    'civic-history': 15,
    'state-constitution': 15,
  },

  sourceUrls: [
    // Massachusetts state government
    'https://www.mass.gov',
    'https://www.mass.gov/topics/state-government',
    // Massachusetts General Court (legislature)
    'https://malegislature.gov',
    'https://malegislature.gov/Legislators/Members/Senate',
    'https://malegislature.gov/Legislators/Members/House',
    // Governor
    'https://www.mass.gov/orgs/governor-maura-healey-and-lt-governor-kim-driscoll',
    // Governor's Council
    'https://www.mass.gov/orgs/governors-council',
    // Secretary of State
    'https://www.sec.state.ma.us',
    // Massachusetts Constitution
    'https://www.mass.gov/guides/john-adams-the-massachusetts-constitution',
    'https://www.mass.gov/info-details/researching-the-history-of-amendments-to-the-massachusetts-constitution',
    // State courts
    'https://www.mass.gov/orgs/massachusetts-court-system',
    // Elections
    'https://www.sec.state.ma.us/ele',
    // Historical sources (supplementary)
    'https://en.wikipedia.org/wiki/Massachusetts',
    'https://en.wikipedia.org/wiki/Massachusetts_General_Court',
    'https://en.wikipedia.org/wiki/Constitution_of_Massachusetts',
    "https://en.wikipedia.org/wiki/Massachusetts_Governor%27s_Council",
    // Journalism
    'https://www.wbur.org',
  ],
};

/**
 * Massachusetts-specific features to inject into state system prompt.
 * This string is passed to buildStateSystemPrompt() and serves as all voice guidance
 * for Massachusetts question generation. No changes to system-prompt.ts are needed.
 */
export const massachusettsStateFeatures = `
Massachusetts has several unique features in its state government that MUST be accurately represented:

**CRITICAL: THE LEGISLATURE IS CALLED "THE GENERAL COURT"**
- NEVER call it "the state legislature," "state assembly," "state congress," or any other generic name
- The official name is the Massachusetts General Court — this is one of the most distinctive facts about Massachusetts civic government
- Bicameral: 40 Senate members (Senate districts) and 160 House of Representatives members
- Two-year sessions; members serve 2-year terms
- Senate President: Karen Spilka. Speaker of the House: Ron Mariano (as of 2025-2026 session)
- Legislative elections November 2024 → terms end January 2027

**GOVERNOR'S COUNCIL (GOVERNOR'S EXECUTIVE COUNCIL)**
- Massachusetts has an 8-member elected Governor's Council (plus Lt. Governor as ex officio member)
- The Council is elected by district every two years
- Its primary civic role: recording advice and consent on gubernatorial appointments to the judiciary, Parole Board, Appellate Tax Board, and other positions; also warrants for the state treasury and pardons/commutations
- This is one of the only such bodies remaining in any US state — it is genuinely distinctive and surprising civic trivia
- Governor's Council elections: November 2026 (current Councillors' terms end January 2027)

**CURRENT ELECTED OFFICIALS AND EXPIRATION DATES**
- Governor: Maura Healey (assumed office January 2023, 4-year term) → expiresAt: "2027-01-15T00:00:00Z"
- Lieutenant Governor: Kim Driscoll → expiresAt: "2027-01-15T00:00:00Z"
- Attorney General: Andrea Campbell (assumed office January 2023) → expiresAt: "2027-01-15T00:00:00Z"
- Treasurer: Deb Goldberg → expiresAt: "2027-01-15T00:00:00Z"
- Secretary of State: William Galvin (long-serving; term ends January 2027) → expiresAt: "2027-01-15T00:00:00Z"
- State Senate/House members: terms end January 2027 → expiresAt: "2027-01-01T00:00:00Z"
- Structural/historical questions: expiresAt: null
- Target roughly 50% expiring, 50% durable questions

**MASSACHUSETTS CONSTITUTION OF 1780**
- Drafted primarily by John Adams
- Ratified June 15, 1780; effective October 25, 1780
- The world's OLDEST FUNCTIONING WRITTEN CONSTITUTION still in use — use this precise superlative, not "one of the oldest"
- Served as a model for the US Constitution (1787)
- Includes a Declaration of Rights (predating the Bill of Rights)
- The constitutional amendment process requires two consecutive General Court sessions plus voter approval

**COUNTY GOVERNMENT ABOLITION**
- Massachusetts abolished most county governments in the late 1990s under Chapter 34B (Mass. General Laws)
- Abolished counties include: Middlesex, Hampden, Worcester, Hampshire, Essex, Berkshire (six of 14)
- Counties now function as geographic/judicial districts, NOT as units of government
- Sheriffs remain as elected officials but are now state employees (e.g., Middlesex Sheriff became a state agency in 1997)
- Do NOT write questions implying counties have elected executives or county commissions

**CIVIC POLICY MILESTONES (non-partisan framing required)**
- 2006 Chapter 58 Health Reform: Massachusetts was the first state to pass near-universal health care coverage. Signed by Governor Mitt Romney on April 12, 2006. Created the Health Connector. Became model for the 2010 ACA. Frame as civic milestone — what it DID (near-universal coverage, employer requirements, state insurance exchange), not which party supported or opposed it.
- 2004 Goodridge v. Department of Public Health: The Massachusetts Supreme Judicial Court (SJC) ruled that the Massachusetts Constitution requires the state to recognize same-sex marriage. Decision: November 18, 2003; first licenses issued May 17, 2004. Massachusetts was the FIRST US state to legally recognize same-sex marriage. Frame structurally — what the SJC decided and why it was constitutionally grounded.
- MCAS: The Massachusetts Comprehensive Assessment System is the state's standardized test. Note: as of late 2025, MCAS is no longer required for high school graduation (this changed). Frame questions carefully — "what does MCAS stand for?" and "what does MCAS measure?" are safe; avoid asserting it is a graduation requirement.
- Clean energy: Massachusetts has enacted significant renewable energy legislation (offshore wind, clean energy standards). Frame civically: who sets energy policy, what agencies govern it, not partisan outcomes.

**HOME RULE STRUCTURE**
- Massachusetts granted home rule authority to cities and towns via a 1966 constitutional amendment (effective 1967)
- Municipalities may self-govern on matters not inconsistent with state law
- State legislature cannot enact special laws affecting a single municipality without that community's consent (with narrow exceptions)

**SHAYS' REBELLION (1786-1787)**
- Armed uprising by Western Massachusetts farmers protesting debt and tax collection
- Led by Daniel Shays, a Revolutionary War veteran
- Rebels closed courts, liberated debtors from jail, attempted to seize the Springfield Armory
- Significance: accelerated calls to reform the Articles of Confederation, contributing to the 1787 Constitutional Convention
- The Massachusetts legislature subsequently eased debtor laws as a result

**CIVIC HISTORY ANCHORS**
- Mayflower Compact (1620): one of the earliest frameworks for self-governance in North America
- Plymouth Colony (1620) and Massachusetts Bay Colony (1630) — two distinct original settlements
- Abolitionism: Massachusetts was a center of the abolitionist movement; William Lloyd Garrison founded The Liberator newspaper in Boston (1831); Massachusetts Anti-Slavery Society (1835)
- Women's suffrage: Massachusetts ratified the 19th Amendment in 1920; key organizing history

**WHAT TO AVOID**
- Don't write questions about Federal-level subjects: Massachusetts US Senators (Senators Warren and Markey are federal subjects, not state subjects)
- Don't write questions about Boston city government: Boston City Council, Boston Mayor are city — not state — subjects
- Don't write questions about private companies: Raytheon, Fidelity, General Electric are out of scope
- Don't write questions about Boston sports teams or Harvard/MIT as institutions
- Don't write questions about current-year specific events — stick to structural facts and established civic history
- Apply the dinner party test: "Is this a surprising, shareable civic tidbit?" PASS examples: "What's the official name of the Massachusetts state legislature?" FAIL examples: "What is the budget for the Massachusetts Department of Revenue?"
`;
