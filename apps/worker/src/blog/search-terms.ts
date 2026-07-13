/**
 * Search term mappings for Pexels photo searches
 *
 * Maps blog categories and topics to relevant search terms for UK personal finance content.
 * Terms are ordered by relevance - first term is most specific.
 */

// Category-based search terms (matches Sanity blog categories)
export const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  // Core categories
  budgeting: [
    'budget planning',
    'calculator money',
    'financial planning',
    'expense tracking',
    'money management',
  ],
  saving: [
    'piggy bank',
    'savings jar',
    'money saving',
    'coins savings',
    'emergency fund',
  ],
  debt: [
    'credit card',
    'paying bills',
    'financial stress',
    'debt free',
    'loan payment',
  ],
  investing: [
    'stock market',
    'investment growth',
    'financial charts',
    'wealth building',
    'portfolio',
  ],
  'family-finance': [
    'family budget',
    'family planning',
    'parents children money',
    'household finances',
    'family savings',
  ],
  'uk-finance-tips': [
    'british pounds',
    'uk money',
    'london finance',
    'british banking',
    'uk currency',
  ],
};

// Topic-specific search terms (matched against blog title/content)
export const TOPIC_SEARCH_TERMS: Record<string, string[]> = {
  // Budgeting topics
  budget: [
    'budget planning',
    'expense tracker',
    'money management',
    'financial planning',
  ],
  '50/30/20': [
    'pie chart money',
    'budget allocation',
    'money percentages',
    'financial split',
  ],
  'zero-based': [
    'budget spreadsheet',
    'every dollar',
    'income allocation',
    'zero balance',
  ],
  envelope: [
    'cash envelopes',
    'money envelopes',
    'budget categories',
    'cash budgeting',
  ],
  spending: [
    'shopping receipt',
    'spending habits',
    'purchase decision',
    'money spending',
  ],
  track: [
    'expense tracking',
    'financial app',
    'money tracker',
    'budget monitoring',
  ],

  // Saving topics
  'emergency fund': [
    'piggy bank',
    'savings jar',
    'rainy day fund',
    'emergency savings',
  ],
  'house deposit': [
    'house keys',
    'home buying',
    'property deposit',
    'first home',
  ],
  isa: [
    'savings account',
    'investment account',
    'tax free savings',
    'isa investment',
  ],
  'lifetime isa': [
    'first time buyer',
    'retirement savings',
    'government bonus',
    'lisa savings',
  ],
  saving: ['money saving', 'coins jar', 'savings goal', 'financial security'],

  // Debt topics
  'credit score': [
    'credit report',
    'credit check',
    'financial score',
    'credit rating',
  ],
  'payday loan': [
    'urgent money',
    'short term loan',
    'financial emergency',
    'loan stress',
  ],
  overdraft: [
    'bank account',
    'negative balance',
    'bank fees',
    'account overdraft',
  ],
  'buy now pay later': [
    'online shopping',
    'payment plan',
    'installment payment',
    'klarna',
  ],
  debt: ['credit card', 'debt free', 'paying off debt', 'financial burden'],
  snowball: [
    'debt payoff',
    'smallest first',
    'debt strategy',
    'momentum payment',
  ],
  avalanche: [
    'high interest',
    'debt priority',
    'interest rate',
    'efficient payoff',
  ],

  // Income topics
  'side hustle': [
    'freelance work',
    'extra income',
    'gig economy',
    'multiple jobs',
  ],
  'self-employed': [
    'home office',
    'entrepreneur',
    'freelancer',
    'small business',
  ],
  'gig economy': ['delivery driver', 'rideshare', 'flexible work', 'app work'],
  freelance: [
    'laptop work',
    'remote work',
    'independent worker',
    'creative professional',
  ],
  tax: ['tax return', 'hmrc forms', 'tax calculator', 'tax documents'],

  // Family & remittances
  remittance: [
    'money transfer',
    'sending money',
    'international transfer',
    'family abroad',
  ],
  'family abroad': [
    'global family',
    'international family',
    'overseas relatives',
    'family connection',
  ],
  'supporting family': [
    'family support',
    'helping relatives',
    'financial help',
    'family care',
  ],
  children: [
    'kids money',
    'teaching children',
    'family finances',
    'pocket money',
  ],

  // UK-specific
  'universal credit': [
    'benefits',
    'government support',
    'welfare',
    'social security',
  ],
  pension: [
    'retirement',
    'pension pot',
    'retirement planning',
    'elderly couple',
  ],
  'national insurance': [
    'payslip',
    'ni contributions',
    'employment',
    'tax deductions',
  ],
  'council tax': [
    'local government',
    'property tax',
    'council services',
    'municipal',
  ],
  nhs: ['healthcare', 'medical', 'hospital', 'health service'],
  hmrc: ['tax office', 'government', 'tax return', 'revenue customs'],

  // Life events
  wedding: ['wedding planning', 'marriage', 'engagement', 'wedding budget'],
  baby: ['new baby', 'parenting', 'nursery', 'maternity'],
  university: ['student', 'graduation', 'university campus', 'student life'],
  'first job': [
    'career start',
    'young professional',
    'new employee',
    'workplace',
  ],
  moving: ['moving boxes', 'new home', 'relocation', 'apartment'],
  redundancy: ['job loss', 'unemployment', 'career change', 'job search'],

  // Mindset & behaviour
  'financial stress': [
    'stressed person',
    'money worry',
    'anxiety',
    'overwhelmed',
  ],
  'money anxiety': [
    'worried',
    'concerned face',
    'stress relief',
    'calm finance',
  ],
  guilt: [
    'emotional',
    'feeling guilty',
    'internal conflict',
    'self reflection',
  ],
  habits: ['routine', 'daily habits', 'behavior change', 'positive habits'],

  // Bills & expenses
  bills: ['utility bills', 'paying bills', 'monthly expenses', 'bill payment'],
  energy: ['electricity', 'gas meter', 'energy bills', 'heating'],
  groceries: ['supermarket', 'food shopping', 'grocery store', 'weekly shop'],
  subscription: [
    'streaming service',
    'monthly subscription',
    'app subscription',
    'recurring payment',
  ],
  'mobile phone': ['smartphone', 'mobile contract', 'phone bill', 'telecom'],
};

