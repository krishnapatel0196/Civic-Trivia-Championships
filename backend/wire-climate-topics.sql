INSERT INTO trivia.collection_topics (collection_id, topic_id, created_at)
SELECT c.id, t.id, NOW()
FROM trivia.collections c
CROSS JOIN trivia.topics t
WHERE c.slug = 'climate-agreements'
  AND t.slug = 'world-news'
ON CONFLICT DO NOTHING;
