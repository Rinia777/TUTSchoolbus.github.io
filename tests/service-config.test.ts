import { describe, expect, it } from 'vitest';
import config from '../service-config.json';

type ServiceConfig = {
  schemaVersion: number;
  apps: {
    ios: { noticeEnabled: boolean; latestVersion: string; storeUrl: string | null };
    android: {
      noticeEnabled: boolean;
      latestVersionName: string;
      latestVersionCode: number;
      storeUrl: string | null;
    };
  };
  policies: {
    noticeEnabled: boolean;
    revision: number;
    revisedDate: string;
    effectiveDate: string;
    termsUrl: string;
    privacyUrl: string;
  };
};

const typedConfig = config as ServiceConfig;

const allowedHosts = new Set(['apps.apple.com', 'rinia777.github.io']);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const versionPattern = /^\d+(?:\.\d+)*$/;

function expectAllowedHttpsUrl(value: string | null): void {
  if (value === null) return;
  const url = new URL(value);
  expect(url.protocol).toBe('https:');
  expect(allowedHosts.has(url.hostname)).toBe(true);
}

describe('service configuration contract', () => {
  it('contains the supported schema and typed app metadata', () => {
    expect(Number.isInteger(typedConfig.schemaVersion)).toBe(true);
    expect(typedConfig.schemaVersion).toBeGreaterThan(0);

    expect(typeof typedConfig.apps.ios.noticeEnabled).toBe('boolean');
    expect(typedConfig.apps.ios.latestVersion).toMatch(versionPattern);
    expectAllowedHttpsUrl(typedConfig.apps.ios.storeUrl);

    expect(typeof typedConfig.apps.android.noticeEnabled).toBe('boolean');
    expect(typedConfig.apps.android.latestVersionName).toMatch(versionPattern);
    expect(Number.isInteger(typedConfig.apps.android.latestVersionCode)).toBe(true);
    expect(typedConfig.apps.android.latestVersionCode).toBeGreaterThan(0);
    expectAllowedHttpsUrl(typedConfig.apps.android.storeUrl);
  });

  it('keeps unpublished Android notices disabled and validates policy metadata', () => {
    expect(typedConfig.apps.android.noticeEnabled).toBe(false);
    expect(typedConfig.apps.android.storeUrl).toBeNull();

    expect(typeof typedConfig.policies.noticeEnabled).toBe('boolean');
    expect(Number.isInteger(typedConfig.policies.revision)).toBe(true);
    expect(typedConfig.policies.revision).toBeGreaterThan(0);
    expect(typedConfig.policies.revisedDate).toMatch(datePattern);
    expect(typedConfig.policies.effectiveDate).toMatch(datePattern);
    expectAllowedHttpsUrl(typedConfig.policies.termsUrl);
    expectAllowedHttpsUrl(typedConfig.policies.privacyUrl);
  });
});
