import type { Dir } from './block';

export type InputHandler = (dir: Dir) => void;

export function attachInput(host: HTMLElement, onMove: InputHandler): () => void {
  const keyHandler = (e: KeyboardEvent) => {
    let dir: Dir | null = null;
    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A': dir = 'left'; break;
      case 'ArrowRight': case 'd': case 'D': dir = 'right'; break;
      case 'ArrowUp': case 'w': case 'W': dir = 'up'; break;
      case 'ArrowDown': case 's': case 'S': dir = 'down'; break;
    }
    if (dir) {
      e.preventDefault();
      onMove(dir);
    }
  };
  window.addEventListener('keydown', keyHandler);

  // Touch / swipe on the host canvas area.
  let startX = 0, startY = 0, tracking = false;
  const SWIPE_THRESHOLD = 24;
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    tracking = true;
    startX = e.clientX;
    startY = e.clientY;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      onMove(dx > 0 ? 'right' : 'left');
    } else {
      onMove(dy > 0 ? 'down' : 'up');
    }
  };
  host.addEventListener('pointerdown', onPointerDown);
  host.addEventListener('pointerup', onPointerUp);
  host.addEventListener('pointercancel', () => { tracking = false; });

  // On-screen d-pad for touch devices (or anyone, really).
  const pad = document.createElement('div');
  pad.className = 'dpad';
  pad.innerHTML = `
    <button data-dir="up"    aria-label="Up">▲</button>
    <button data-dir="left"  aria-label="Left">◀</button>
    <button data-dir="right" aria-label="Right">▶</button>
    <button data-dir="down"  aria-label="Down">▼</button>
  `;
  const padStyle = `
    .dpad {
      position: absolute;
      right: 12px;
      bottom: 12px;
      display: grid;
      grid-template-columns: repeat(3, 36px);
      grid-template-rows: repeat(3, 36px);
      gap: 4px;
      opacity: 0.85;
      pointer-events: auto;
    }
    .dpad button {
      grid-column: 2;
      grid-row: 1;
      background: rgba(20,20,28,0.6);
      color: #f4f1ea;
      border: 1px solid rgba(244,241,234,0.15);
      border-radius: 6px;
      font-size: 14px;
      padding: 0;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .dpad button[data-dir="left"] { grid-column: 1; grid-row: 2; }
    .dpad button[data-dir="right"] { grid-column: 3; grid-row: 2; }
    .dpad button[data-dir="down"] { grid-column: 2; grid-row: 3; }
    .dpad button:active { background: rgba(217,122,60,0.8); }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = padStyle;
  document.head.appendChild(styleEl);
  host.appendChild(pad);

  const padClick = (e: Event) => {
    const t = e.target as HTMLElement;
    const d = t.closest('button')?.dataset.dir as Dir | undefined;
    if (d) {
      e.preventDefault();
      onMove(d);
    }
  };
  pad.addEventListener('click', padClick);

  return () => {
    window.removeEventListener('keydown', keyHandler);
    host.removeEventListener('pointerdown', onPointerDown);
    host.removeEventListener('pointerup', onPointerUp);
    pad.removeEventListener('click', padClick);
    pad.remove();
    styleEl.remove();
  };
}
