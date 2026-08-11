SELECT COUNT(*) AS active_count
FROM trivia.questions q
JOIN trivia.collection_questions cq ON q.id = cq.question_id
JOIN trivia.collections c ON cq.collection_id = c.id
WHERE c.slug = 'climate-agreements'
  AND q.status = 'active'
  AND (q.expires_at IS NULL OR q.expires_at > NOW());
