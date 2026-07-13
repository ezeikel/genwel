/**
 * Merchant → domain resolution for logos.
 *
 * Bank transaction descriptions are messy ("NETFLIX.COM 8AM", "TESCO STORES
 * 2914"), so we match the canonical merchant string against a curated list of
 * brand tokens and map the first hit to its domain. logo.dev then renders the
 * brand logo from that domain (via our proxied /api/merchant-logo route).
 *
 * Only well-known UK-relevant brands are listed — everything else falls back to
 * a neutral category circle, which is the correct treatment for obscure or
 * internal descriptors ("SAVE THE CHANGE", "REGENDA REDWING RE").
 *
 * Keep entries lowercase. `token` is matched as a whole-word-ish substring of
 * the canonicalised merchant key; order matters only for overlapping tokens.
 */

type BrandEntry = { token: string; domain: string };

// Curated top UK merchants — the ones that actually recur on statements.
const BRANDS: BrandEntry[] = [
  // Streaming / media
  { token: 'netflix', domain: 'netflix.com' },
  { token: 'disney', domain: 'disneyplus.com' },
  { token: 'spotify', domain: 'spotify.com' },
  { token: 'youtube', domain: 'youtube.com' },
  { token: 'apple.com/bill', domain: 'apple.com' },
  { token: 'apple music', domain: 'apple.com' },
  { token: 'itunes', domain: 'apple.com' },
  { token: 'amazon prime', domain: 'amazon.co.uk' },
  { token: 'prime video', domain: 'amazon.co.uk' },
  { token: 'now tv', domain: 'nowtv.com' },
  { token: 'paramount', domain: 'paramountplus.com' },
  { token: 'audible', domain: 'audible.co.uk' },
  { token: 'dazn', domain: 'dazn.com' },
  // Telecoms / broadband / TV
  { token: 'bt ', domain: 'bt.com' },
  { token: 'sky', domain: 'sky.com' },
  { token: 'virgin media', domain: 'virginmedia.com' },
  { token: 'vodafone', domain: 'vodafone.co.uk' },
  { token: 'ee ', domain: 'ee.co.uk' },
  { token: 'o2', domain: 'o2.co.uk' },
  { token: 'three', domain: 'three.co.uk' },
  { token: 'plusnet', domain: 'plus.net' },
  { token: 'talktalk', domain: 'talktalk.co.uk' },
  { token: 'giffgaff', domain: 'giffgaff.com' },
  // Supermarkets
  { token: 'tesco', domain: 'tesco.com' },
  { token: 'sainsbury', domain: 'sainsburys.co.uk' },
  { token: 'asda', domain: 'asda.com' },
  { token: 'morrisons', domain: 'morrisons.com' },
  { token: 'aldi', domain: 'aldi.co.uk' },
  { token: 'lidl', domain: 'lidl.co.uk' },
  { token: 'waitrose', domain: 'waitrose.com' },
  { token: 'co-op', domain: 'coop.co.uk' },
  { token: 'iceland', domain: 'iceland.co.uk' },
  { token: 'marks spencer', domain: 'marksandspencer.com' },
  { token: 'm&s', domain: 'marksandspencer.com' },
  { token: 'ocado', domain: 'ocado.com' },
  // Food delivery / eating out
  { token: 'deliveroo', domain: 'deliveroo.co.uk' },
  { token: 'just eat', domain: 'just-eat.co.uk' },
  { token: 'uber eats', domain: 'ubereats.com' },
  { token: 'mcdonald', domain: 'mcdonalds.com' },
  { token: 'greggs', domain: 'greggs.co.uk' },
  { token: 'costa', domain: 'costa.co.uk' },
  { token: 'starbucks', domain: 'starbucks.co.uk' },
  { token: 'pret', domain: 'pret.co.uk' },
  { token: 'nando', domain: 'nandos.co.uk' },
  { token: 'domino', domain: 'dominos.co.uk' },
  { token: 'kfc', domain: 'kfc.co.uk' },
  // Transport / travel
  { token: 'uber', domain: 'uber.com' },
  { token: 'bolt', domain: 'bolt.eu' },
  { token: 'trainline', domain: 'thetrainline.com' },
  { token: 'tfl', domain: 'tfl.gov.uk' },
  { token: 'transport for london', domain: 'tfl.gov.uk' },
  { token: 'national rail', domain: 'nationalrail.co.uk' },
  { token: 'ryanair', domain: 'ryanair.com' },
  { token: 'easyjet', domain: 'easyjet.com' },
  { token: 'british airways', domain: 'britishairways.com' },
  { token: 'shell', domain: 'shell.com' },
  { token: 'bp ', domain: 'bp.com' },
  { token: 'esso', domain: 'esso.co.uk' },
  // Shopping / retail
  { token: 'amazon', domain: 'amazon.co.uk' },
  { token: 'ebay', domain: 'ebay.co.uk' },
  { token: 'argos', domain: 'argos.co.uk' },
  { token: 'john lewis', domain: 'johnlewis.com' },
  { token: 'currys', domain: 'currys.co.uk' },
  { token: 'boots', domain: 'boots.com' },
  { token: 'superdrug', domain: 'superdrug.com' },
  { token: 'ikea', domain: 'ikea.com' },
  { token: 'primark', domain: 'primark.com' },
  { token: 'asos', domain: 'asos.com' },
  { token: 'next', domain: 'next.co.uk' },
  { token: 'zara', domain: 'zara.com' },
  { token: 'uniqlo', domain: 'uniqlo.com' },
  { token: 'screwfix', domain: 'screwfix.com' },
  { token: 'b&q', domain: 'diy.com' },
  // Utilities / energy
  { token: 'octopus energy', domain: 'octopus.energy' },
  { token: 'british gas', domain: 'britishgas.co.uk' },
  { token: 'eon', domain: 'eonnext.com' },
  { token: 'edf', domain: 'edfenergy.com' },
  { token: 'ovo', domain: 'ovoenergy.com' },
  { token: 'thames water', domain: 'thameswater.co.uk' },
  // Fitness / subscriptions / software
  { token: 'puregym', domain: 'puregym.com' },
  { token: 'the gym', domain: 'thegymgroup.com' },
  { token: 'david lloyd', domain: 'davidlloyd.co.uk' },
  { token: 'audible', domain: 'audible.co.uk' },
  { token: 'adobe', domain: 'adobe.com' },
  { token: 'microsoft', domain: 'microsoft.com' },
  { token: 'google', domain: 'google.com' },
  { token: 'patreon', domain: 'patreon.com' },
  { token: 'openai', domain: 'openai.com' },
  { token: 'anthropic', domain: 'anthropic.com' },
  { token: 'grok', domain: 'x.ai' },
  { token: 'xai', domain: 'x.ai' },
  { token: 'replicate', domain: 'replicate.com' },
  { token: 'cursor', domain: 'cursor.com' },
  { token: 'github', domain: 'github.com' },
  { token: 'vercel', domain: 'vercel.com' },
  { token: 'figma', domain: 'figma.com' },
  { token: 'slack', domain: 'slack.com' },
  { token: 'notion', domain: 'notion.so' },
  { token: 'dropbox', domain: 'dropbox.com' },
  { token: 'linkedin', domain: 'linkedin.com' },
  // Finance / BNPL
  { token: 'paypal', domain: 'paypal.com' },
  { token: 'klarna', domain: 'klarna.com' },
  { token: 'clearpay', domain: 'clearpay.co.uk' },
  { token: 'monzo', domain: 'monzo.com' },
  { token: 'revolut', domain: 'revolut.com' },
  { token: 'starling', domain: 'starlingbank.com' },
  // Gaming
  { token: 'playstation', domain: 'playstation.com' },
  { token: 'xbox', domain: 'xbox.com' },
  { token: 'nintendo', domain: 'nintendo.com' },
  { token: 'steam', domain: 'steampowered.com' },
];

/**
 * Resolve a merchant string to a brand domain, or null if not recognised.
 * `merchant` should be the canonical/display merchant name (any case).
 */
export function merchantDomain(merchant: string): string | null {
  const s = ` ${merchant
    .toLowerCase()
    .replace(/[^a-z0-9&/. ]/g, ' ')
    .replace(/\s+/g, ' ')} `;
  for (const { token, domain } of BRANDS) {
    // pad token match so "bt " / "ee " / "bp " need the trailing space,
    // while plain tokens match anywhere.
    if (token.endsWith(' ')) {
      if (s.includes(` ${token}`)) return domain;
    } else if (s.includes(token)) {
      return domain;
    }
  }
  return null;
}
