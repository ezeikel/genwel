// Blog topics for Genwel - UK-focused personal finance
// A broad mix of real-life money situations anyone in the UK might face:
// budgeting, saving, debt and credit, irregular income, supporting family,
// and getting ahead with money. Written to be useful to everyone.

export const BLOG_TOPICS = [
  // ===== FAMILY SUPPORT & REMITTANCES =====
  'Building an emergency fund when supporting family abroad',
  'Managing remittances without breaking the budget',
  'How to talk to family about money boundaries',
  'Balancing your own savings with supporting relatives',
  'Best ways to send money abroad from the UK',
  'How much should you send home each month?',
  'Setting up a family support budget that protects your future',
  'When family asks for money: How to say no without guilt',
  'Creating a remittance schedule that works for everyone',
  'Teaching your children about family financial responsibilities',

  // ===== BUDGETING & MONEY MANAGEMENT =====
  'How to budget on irregular income from side hustles',
  'Creating a family budget that actually works',
  'The 50/30/20 rule: Does it work for UK households?',
  'Budgeting apps vs spreadsheets: What actually works?',
  'How to track spending without becoming obsessive',
  'Zero-based budgeting explained simply',
  'Budgeting for couples: Joint accounts or separate?',
  'How to budget when you get paid weekly',
  'The envelope method: Old school budgeting that works',
  'Why your budget keeps failing (and how to fix it)',

  // ===== DEBT & CREDIT =====
  'First steps to rebuilding after debt',
  'Understanding credit scores in the UK',
  'Debt management plans vs bankruptcy: What you need to know',
  'The true cost of payday loans and alternatives',
  'How to escape the overdraft trap',
  'Klarna, Clearpay and BNPL: Hidden dangers explained',
  'Rebuilding your credit score from scratch',
  'How to prioritise which debts to pay first',
  'Dealing with debt collectors: Know your rights',
  'Can you get a mortgage with bad credit in the UK?',
  'The snowball vs avalanche method for paying off debt',
  'How to consolidate debt without making things worse',

  // ===== SAVING & EMERGENCY FUNDS =====
  'Opening your first savings account: ISAs explained',
  'How to save for a house deposit in the UK',
  'Building an emergency fund on a low income',
  'Help to Buy ISA vs Lifetime ISA: Which is better?',
  'How much emergency fund do you really need?',
  'Saving money on a tight budget: 20 practical tips',
  'The psychology of saving: Why it feels so hard',
  'Automating your savings: Set it and forget it',
  'High-yield savings accounts in the UK: Are they worth it?',
  'Saving for your first car in the UK',

  // ===== INCOME & SIDE HUSTLES =====
  'Self-employed? How to manage your tax efficiently',
  'Student finance: Loans, grants and budgeting tips',
  'Managing multiple income streams effectively',
  'Side hustle ideas that actually pay in the UK',
  'Gig economy finances: Uber, Deliveroo and beyond',
  'How to price your freelance services',
  'Should you go self-employed? The financial reality',
  'Tax tips for delivery drivers and couriers',
  'Declaring cash-in-hand work: What you need to know',

  // ===== BILLS & EXPENSES =====
  'How to reduce household bills in the UK',
  'How to negotiate better rates on your bills',
  'Energy bills explained: How to switch and save',
  'Council tax: Discounts you might be missing',
  'Cutting the cost of groceries without coupons',
  'Is it worth switching bank accounts for cashback?',
  'Subscription audit: Finding the hidden costs draining your account',
  'Water bills in the UK: Meters vs fixed rates',
  'Mobile phone contracts: Are SIM-only deals worth it?',

  // ===== UK-SPECIFIC FINANCE =====
  'Understanding National Insurance contributions',
  'Pension basics for young professionals',
  'Understanding Universal Credit and benefits',
  'How the UK tax system actually works',
  'State pension explained: What will you get?',
  'Working Tax Credits vs Universal Credit',
  'Child Benefit: Who qualifies and how to claim',
  'NHS costs: What is free and what is not?',
  'Understanding your payslip: Where does your money go?',
  'Marriage allowance: Free money most couples miss',

  // ===== WEALTH BUILDING =====
  'Building wealth across generations',
  'Investing for beginners: Starting with just £50',
  'Stocks and Shares ISA: Is it right for you?',
  'Property vs stocks: Where should you invest?',
  'Compound interest: The eighth wonder of the world',
  'Teaching children about money management',
  'How to start investing with no experience',
  'Index funds explained: The simple way to invest',
  'Building a passive income stream in the UK',

  // ===== LIFE EVENTS & MONEY =====
  'Financial checklist for new parents in the UK',
  'Money tips for university students',
  'Getting married? Financial conversations to have first',
  'Dealing with financial stress and anxiety',
  'Money lessons from the cost of living crisis',
  'Planning finances for maternity/paternity leave',
  'How to financially prepare for redundancy',
  'First job finances: A complete guide',
  'Moving out for the first time: Hidden costs to expect',

  // ===== MINDSET & BEHAVIOUR =====
  'Breaking the cycle of financial shame',
  'How your upbringing affects your money habits',
  'The emotional side of being the family breadwinner',
  'Why comparison is killing your financial progress',
  'Building a healthy relationship with money',
  'Financial self-care: It is not just about saving',
  'Overcoming money anxiety step by step',
  'The guilt of spending on yourself when family needs help',
];

