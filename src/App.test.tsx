import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { App } from './App';
import { OSProvider } from './os/store';

function boot() {
  const user = userEvent.setup();
  render(
    <OSProvider>
      <App />
    </OSProvider>,
  );
  return user;
}

async function toDesktop(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /skip intro/i }));
  expect(screen.getByRole('heading', { name: 'Atul Bhadoriya' })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: /enter atulos/i }));
  return screen.getByRole('navigation', { name: 'Dock' });
}

describe('AtulOS', () => {
  it('boots, unlocks and shows the dock', async () => {
    const user = boot();
    expect(screen.getByRole('progressbar')).toBeTruthy();
    const dock = await toDesktop(user);
    expect(within(dock).getAllByRole('button').length).toBeGreaterThanOrEqual(9);
  });

  it('unlocks from the keyboard', async () => {
    const user = boot();
    await user.click(screen.getByRole('button', { name: /skip intro/i }));
    await user.keyboard('{Enter}');
    expect(screen.getByRole('navigation', { name: 'Dock' })).toBeTruthy();
  });

  it('opens an app from the dock and closes it with Escape', async () => {
    const user = boot();
    const dock = await toDesktop(user);
    await user.click(within(dock).getByRole('button', { name: 'Projects' }));
    const win = screen.getByRole('region', { name: 'Projects' });
    expect(win).toBeTruthy();
    expect(within(dock).getByRole('button', { name: 'Projects, open' })).toBeTruthy();
    fireEvent.keyDown(win, { key: 'Escape' });
    // It animates out first, then goes.
    expect(win.classList.contains('closing')).toBe(true);
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Projects' })).toBeNull());
  });

  it('runs terminal commands, including the sudo easter egg', async () => {
    const user = boot();
    const dock = await toDesktop(user);
    await user.click(within(dock).getByRole('button', { name: 'Terminal' }));
    const input = screen.getByRole('textbox', { name: 'Terminal input' });
    await user.type(input, 'help{Enter}');
    expect(screen.getByText(/not on this list/i)).toBeTruthy();
    await user.type(input, 'echo <b>hi</b>{Enter}');
    // echo output is rendered as text, never as markup
    expect(screen.getAllByText(/<b>hi<\/b>/).length).toBeGreaterThan(0);
    await user.type(input, 'sudo hire atul{Enter}');
    const pw = screen.getByLabelText('Terminal input');
    expect(pw.getAttribute('type')).toBe('password');
    await user.type(pw, 'hunter2{Enter}');
    expect(screen.getAllByText(/permission granted/i).length).toBeGreaterThan(0);
    expect(localStorage.getItem('atulos.secrets')).toContain('sudo');
  });

  it('toggles retro mode with the Konami code', async () => {
    const user = boot();
    await toDesktop(user);
    await user.keyboard(
      '{ArrowUp}{ArrowUp}{ArrowDown}{ArrowDown}{ArrowLeft}{ArrowRight}{ArrowLeft}{ArrowRight}ba',
    );
    expect(document.documentElement.classList.contains('retro')).toBe(true);
    expect(localStorage.getItem('atulos.secrets')).toContain('konami');
  });

  it('remembers the wallpaper choice and ignores tampered values', async () => {
    localStorage.setItem('atulos.wall', '"<script>"');
    const user = boot();
    await toDesktop(user);
    expect(document.documentElement.dataset.wall).toBe('ember');
  });
});
