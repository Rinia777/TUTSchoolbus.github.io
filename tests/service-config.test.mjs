import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, 'service-config.json'), 'utf-8'));

const allowedHosts = new Set(['apps.apple.com', 'rinia777.github.io']);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const versionPattern = /^\d+(?:\.\d+)*$/;

function expectAllowedHttpsUrl(value) {
  if (value === null) return;
  const url = new URL(value);
  assert.equal(url.protocol, 'https:');
  assert.ok(allowedHosts.has(url.hostname));
}

describe('service configuration contract', () => {
  it('contains the supported schema and typed app metadata', () => {
    assert.ok(Number.isInteger(config.schemaVersion));
    assert.ok(config.schemaVersion > 0);

    assert.equal(typeof config.apps.ios.noticeEnabled, 'boolean');
    assert.ok(versionPattern.test(config.apps.ios.latestVersion));
    expectAllowedHttpsUrl(config.apps.ios.storeUrl);

    assert.equal(typeof config.apps.android.noticeEnabled, 'boolean');
    assert.ok(versionPattern.test(config.apps.android.latestVersionName));
    assert.ok(Number.isInteger(config.apps.android.latestVersionCode));
    assert.ok(config.apps.android.latestVersionCode > 0);
    expectAllowedHttpsUrl(config.apps.android.storeUrl);
  });

  it('keeps unpublished Android notices disabled and validates policy metadata', () => {
    assert.equal(config.apps.android.noticeEnabled, false);
    assert.equal(config.apps.android.storeUrl, null);

    assert.equal(typeof config.policies.noticeEnabled, 'boolean');
    assert.ok(Number.isInteger(config.policies.revision));
    assert.ok(config.policies.revision > 0);
    assert.ok(datePattern.test(config.policies.revisedDate));
    assert.ok(datePattern.test(config.policies.effectiveDate));
    expectAllowedHttpsUrl(config.policies.termsUrl);
    expectAllowedHttpsUrl(config.policies.privacyUrl);
  });
});
