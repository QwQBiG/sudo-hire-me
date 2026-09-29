import assert from 'node:assert/strict';
import test from 'node:test';
import { assessContribution, contributionCases } from '../src/domain/contribution.mjs';

test('each contribution scenario has one supported claim and traceable evidence', () => {
  for (const scene of contributionCases) {
    assert.equal(scene.claims.filter((claim) => claim.supported).length, 1);
    for (const claim of scene.claims) {
      const result = assessContribution(scene.id, claim.id);
      assert.equal(result.supported, claim.supported);
      assert.ok(result.evidence.length > 0);
      assert.ok(result.evidence.every((id) => scene.evidence.some((item) => item.id === id)));
    }
  }
});

test('unknown contribution choices fail explicitly', () => {
  assert.throws(() => assessContribution('scope', 'missing'), RangeError);
  assert.throws(() => assessContribution('missing', 'mine'), RangeError);
});
