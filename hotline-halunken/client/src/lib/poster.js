import { money, t } from './i18n.js';

// Erzeugt ein teilbares „Mitarbeiter des Monats“-Poster (1080×1350, ideal für Instagram/TikTok).

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth, size, font) {
  let s = size;
  ctx.font = `${s}px ${font}`;
  while (ctx.measureText(text).width > maxWidth && s > 20) {
    s -= 4;
    ctx.font = `${s}px ${font}`;
  }
  return s;
}

export async function renderPoster({ player, rank, total, awards = [] }) {
  try {
    await Promise.all([document.fonts?.load('80px Bungee'), document.fonts?.load('900 40px Rubik')]);
  } catch {
    /* Fallback-Schrift */
  }
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const display = 'Bungee, Impact, sans-serif';
  const body = 'Rubik, Arial, sans-serif';

  // Hintergrund mit Punkteraster
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  for (let y = 0; y < H; y += 28) for (let x = (y / 28) % 2 ? 14 : 0; x < W; x += 28) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Karte
  ctx.fillStyle = '#0b0614';
  roundRect(ctx, 76, 86, W - 140, H - 160, 40);
  ctx.fill();
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 60, 70, W - 140, H - 160, 40);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#0b0614';
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#0b0614';
  ctx.font = `700 34px ${body}`;
  ctx.fillText(t('poster.company'), W / 2 - 10, 150);

  const title = rank <= 3 ? t(`poster.rank${rank}`) : t('poster.rankN', { rank, total });
  const size = fitText(ctx, title, W - 260, 78, display);
  ctx.fillStyle = '#ff4f8b';
  ctx.fillText(title, W / 2 - 6, 250 + (78 - size) / 2);
  ctx.fillStyle = '#0b0614';
  ctx.fillText(title, W / 2 - 10, 246 + (78 - size) / 2);

  // Foto
  const cx = W / 2 - 10;
  const cy = 520;
  ctx.fillStyle = '#0b0614';
  ctx.beginPath();
  ctx.arc(cx + 12, cy + 12, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = player.color || '#3ddcff';
  ctx.beginPath();
  ctx.arc(cx, cy, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.font = `230px ${body}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(player.avatar || '😈', cx, cy + 12);
  ctx.textBaseline = 'alphabetic';

  // Name + Beute
  ctx.fillStyle = '#0b0614';
  fitText(ctx, player.name, W - 300, 96, display);
  ctx.fillText(player.name, cx, 840);
  ctx.font = `900 58px ${body}`;
  ctx.fillStyle = '#16a34a';
  ctx.fillText(t('poster.loot', { amount: money(player.score) }), cx, 920);

  // Awards
  ctx.fillStyle = '#0b0614';
  ctx.font = `700 40px ${body}`;
  const list = awards.slice(0, 3);
  list.forEach((a, i) => ctx.fillText(`${a.emoji} ${t(`award.${a.id}.title`)}`, cx, 990 + i * 50));
  if (!list.length) ctx.fillText(`📞 ${t('poster.busy')}`, cx, 1000);

  // Stempel
  ctx.save();
  ctx.translate(W - 250, 700);
  ctx.rotate(-0.28);
  ctx.strokeStyle = '#e11d48';
  ctx.fillStyle = '#e11d48';
  ctx.lineWidth = 8;
  roundRect(ctx, -150, -52, 300, 104, 16);
  ctx.stroke();
  ctx.font = `44px ${display}`;
  ctx.fillText(t('poster.stamp1'), 0, -2);
  ctx.font = `700 28px ${body}`;
  ctx.fillText(t('poster.stamp2'), 0, 36);
  ctx.restore();

  // Fußzeile
  ctx.fillStyle = '#0b0614';
  ctx.font = `44px ${display}`;
  ctx.fillText('HOTLINE HALUNKEN', cx, H - 150);
  ctx.font = `500 26px ${body}`;
  ctx.fillText(`${window.location.host} · ${t('poster.footer')}`, cx, H - 110);

  return canvas;
}

export async function downloadPoster(opts) {
  const canvas = await renderPoster(opts);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;
  const filename = `hotline-halunken-${(opts.player.name || 'halunke').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;

  // Am Handy direkt teilen (Instagram, TikTok, WhatsApp …), am PC herunterladen.
  const file = new File([blob], filename, { type: 'image/png' });
  const touch = window.matchMedia?.('(pointer: coarse)').matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'HOTLINE HALUNKEN', text: t('poster.shareText') });
      return;
    } catch {
      /* abgebrochen → normaler Download */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
