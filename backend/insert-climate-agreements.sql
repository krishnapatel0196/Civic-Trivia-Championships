INSERT INTO trivia.collections (
  name, slug, description, locale_code, locale_name,
  icon_identifier, theme_color, tier, is_active, sort_order
) VALUES (
  'Climate Agreements',
  'climate-agreements',
  'The planet is at the table — are you?',
  'en-US',
  'Climate Agreements',
  'globe',
  '#065F46',
  'international',
  false,
  36
)
ON CONFLICT (slug) DO NOTHING;
