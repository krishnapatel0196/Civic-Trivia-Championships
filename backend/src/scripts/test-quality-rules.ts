import { auditQuestion } from '../services/qualityRules/index.js';
import { QuestionInput } from '../services/qualityRules/types.js';

// Test question with ambiguous answers
const ambiguousQuestion: QuestionInput = {
  externalId: 'test-001',
  text: 'What is the capital of the United States?',
  options: [
    'Washington, DC',
    'Washington DC',
    'District of Columbia',
    'New York'
  ],
  correctAnswer: 0,
  explanation: 'Washington, DC is the capital.',
  difficulty: 'easy',
  source: { name: 'Test', url: 'https://example.com' }
};

// Test question with vague qualifiers
const vagueQuestion: QuestionInput = {
  externalId: 'test-002',
  text: 'What is the most important amendment to the Constitution?',
  options: ['First', 'Second', 'Fifth', 'Tenth'],
  correctAnswer: 0,
  explanation: 'This is subjective.',
  difficulty: 'medium',
  source: { name: 'Test', url: 'https://example.com' }
};

// Test pure lookup question
const lookupQuestion: QuestionInput = {
  externalId: 'test-003',
  text: 'In what year was the Taft-Hartley Act passed?',
  options: ['1947', '1948', '1949', '1950'],
  correctAnswer: 0,
  explanation: 'The Taft-Hartley Act was passed in 1947.',
  difficulty: 'hard',
  source: { name: 'Test', url: 'https://example.com' }
};

// Good question (should pass)
const goodQuestion: QuestionInput = {
  externalId: 'test-004',
  text: 'How many senators does each state have in the US Senate?',
  options: ['1', '2', '3', 'It varies by state population'],
  correctAnswer: 1,
  explanation: 'Each state has exactly 2 senators, regardless of population. This ensures equal representation in the Senate.',
  difficulty: 'easy',
  source: { name: 'Constitution', url: 'https://example.com' }
};

async function testRules() {
  console.log('=== TESTING QUALITY RULES ===\n');
  
  const result1 = await auditQuestion(ambiguousQuestion, { skipUrlCheck: true });
  console.log('Test 1: Ambiguous answers');
  console.log('- Score:', result1.score);
  console.log('- Blocking violations:', result1.hasBlockingViolations);
  console.log('- Violations:', result1.violations.map(v => `${v.rule} (${v.severity})`).join(', '));
  
  const result2 = await auditQuestion(vagueQuestion, { skipUrlCheck: true });
  console.log('\nTest 2: Vague qualifiers');
  console.log('- Score:', result2.score);
  console.log('- Blocking violations:', result2.hasBlockingViolations);
  console.log('- Violations:', result2.violations.map(v => `${v.rule} (${v.severity})`).join(', '));
  
  const result3 = await auditQuestion(lookupQuestion, { skipUrlCheck: true });
  console.log('\nTest 3: Pure lookup');
  console.log('- Score:', result3.score);
  console.log('- Blocking violations:', result3.hasBlockingViolations);
  console.log('- Violations:', result3.violations.map(v => `${v.rule} (${v.severity})`).join(', '));
  
  const result4 = await auditQuestion(goodQuestion, { skipUrlCheck: true });
  console.log('\nTest 4: Good question');
  console.log('- Score:', result4.score);
  console.log('- Blocking violations:', result4.hasBlockingViolations);
  console.log('- Violations:', result4.violations.map(v => `${v.rule} (${v.severity})`).join(', '));
  
  console.log('\n=== RESULTS ===');
  console.log('✓ Ambiguous detection:', result1.hasBlockingViolations ? 'WORKS' : 'FAILED');
  console.log('✓ Vague qualifier detection:', result2.hasBlockingViolations ? 'WORKS' : 'FAILED');
  console.log('✓ Pure lookup detection:', result3.hasBlockingViolations ? 'WORKS' : 'FAILED');
  console.log('✓ Good question passes:', !result4.hasBlockingViolations ? 'WORKS' : 'FAILED');
}

testRules().catch(console.error);
