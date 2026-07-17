import { describe, expect, it } from 'vitest';
import {
  FALLBACK_SEARCH_TERMS,
  generateAltText,
  getCombinedSearchTerms,
  getSearchTermsForCategory,
  getSearchTermsForTopic,
} from './search-terms.js';

describe('getSearchTermsForCategory', () => {
  it('normalizes a display-cased category to its slug mapping', () => {
    expect(getSearchTermsForCategory('UK Finance Tips')).toContain(
      'british pounds',
    );
  });

  it('falls back for an unknown category', () => {
    expect(getSearchTermsForCategory('astrology')).toEqual(
      FALLBACK_SEARCH_TERMS,
    );
  });
});

describe('getSearchTermsForTopic', () => {
  it('matches topics case-insensitively and dedupes terms', () => {
    const terms = getSearchTermsForTopic('How to BUDGET your budget');
    expect(terms).toContain('budget planning');
    expect(new Set(terms).size).toBe(terms.length);
  });

  it('falls back when nothing in the text matches', () => {
    expect(getSearchTermsForTopic('zzzz qqqq')).toEqual(FALLBACK_SEARCH_TERMS);
  });
});

describe('getCombinedSearchTerms', () => {
  it('prioritizes topic terms over category terms and dedupes', () => {
    const combined = getCombinedSearchTerms(
      'budgeting',
      'How to budget on irregular income',
    );
    // Topic-specific terms lead; the shared 'budget planning' appears once.
    expect(combined[0]).toBe('budget planning');
    expect(combined.filter((t) => t === 'budget planning')).toHaveLength(1);
  });
});

describe('generateAltText', () => {
  it('prefers the post title when provided', () => {
    expect(generateAltText('piggy bank', { title: 'Saving for a house' })).toBe(
      'Image related to Saving for a house',
    );
  });

  it('title-cases the search term otherwise', () => {
    expect(generateAltText('piggy bank')).toBe('Piggy Bank - Genwel Blog');
  });
});
