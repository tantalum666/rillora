import assert from 'node:assert/strict';
import test from 'node:test';
import config from '../vite.config.mjs';

test('closed and restricted-review artifacts keep isolated outputs and pinned production routing', () => {
  const closed = config({ mode: 'production-closed' });
  const review = config({ mode: 'production-review' });
  const live = config({ mode: 'production-live' });
  for (const value of [closed, review, live]) {
    assert.equal(value.envDir, false);
    assert.equal(value.define['import.meta.env.VITE_API_BASE_URL'], JSON.stringify('/api/v1'));
    assert.equal(value.define['import.meta.env.VITE_RILLORA_SERVICE_MARKET_CODE'], JSON.stringify('GLOBAL_US'));
  }
  assert.equal(closed.build.outDir, 'dist-production');
  assert.equal(review.build.outDir, 'dist-production-review');
  assert.equal(live.build.outDir, 'dist-production-live');
  assert.equal(closed.define['import.meta.env.VITE_RILLORA_CUSTOMER_ACCESS'], JSON.stringify('closed'));
  assert.equal(review.define['import.meta.env.VITE_RILLORA_CUSTOMER_ACCESS'], JSON.stringify('restricted-review'));
  assert.equal(live.define['import.meta.env.VITE_RILLORA_CUSTOMER_ACCESS'], JSON.stringify('live'));
  assert.equal(live.define['import.meta.env.VITE_RILLORA_AI_CONNECTIONS'], JSON.stringify('true'));
  for (const value of [closed,review]) assert.equal(value.define['import.meta.env.VITE_RILLORA_AI_CONNECTIONS'], JSON.stringify('false'));
  const publicSite = config({ mode: 'public' });
  assert.deepEqual(publicSite.define, {
    'import.meta.env.VITE_RILLORA_LEGACY_CONTENT': JSON.stringify('false'),
    'import.meta.env.VITE_RILLORA_LOCAL_TRANSCRIPTION': JSON.stringify('false'),
  });
  assert.equal(publicSite.build.outDir, 'dist-public');
});
