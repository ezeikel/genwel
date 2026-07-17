import assert from 'node:assert/strict';
import { getAuthUrl, parseAvailableProviders } from '@genwel/banking/truelayer';
import { test } from 'vitest';

test('normalizes, sanitizes and alphabetizes available banks', () => {
  assert.deepEqual(
    parseAvailableProviders([
      {
        provider_id: 'z-bank',
        display_name: 'Z Bank',
        country: 'UK',
        logo_url: 'http://assets.example.com/z.svg',
      },
      {
        provider_id: 'alpha-bank',
        display_name: 'Alpha Bank',
        country: 'UK',
        logo_uri: 'https://assets.example.com/alpha.svg',
      },
      {
        provider_id: 'beta-bank',
        display_name: 'Beta Bank',
        country: 'UK',
        logo_url: 'not-a-url',
      },
    ]),
    [
      {
        id: 'alpha-bank',
        name: 'Alpha Bank',
        logoUrl: 'https://assets.example.com/alpha.svg',
        country: 'uk',
      },
      {
        id: 'beta-bank',
        name: 'Beta Bank',
        logoUrl: null,
        country: 'uk',
      },
      {
        id: 'z-bank',
        name: 'Z Bank',
        logoUrl: null,
        country: 'uk',
      },
    ],
  );
});

test('rejects a malformed provider directory instead of trusting it', () => {
  assert.throws(() =>
    parseAvailableProviders([
      { provider_id: '', display_name: 'Missing ID', country: 'UK' },
    ]),
  );
});

test('pins a selected provider and user email into the TrueLayer journey', () => {
  const url = new URL(
    getAuthUrl('signed-state', {
      providerId: 'uk-ob-bank',
      userEmail: 'person@example.com',
    }),
  );

  assert.equal(url.searchParams.get('state'), 'signed-state');
  assert.equal(url.searchParams.get('provider_id'), 'uk-ob-bank');
  assert.equal(url.searchParams.get('user_email'), 'person@example.com');
});
