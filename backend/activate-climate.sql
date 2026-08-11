UPDATE trivia.collections
SET is_active = true, updated_at = NOW()
WHERE slug = 'climate-agreements';