// Fallback terms for generic finance content
export const FALLBACK_SEARCH_TERMS = [
  'personal finance',
  'money management',
  'financial planning',
  'budget calculator',
  'uk finance',
];

/**
 * Get search terms for a blog category
 */
export function getSearchTermsForCategory(category: string): string[] {
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '-');
  return CATEGORY_SEARCH_TERMS[normalizedCategory] || FALLBACK_SEARCH_TERMS;
}

/**
 * Get search terms based on blog post title/keywords
 * Analyzes the text to find relevant search terms
 */
export function getSearchTermsForTopic(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const matchedTerms: string[] = [];

  // Check each topic for matches in the text
  for (const [topic, terms] of Object.entries(TOPIC_SEARCH_TERMS)) {
    if (normalizedText.includes(topic)) {
      matchedTerms.push(...terms);
    }
  }

  // If no matches, use fallback
  if (matchedTerms.length === 0) {
    return FALLBACK_SEARCH_TERMS;
  }

  // Remove duplicates and return
  return [...new Set(matchedTerms)];
}

/**
 * Combine category and topic search terms, deduplicating
 */
export function getCombinedSearchTerms(
  category: string,
  title: string,
): string[] {
  const categoryTerms = getSearchTermsForCategory(category);
  const topicTerms = getSearchTermsForTopic(title);

  // Combine and deduplicate, prioritizing topic-specific terms
  const combined = [...topicTerms, ...categoryTerms];
  return [...new Set(combined)];
}

/**
 * Generate alt text for a finance-related image
 */
export function generateAltText(
  searchTerm: string,
  context: { title?: string; category?: string } = {},
): string {
  // If we have title context, use it
  if (context.title) {
    return `Image related to ${context.title}`;
  }

  // Otherwise, base it on the search term
  const cleanedTerm = searchTerm
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `${cleanedTerm} - Genwel Blog`;
}
