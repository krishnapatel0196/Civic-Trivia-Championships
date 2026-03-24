import type { NewCollection } from '../schema.js';

export const collectionsData: NewCollection[] = [
  {
    name: 'United States',
    slug: 'federal',
    description: 'How well do you really know Uncle Sam?',
    localeCode: 'en-US',
    localeName: 'United States',
    iconIdentifier: 'flag-us',
    themeColor: '#1E3A8A', // deep blue
    tier: 'federal',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Bloomington, IN',
    slug: 'bloomington-in',
    description: 'B-Town bragging rights are on the line!',
    localeCode: 'en-US',
    localeName: 'Bloomington, Indiana',
    iconIdentifier: 'flag-in',
    themeColor: '#991B1B', // deep red - Indiana
    tier: 'city',
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Fremont, CA',
    slug: 'fremont-ca',
    description: 'Five towns, one city — how well do you know Fremont?',
    localeCode: 'en-US',
    localeName: 'Fremont, California',
    iconIdentifier: 'flag-ca',
    themeColor: '#047857', // emerald green
    tier: 'city',
    isActive: false, // Activate in Phase 25 after questions reviewed
    sortOrder: 3
  },
  {
    name: 'Los Angeles, CA',
    slug: 'los-angeles-ca',
    description: 'Think you know the City of Angels?',
    localeCode: 'en-US',
    localeName: 'Los Angeles, California',
    iconIdentifier: 'flag-ca',
    themeColor: '#0369A1', // ocean blue - California
    tier: 'city',
    isActive: true,
    sortOrder: 4 // Updated from 3 to accommodate Fremont
  },
  {
    name: 'Indiana',
    slug: 'indiana-state',
    description: 'How well do you know the Crossroads of America?',
    localeCode: 'en-US',
    localeName: 'Indiana',
    iconIdentifier: 'state',
    themeColor: '#1E3A8A', // deep blue - state
    tier: 'state',
    isActive: true,
    sortOrder: 5
  },
  {
    name: 'California',
    slug: 'california-state',
    description: 'The Golden State awaits — test your California civics!',
    localeCode: 'en-US',
    localeName: 'California',
    iconIdentifier: 'state',
    themeColor: '#92400E', // golden brown - California
    tier: 'state',
    isActive: true,
    sortOrder: 6
  },
  {
    name: 'Norwich, England',
    slug: 'norwich-uk',
    description: 'Local democracy, history & culture in the heart of Norfolk',
    localeCode: 'en-GB',
    localeName: 'Norwich, England',
    iconIdentifier: 'flag-gb',
    themeColor: '#1B4332', // deep forest green (visually distinct from all existing colors)
    tier: 'city',
    isActive: false,      // activated after questions are seeded
    sortOrder: 7
  },
  {
    name: 'Cambridge, MA',
    slug: 'cambridge-ma',
    description: 'From Harvard Square to City Hall — think you know Cambridge, MA?',
    localeCode: 'en-US',
    localeName: 'Cambridge, Massachusetts',
    iconIdentifier: 'flag-ma',
    themeColor: '#1E3A5F',
    tier: 'city',
    isActive: false,
    sortOrder: 8
  },
  {
    name: 'Massachusetts',
    slug: 'massachusetts-state',
    description: "Can the Bay State's oldest democracy stump you?",
    localeCode: 'en-US',
    localeName: 'Massachusetts',
    iconIdentifier: 'state',
    themeColor: '#0C2340',
    tier: 'state',
    isActive: false,
    sortOrder: 9
  },
  {
    name: 'Plano, TX',
    slug: 'plano-tx',
    description: 'The City of Excellence awaits — how well do you know Plano, TX?',
    localeCode: 'en-US',
    localeName: 'Plano, Texas',
    iconIdentifier: 'flag-tx',
    themeColor: '#B45309',
    tier: 'city',
    isActive: false,
    sortOrder: 10
  },
  {
    name: 'Texas',
    slug: 'texas-state',
    description: "Everything's bigger in Texas. So is the civics challenge.",
    localeCode: 'en-US',
    localeName: 'Texas',
    iconIdentifier: 'state',
    themeColor: '#BF0D3E',
    tier: 'state',
    isActive: false,
    sortOrder: 11
  },
  {
    name: 'Portland, OR',
    slug: 'portland-or',
    description: 'How well do you know the Rose City?',
    localeCode: 'en-US',
    localeName: 'Portland, Oregon',
    iconIdentifier: 'flag-or',
    themeColor: '#1B6B3A',
    tier: 'city',
    isActive: false,
    sortOrder: 12
  },
  {
    name: 'Oregon',
    slug: 'oregon-state',
    description: "Can you pass the Beaver State's civic test?",
    localeCode: 'en-US',
    localeName: 'Oregon',
    iconIdentifier: 'state',
    themeColor: '#1B4A1E',
    tier: 'state',
    isActive: false,
    sortOrder: 13
  },
  {
    name: 'Washington, DC',
    slug: 'washington-dc',
    description: 'The District has no senators. Does that stump you?',
    localeCode: 'en-US',
    localeName: 'Washington, DC',
    iconIdentifier: 'flag-us',
    themeColor: '#C41E3A',
    tier: 'city',
    isActive: false,
    sortOrder: 14
  },
  {
    name: 'Biloxi, MS',
    slug: 'biloxi-ms',
    description: "The Seafood Capital of the World is betting you don't know it.",
    localeCode: 'en-US',
    localeName: 'Biloxi, MS',
    iconIdentifier: 'flag-ms',
    themeColor: '#0077A8',
    tier: 'city',
    isActive: false,
    sortOrder: 15
  },
  {
    name: 'Mississippi',
    slug: 'mississippi-state',
    description: 'Where the river meets the law.',
    localeCode: 'en-US',
    localeName: 'Mississippi',
    iconIdentifier: 'state',
    themeColor: '#1A3A5C',
    tier: 'state',
    isActive: false,
    sortOrder: 16
  },
  {
    name: 'Santa Monica, CA',
    slug: 'santa-monica-ca',
    description: 'Where Route 66 meets the Pacific.',
    localeCode: 'en-US',
    localeName: 'Santa Monica, California',
    iconIdentifier: 'flag-ca',
    themeColor: '#1E6B8A',
    tier: 'city',
    isActive: true,
    sortOrder: 17
  },
  {
    name: 'Indio, CA',
    slug: 'indio-ca',
    description: 'Where desert governance meets festival grounds',
    localeCode: 'en-US',
    localeName: 'Indio, California',
    iconIdentifier: 'flag-ca',
    themeColor: '#D97706',
    tier: 'city',
    isActive: false,
    sortOrder: 18
  },
  {
    name: 'Alexandria, LA',
    slug: 'alexandria-la',
    description: 'Think you know the Heart of Louisiana?',
    localeCode: 'en-US',
    localeName: 'Alexandria, Louisiana',
    iconIdentifier: 'flag-la',
    themeColor: '#1A4B8E',
    tier: 'city',
    isActive: false,
    sortOrder: 19
  },
  {
    name: 'Louisiana',
    slug: 'louisiana',
    description: 'Parishes, pelicans, and the Kingfish await.',
    localeCode: 'en-US',
    localeName: 'Louisiana',
    iconIdentifier: 'flag-louisiana',
    themeColor: '#003087',
    tier: 'state',
    isActive: false,
    sortOrder: 20
  },
  {
    name: 'Springfield, MO',
    slug: 'springfield-mo',
    description: 'How well do you know the Queen City of the Ozarks?',
    localeCode: 'en-US',
    localeName: 'Springfield, Missouri',
    iconIdentifier: 'flag-mo',
    themeColor: '#003DA5',
    tier: 'city',
    isActive: false,
    sortOrder: 21
  },
  {
    name: 'St. Louis, MO',
    slug: 'st-louis-mo',
    description: 'The Gateway City is calling — are you ready to answer?',
    localeCode: 'en-US',
    localeName: 'St. Louis, Missouri',
    iconIdentifier: 'flag-mo',
    themeColor: '#BE1E2D',
    tier: 'city',
    isActive: false,
    sortOrder: 22
  },
  {
    name: 'Missouri',
    slug: 'missouri',
    description: 'Can the Show-Me State stump you?',
    localeCode: 'en-US',
    localeName: 'Missouri',
    iconIdentifier: 'flag-missouri',
    themeColor: '#002868',
    tier: 'state',
    isActive: false,
    sortOrder: 23
  },
  {
    name: 'Arizona',
    slug: 'arizona',
    description: '48 states entered the Union — Arizona made them wait.',
    localeCode: 'en-US',
    localeName: 'Arizona',
    iconIdentifier: 'flag-arizona',
    themeColor: '#003B7D',
    tier: 'state',
    isActive: false,
    sortOrder: 24
  },
  {
    name: 'Tucson, AZ',
    slug: 'tucson-az',
    description: 'Older than Arizona itself — do you know the Old Pueblo?',
    localeCode: 'en-US',
    localeName: 'Tucson, Arizona',
    iconIdentifier: 'flag-az',
    themeColor: '#CC5200',
    tier: 'city',
    isActive: false,
    sortOrder: 25
  },
  {
    name: 'Phoenix, AZ',
    slug: 'phoenix-az',
    description: 'Rise from the ashes — how well do you know Phoenix?',
    localeCode: 'en-US',
    localeName: 'Phoenix, Arizona',
    iconIdentifier: 'flag-az',
    themeColor: '#8C1D40',
    tier: 'city',
    isActive: false,
    sortOrder: 26
  },
  {
    name: 'Asheville, NC',
    slug: 'asheville-nc',
    description: 'How well do you really know the Land of the Sky?',
    localeCode: 'en-US',
    localeName: 'Asheville, North Carolina',
    iconIdentifier: 'flag-nc',
    themeColor: '#4A6FA5',
    tier: 'city',
    isActive: false,
    sortOrder: 27
  },
];
