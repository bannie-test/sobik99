import assert from 'node:assert/strict';
import test from 'node:test';
import { webURL } from '../src/utils/web-url.js';

test('catalog link validation allows absolute HTTP and HTTPS URLs', () => {
  assert.equal(webURL('https://example.test/a?x=1&y=2'), 'https://example.test/a?x=1&y=2');
  assert.equal(webURL('HTTP://example.test'), 'http://example.test/');
});

test('catalog link validation rejects other schemes and invalid inputs', () => {
  for (const value of [null, {}, '', '//example.test', '/credits', 'http://', 'file:///credits', 'mailto:info@example.test', 'data:text/plain,credit', 'javascript:void(0)']) {
    assert.equal(webURL(value), null);
  }
});
