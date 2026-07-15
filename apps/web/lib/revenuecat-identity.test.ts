import assert from 'node:assert/strict';
import test from 'node:test';
import {
  revenueCatIdentityCandidates,
  revenueCatSubscriptionExternalId,
  selectRevenueCatIdentityUser,
} from './revenuecat-identity';

test('uses one stable local subscription key per Genwel user', () => {
  assert.equal(revenueCatSubscriptionExternalId('user_123'), 'rc:user_123');
});

test('collects app, original and alias identities once in preference order', () => {
  assert.deepEqual(
    revenueCatIdentityCandidates({
      app_user_id: '$RCAnonymousID:anon',
      original_app_user_id: '$RCAnonymousID:anon',
      aliases: ['user_123', ' user_456 ', 'user_123'],
    }),
    ['$RCAnonymousID:anon', 'user_123', 'user_456'],
  );
});

test('prefers a direct signed-in alias over an anonymous linked identity', () => {
  const users = [
    { id: 'legacy', revenuecatUserId: '$RCAnonymousID:anon' },
    { id: 'user_123', revenuecatUserId: null },
  ];

  assert.equal(
    selectRevenueCatIdentityUser(users, {
      app_user_id: '$RCAnonymousID:anon',
      aliases: ['user_123'],
    })?.id,
    'user_123',
  );
});

test('falls back to a previously linked RevenueCat identity', () => {
  const users = [{ id: 'user_123', revenuecatUserId: 'rc_custom_id' }];

  assert.equal(
    selectRevenueCatIdentityUser(users, {
      original_app_user_id: 'rc_custom_id',
    })?.id,
    'user_123',
  );
});
