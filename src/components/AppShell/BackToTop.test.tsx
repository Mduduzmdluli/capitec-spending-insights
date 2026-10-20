import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BackToTop } from './BackToTop';

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  fireEvent.scroll(window);
}

const renderPage = () =>
  render(
    <>
      <main id="main" tabIndex={-1}>
        Page content
      </main>
      <BackToTop targetId="main" />
    </>,
  );

afterEach(() => {
  scrollTo(0);
  vi.restoreAllMocks();
});

describe('BackToTop', () => {
  it('stays hidden near the top of the page', () => {
    renderPage();
    scrollTo(200);
    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();
  });

  it('appears once the page has been scrolled a fair way', () => {
    renderPage();
    scrollTo(800);
    expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();
  });

  it('scrolls to the top and moves focus there', async () => {
    const scrollToTop = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const user = userEvent.setup();
    renderPage();
    scrollTo(800);

    await user.click(screen.getByRole('button', { name: 'Back to top' }));

    expect(scrollToTop).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    expect(screen.getByRole('main')).toHaveFocus();
  });
});
