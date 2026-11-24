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
    expect(document.title).toBe('Thư viện Rubik — SOBIK99');
    expect(screen.getByRole('link', { name: 'Thư viện Rubik' })).toHaveAttribute('aria-current', 'page');

    await navigate('#/does-not-exist');
    expect(document.title).toBe('Không tìm thấy trang — SOBIK99');
    expect(screen.getByText('Trang này chưa tồn tại.')).toBeInTheDocument();

    await navigate('#/sources');
    expect(await screen.findByRole('heading', { name: 'Nguồn hình ảnh' })).toBeInTheDocument();
  });

  it('opens the guide in compact mode and restores the previous route', async () => {
    const user = userEvent.setup();
    await navigate('#/sources');
    renderWithProviders(<App />);
    await user.click(screen.getByRole('switch', { name: 'Thu gọn' }));
    expect(await screen.findByText('CUBE SCHOOL / 3x3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '2x2' }));
    expect(screen.getByText('CUBE SCHOOL / 2x2')).toBeInTheDocument();
    expect(location.hash).toBe('#/sources');
    expect(localStorage.getItem('sobik_compact_mode')).toBe('true');
    await user.click(screen.getByRole('switch', { name: 'Thu gọn' }));
    expect(await screen.findByRole('heading', { name: 'Nguồn hình ảnh' })).toBeInTheDocument();
  });

  it('lazy-loads the guide page', async () => {
    await navigate('#/guide?puzzle=Pyraminx');
    renderWithProviders(<App />);
    expect(await screen.findByText('CUBE SCHOOL / Pyraminx')).toBeInTheDocument();
  });
});
