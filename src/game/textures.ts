import * as THREE from 'three';

const SIZE = 128;

function makeCanvas(): { ctx: CanvasRenderingContext2D; canvas: HTMLCanvasElement } {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  return { ctx, canvas };
}

function noise(ctx: CanvasRenderingContext2D, alpha: number, scale = 1) {
  const img = ctx.getImageData(0, 0, SIZE, SIZE);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 255 * alpha * scale;
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

function bevel(ctx: CanvasRenderingContext2D, inset: number, light: string, dark: string) {
  ctx.lineWidth = 2;
  // Top + left highlight
  ctx.strokeStyle = light;
  ctx.beginPath();
  ctx.moveTo(inset, SIZE - inset);
  ctx.lineTo(inset, inset);
  ctx.lineTo(SIZE - inset, inset);
  ctx.stroke();
  // Bottom + right shadow
  ctx.strokeStyle = dark;
  ctx.beginPath();
  ctx.moveTo(SIZE - inset, inset);
  ctx.lineTo(SIZE - inset, SIZE - inset);
  ctx.lineTo(inset, SIZE - inset);
  ctx.stroke();
}

function finish(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export function makeTileTexture(): THREE.CanvasTexture {
  const { ctx, canvas } = makeCanvas();
  // Base
  const grad = ctx.createLinearGradient(0, 0, 0, SIZE);
  grad.addColorStop(0, '#2a2a36');
  grad.addColorStop(1, '#1c1c26');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);
  noise(ctx, 0.08);
  bevel(ctx, 3, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.35)');
  return finish(canvas);
}

export function makeGoalTexture(): THREE.CanvasTexture {
  const { ctx, canvas } = makeCanvas();
  const grad = ctx.createLinearGradient(0, 0, 0, SIZE);
  grad.addColorStop(0, '#2a2a36');
  grad.addColorStop(1, '#1c1c26');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);
  noise(ctx, 0.08);
  // Concentric rings centered
  const cx = SIZE / 2, cy = SIZE / 2;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#d97a3c';
  ctx.beginPath();
  ctx.arc(cx, cy, SIZE * 0.32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(217,122,60,0.55)';
  ctx.beginPath();
  ctx.arc(cx, cy, SIZE * 0.22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(217,122,60,0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, SIZE * 0.10, 0, Math.PI * 2);
  ctx.fill();
  bevel(ctx, 3, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.35)');
  return finish(canvas);
}

export function makeBlockTexture(): THREE.CanvasTexture {
  const { ctx, canvas } = makeCanvas();
  const grad = ctx.createLinearGradient(0, 0, 0, SIZE);
  grad.addColorStop(0, '#e08a4a');
  grad.addColorStop(1, '#b96a30');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);
  noise(ctx, 0.06);
  // Subtle hatching for grain
  ctx.strokeStyle = 'rgba(0,0,0,0.07)';
  ctx.lineWidth = 1;
  for (let i = -SIZE; i < SIZE; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + SIZE, SIZE);
    ctx.stroke();
  }
  bevel(ctx, 4, 'rgba(255,255,255,0.18)', 'rgba(0,0,0,0.30)');
  return finish(canvas);
}
