const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const gameEl = document.getElementById('game') as HTMLDivElement | null;

if (gameEl) {
  let started = false;

  const start = async () => {
    if (started) return;
    started = true;
    try {
      const { mount } = await import('./game/index');
      await mount(gameEl);
      gameEl.classList.add('loaded');
    } catch (err) {
      started = false;
      console.error('Failed to load game', err);
      const ph = document.getElementById('game-placeholder');
      if (ph) ph.textContent = 'Game failed to load';
    }
  };

  // Lazy: load when scrolled into view, or on first interaction.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            io.disconnect();
            start();
            break;
          }
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(gameEl);
  }

  gameEl.addEventListener('pointerdown', start, { once: true });
}