export const BLOG_META_PROMPT = `You are an expert content strategist for Genwel, a UK-focused personal finance app.
Generate blog post metadata for the given topic.

Requirements:
- Title should be SEO-optimized, 50-60 characters, click-worthy but not clickbait
- Slug should be URL-friendly (lowercase, hyphens, no special characters)
- Excerpt should be 150-160 characters, perfect for meta description
- Keywords should be 5-8 relevant search terms
- Category should be one of: Budgeting, Saving, Debt, Investing, Family Finance, UK Finance Tips
- Titles and excerpts must frame content as general financial information and education, NOT regulated advice. Avoid promissory or guaranteed-outcome language and do not use em dashes.

Return a JSON object with: title, slug, excerpt, keywords (array), category`;

export const BLOG_CONTENT_PROMPT = `You are a professional content writer for Genwel, a UK-focused budgeting app.
Write an engaging, informative blog post on the given topic.

Requirements:
- Write in British English
- Target audience: UK residents looking to improve their finances
- Tone: Friendly, supportive, practical - never condescending
- Length: 1200-1600 words
- Structure with clear H2 and H3 headings
- Include practical tips and actionable advice
- Reference UK-specific information (ISAs, HMRC, benefits, etc.) where relevant
- Avoid jargon - explain financial terms simply
- Include a compelling introduction and conclusion

Compliance and integrity (STRICT - this is a UK, FCA-adjacent personal finance niche):
- This is GENERAL FINANCIAL INFORMATION and education, NOT regulated financial advice. Do not recommend specific products, providers, shares, or funds as "the right choice" for the reader.
- Where a decision carries real financial risk (investing, pensions, debt solutions, mortgages, tax), encourage readers to consider speaking to a regulated financial adviser, or a free service such as MoneyHelper or Citizens Advice, before acting.
- NEVER fabricate statistics, percentages, survey results, studies, or expert quotes. Do not invent numbers or cite sources you cannot verify. If you use a well-known figure (e.g. a current ISA allowance), keep it general and note that readers should confirm current figures, since rules and thresholds change.
- Do NOT use em dashes (—) anywhere. Use commas, colons, brackets, or full stops instead.
- Encourage internal linking: naturally reference and suggest linking to related Genwel guides on adjacent topics (e.g. budgeting, saving, debt, ISAs) where it genuinely helps the reader, so posts form a connected library.
- Keep the house voice: warm, plain-spoken, non-judgemental, and practical. Write for everyone, whatever their situation, and meet readers wherever they are with their money.

Format as markdown with proper headings (##, ###), bullet points, and emphasis.`;

export const BLOG_IMAGE_SEARCH_PROMPT = `Generate 3-5 search terms to find a relevant stock photo for a blog post.
The image should be professional, relatable, and represent the topic visually.

Consider:
- Diverse representation
- Modern, clean aesthetic
- UK-appropriate settings where relevant
- Positive, aspirational mood

Return: { searchTerms: string[], altText: string, style: string }`;

export const BLOG_IMAGE_GENERATION_PROMPT = `Create a professional blog header image for an article titled "{{TITLE}}".

Requirements:
- Photorealistic style
- Professional and editorial quality
- Related to UK personal finance, budgeting, saving, or money management
- Clean composition suitable for a website header
- Natural lighting
- No text or watermarks in the image

For a UK personal finance blog, appropriate imagery includes:
- People using budgeting apps on smartphones
- UK currency (pound coins, notes), British bank cards
- Families discussing finances at home
- Savings jars, piggy banks, financial planning
- Modern UK urban scenes, British homes
- People looking confident about their finances

The image should visually represent the topic and be engaging without being overly literal.`;

// Persona authors for auto-generated blog posts.
//
// A small set of subject-fitting bylines, randomly assigned per post so the blog
// reads like a team of finance writers rather than a single anonymous voice.
// Bios are honest about scope: these are content writers producing general
// financial information and education, NOT regulated financial advisers.
export type BlogAuthor = {
  name: string;
  slug: string;
  title: string;
  bio: string;
};

export const BLOG_AUTHORS: BlogAuthor[] = [
  {
    name: 'Genwel Team',
    slug: 'genwel-team',
    title: 'Content Team',
    bio: 'The Genwel content team writes practical, jargon-free guides on UK money management. We share general financial information and education to help you budget, save, and rebuild, and we always encourage speaking to a regulated adviser before big decisions.',
  },
  {
    name: 'Priya Sharma',
    slug: 'priya-sharma',
    title: 'Personal Finance Writer',
    bio: 'Priya writes about everyday budgeting, saving, and supporting family on a UK income. She focuses on realistic, no-shame money habits. Her articles are general financial information and education, not regulated advice.',
  },
  {
    name: 'Marcus Bell',
    slug: 'marcus-bell',
    title: 'Debt and Credit Writer',
    bio: 'Marcus covers rebuilding after debt, understanding UK credit, and dealing with bills. He believes clear information beats jargon. His guides are general financial information and education, and he always points readers to free services like MoneyHelper and Citizens Advice.',
  },
  {
    name: 'Leah Okafor',
    slug: 'leah-okafor',
    title: 'Money and Wellbeing Writer',
    bio: 'Leah writes about the emotional side of money, irregular income, and building steady financial habits. She keeps things kind and practical. Her posts are general financial information and education, not regulated financial advice.',
  },
];
