import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');
const darkStart = source.indexOf('@media (prefers-color-scheme: dark)');
const lightTokens = darkStart >= 0 ? source.slice(0, darkStart) : source;
const darkTokens = darkStart >= 0 ? source.slice(darkStart) : '';

const expectedTokens = [
  ['--color-background', '#eef3f8', '#101b2c'],
  ['--color-surface', '#ffffff', '#1b222f'],
  ['--color-surface-elevated', '#ffffff', '#2a3443'],
  ['--color-text', '#333333', '#eceef2'],
  ['--color-muted', '#8e8e93', '#b0b8c6'],
  ['--color-outline', '#c6c6c8', '#3a4556'],
  ['--color-card-border', '#ffffff', '#4e5d72'],
  ['--color-timetable-divider', '#c6c6c8', '#596a82'],
  ['--color-timetable-arrow', '#333333', '#ffffff'],
  ['--color-primary', '#3a4d8d', '#3a4d8d'],
  ['--color-on-primary', '#ffffff', '#ffffff'],
  ['--color-disabled', '#b5b5b5', '#7a8699'],
  ['--color-danger', '#ff3b30', '#ff3b30'],
  ['--color-jr', '#008803', '#008803'],
  ['--color-keio-red', '#c8006b', '#c8006b'],
  ['--color-keio-blue', '#00377e', '#00377e'],
] as const;

function tokenValue(sourceText: string, name: string): string | undefined {
  return sourceText.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1]?.trim();
}

describe('shared semantic color tokens', () => {
  it('keeps all 16 roles aligned with the iOS light/dark mapping', () => {
    for (const [name, light, dark] of expectedTokens) {
      expect(tokenValue(lightTokens, name), `${name} light`).toBe(light);
      expect(tokenValue(darkTokens, name) ?? light, `${name} dark`).toBe(dark);
    }
  });
});
