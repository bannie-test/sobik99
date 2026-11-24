import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Catalog from '../src/features/catalog/InteractiveCatalog';
import { renderWithProviders } from './render';

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect() {}
  });
  vi.stubGlobal('fetch', async (url: string) => {
    const path = new URL(url, 'http://localhost/').pathname;
    return new Response(await readFile(resolve('public', '.' + path)), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('Cube Library', () => {
  it('renders generated pages and filters an entire brand family', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Catalog query={new URLSearchParams('brand=moyu')} />);
    await waitFor(() => expect(document.querySelectorAll('.product-card').length).toBeGreaterThan(0));
    expect(screen.getByText(/Gồm cả:/)).toHaveTextContent('Cubing Classroom');
    const input = screen.getByRole('searchbox', { name: 'Tìm mẫu' });
    await user.type(input, 'MeiLong 3C');
    await waitFor(() => expect(document.querySelector('a[href^="#/cube/cubing-classroom/"]')).toBeInTheDocument());
    expect(location.hash).toContain('brand=moyu');
  });

  it('resolves published product URLs and original GAN bookmarks without checkout', async () => {
    renderWithProviders(<Catalog id="gan17" />);
    expect(await screen.findByRole('heading', { name: /GAN17 MagDrive/i, level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mua|So sánh/ })).not.toBeInTheDocument();
  });

  it('renders a not-found result for unknown models', async () => {
    renderWithProviders(<Catalog brand="gan" id="missing" />);
    expect(await screen.findByRole('heading', { name: /Mẫu này chưa có/ })).toBeInTheDocument();
  });
});
