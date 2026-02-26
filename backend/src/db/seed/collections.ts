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
    isActive: true,
    sortOrder: 4 // Updated from 3 to accommodate Fremont
  },
  {
    name: 'Indiana State',
    slug: 'indiana-state',
    description: 'How well do you know the Crossroads of America?',
    localeCode: 'en-US',
    localeName: 'Indiana State',
    iconIdentifier: 'state',
    themeColor: '#1E3A8A', // deep blue - state
    isActive: true,
    sortOrder: 5
  },
  {
    name: 'California State',
    slug: 'california-state',
    description: 'The Golden State awaits — test your California civics!',
    localeCode: 'en-US',
    localeName: 'California State',
    iconIdentifier: 'state',
    themeColor: '#92400E', // golden brown - California
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
    isActive: false,      // activated after questions are seeded
    sortOrder: 7
  }
];
