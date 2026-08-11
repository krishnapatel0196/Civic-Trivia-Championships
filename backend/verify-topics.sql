SELECT c.slug, t.slug AS topic_slug, t.id AS topic_id
FROM trivia.collection_topics ct
JOIN trivia.collections c ON ct.collection_id = c.id
JOIN trivia.topics t ON ct.topic_id = t.id
WHERE c.slug = 'climate-agreements';
