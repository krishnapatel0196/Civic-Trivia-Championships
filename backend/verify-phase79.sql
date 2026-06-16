SELECT c.slug, c.tier, c.is_active,
  COUNT(CASE WHEN q.status = 'active' AND (q.expires_at IS NULL OR q.expires_at > NOW()) THEN 1 END) AS active_questions,
  MAX(q.created_at) AS latest_question_at
FROM trivia.collections c
LEFT JOIN trivia.collection_questions cq ON c.id = cq.collection_id
LEFT JOIN trivia.questions q ON cq.question_id = q.id
WHERE c.slug IN ('war-in-iran', 'climate-agreements')
GROUP BY c.id, c.slug, c.tier, c.is_active;
