export interface CollectionSummary {
  id: number;
  name: string;
  slug: string;
  description: string;
  themeColor: string;        // 7-char hex e.g. '#1E3A8A'
  questionCount: number;
  tier: 'federal' | 'state' | 'city' | 'international';
  localeName?: string;       // e.g. "North Carolina", "United States"
  localeCode?: string;       // e.g. "NC", "US"
  latestQuestionAt?: string | null;
}
