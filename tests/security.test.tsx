import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { webURL } from '../src/cube-tools/utils/web-url.js';
import { lessons } from '../src/cube-tools/data/lessons.js';
import { neutralizeFormula } from '../src/shared/lib/csv';
import { safeExternalUrl } from '../src/shared/lib/safeUrl';
import { ExternalLink } from '../src/shared/ui/ExternalLink';

describe('external links', () => {
  it('only allows https URLs', () => {
    expect(safeExternalUrl('https://example.com/a')).toBe('https://example.com/a');
    expect(safeExternalUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeExternalUrl('http://example.com')).toBeUndefined();
    expect(safeExternalUrl('not a url')).toBeUndefined();
  });

  it('validates web URLs used by generated catalog metadata', () => {
    expect(webURL('https://example.com/model')).toBe('https://example.com/model');
    expect(webURL('http://example.com/model')).toBe('http://example.com/model');
    expect(webURL('javascript:alert(1)')).toBeNull();
    expect(webURL('//example.com/model')).toBeNull();
  });

  it('renders rel="noopener noreferrer" and drops unsafe hrefs', () => {
    render(
      <>
        <ExternalLink href="https://example.com">ok</ExternalLink>
        <ExternalLink href="javascript:alert(1)">bad</ExternalLink>
      </>,
    );
    const ok = screen.getByRole('link', { name: 'ok' });
    expect(ok).toHaveAttribute('rel', 'noopener noreferrer');
    expect(ok).toHaveAttribute('target', '_blank');
    expect(screen.queryByRole('link', { name: 'bad' })).not.toBeInTheDocument();
  });

  it('every source URL in the data is https', () => {
    const urls = Object.values(lessons).map((lesson) => lesson.source);
    for (const url of urls) expect(safeExternalUrl(url), url).toBeDefined();
  });
});

describe('csv', () => {
  it('neutralises formula prefixes', () => {
    for (const v of ['=1+1', '+1', '-1', '@SUM(A1)', '\tx']) expect(neutralizeFormula(v).startsWith("'")).toBe(true);
    expect(neutralizeFormula("R U R'")).toBe("R U R'");
  });
});
