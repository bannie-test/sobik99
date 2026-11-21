import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';
import { renderWithProviders } from './render';

const navigate = async (hash: string) => {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
};

describe('App', () => {
  it('routes between pages, updates the title and marks the active nav link', async () => {
    await navigate('#/catalog');
    renderWithProviders(<App />);
    expect(document.title).toBe('Bộ sưu tập — SOBIK99');
    expect(screen.getByRole('link', { name: 'Bộ sưu tập' })).toHaveAttribute('aria-current', 'page');

    await navigate('#/cube/gan17');
    expect(document.title).toBe('GAN17 MagDrive — SOBIK99');
    expect(screen.getByRole('link', { name: 'Bộ sưu tập' })).not.toHaveAttribute('aria-current');

    await navigate('#/does-not-exist');
    expect(screen.getByText('Trang này chưa tồn tại.')).toBeInTheDocument();

    await navigate('#/sources');
    expect(screen.getByRole('heading', { name: /Nguồn rõ ràng/ })).toBeInTheDocument();
  });

  it('closes the modal when navigating', async () => {
    const user = userEvent.setup();
    await navigate('#/catalog');
    renderWithProviders(<App />);
    await user.click(screen.getByRole('button', { name: 'Mở so sánh' }));
    const dialog = document.getElementById('modal') as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    await navigate('#/sources');
    expect(dialog.open).toBe(false);
  });

  it('lazy-loads the guide page', async () => {
    await navigate('#/guide?puzzle=Pyraminx');
    renderWithProviders(<App />);
    expect(await screen.findByText('CUBE SCHOOL / Pyraminx', {}, { timeout: 10_000 })).toBeInTheDocument();
  });
});
