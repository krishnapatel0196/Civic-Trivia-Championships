SELECT q.external_id, q.volatility, q.expires_at, q.created_at
FROM trivia.questions q
JOIN trivia.collection_questions cq ON q.id = cq.question_id
JOIN trivia.collections c ON cq.collection_id = c.id
WHERE c.slug = 'climate-agreements' AND q.status = 'active'
ORDER BY q.created_at DESC
LIMIT 5;
