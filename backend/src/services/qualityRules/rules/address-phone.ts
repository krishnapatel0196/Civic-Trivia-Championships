/**
 * Address/Phone Detection Rule
 *
 * Detects phone numbers and street addresses in answer options.
 * Questions where answer choices contain contact information suggest
 * the question is testing memorization of contact details rather than
 * civic knowledge.
 *
 * This rule is ADVISORY — legitimate civic location questions can have
 * address-based answers (e.g., "Where is the Supreme Court located?").
 * Flagged questions require human review before any archival decision.
 *
 * CRITICAL: Scans ONLY question.options (the 4 answer choices).
 * Does NOT scan question.text or question.explanation.
 * Civic question bodies legitimately reference addresses
 * (e.g., "The Supreme Court is located at 1 First Street NE").
 */

import { RuleResult, QuestionInput, Violation } from '../types.js';

/**
 * US phone number pattern
 * Matches formats: 555-123-4567, (555) 123-4567, +1 555.123.4567, etc.
 */
const US_PHONE_REGEX = /(\+1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

/**
 * UK phone number pattern
 * Matches formats: +44 20 7946 0958, 020 7946 0958, etc.
 */
const UK_PHONE_REGEX = /(\+44[\s.-]?)?\(?0\d{1,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{4}/;

/**
 * Street address pattern
 * Matches: "123 Main Street", "456 Oak Ave", "1 First St NE", etc.
 */
const STREET_ADDRESS_REGEX =
  /\d{1,5}\s+[A-Za-z\s]{2,40}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl|Circle|Cir)\.?\b/i;

/**
 * Scan a single text string for phone/address patterns
 *
 * @param text - Text to scan
 * @returns Array of matched pattern descriptions
 */
function findContactPatterns(text: string): string[] {
  const matches: string[] = [];

  const usPhoneMatch = US_PHONE_REGEX.exec(text);
  if (usPhoneMatch) {
    matches.push(`US phone: "${usPhoneMatch[0].trim()}"`);
  }

  const ukPhoneMatch = UK_PHONE_REGEX.exec(text);
  if (ukPhoneMatch) {
    matches.push(`UK phone: "${ukPhoneMatch[0].trim()}"`);
  }

  const addressMatch = STREET_ADDRESS_REGEX.exec(text);
  if (addressMatch) {
    matches.push(`street address: "${addressMatch[0].trim()}"`);
  }

  return matches;
}

/**
 * ADVISORY RULE: Check for phone numbers or street addresses in answer options
 *
 * Scans ONLY answer options (not question text or explanation).
 * Produces ADVISORY violations (not blocking) because:
 * 1. Some civic questions legitimately test knowledge of physical locations
 * 2. Human review is needed before deciding to archive
 *
 * @param question - Question to evaluate
 * @returns Rule result with any violations found
 */
export function checkAddressPhone(question: QuestionInput): RuleResult {
  const violations: Violation[] = [];

  for (const option of question.options) {
    const matches = findContactPatterns(option);

    if (matches.length > 0) {
      violations.push({
        rule: 'address-phone',
        severity: 'advisory',
        message: 'Answer option contains a phone number or street address',
        evidence: matches.join('; ')
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations
  };
}
