import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  phase: number;
  phaseSpeed: number;
  baseAlpha: number;
  spark?: boolean;
  life?: number;
  maxLife?: number;
}

interface FirefliesProps {
  /** Ambient glow color as an "r,g,b" triplet (no `rgba(...)` wrapper). Ignored if `palette` is set. */
  color?: string;
  /** Multiple firefly colors ("r,g,b" triplets) — each firefly picks one at spawn. Overrides `color`. */
  palette?: string[];
  /** Spark color used for the correct-answer/burst flashes, same "r,g,b" format. */
  burstColor?: string;
  /** 0–1 baseline energy (e.g. an answer streak) — speeds up and brightens the ambient drift. */
  energy?: number;
  /** Bump this number to fire a burst: a brightness/speed spike plus a few short-lived sparks. */
  burstSignal?: number;
  /** Nearby fireflies drift toward and brighten near the pointer. */
  mouseReactive?: boolean;
  /** Fireflies per pixel of area — lower is sparser. Default reads as a scattering of ~20–35 on a full screen. */
  densityDivisor?: number;
  reducedMotion?: boolean;
  className?: string;
  /** Merged into the canvas's own style — use to set z-index, since it paints as a positioned child. */
  style?: CSSProperties;
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, alpha: number) {
  const outer = r * 3;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, outer);
  grad.addColorStop(0, `rgba(${rgb},${alpha})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, outer, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(${rgb},${Math.min(1, alpha * 1.2)})`;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function pickColor(palette: string[] | undefined, fallback: string): string {
  if (!palette || palette.length === 0) return fallback;
  return palette[Math.floor(Math.random() * palette.length)];
}

function seedFireflies(width: number, height: number, palette: string[] | undefined, fallback: string, densityDivisor: number): Firefly[] {
  const area = width * height;
  const count = Math.max(24, Math.min(80, Math.round(area / densityDivisor)));
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    r: 1.4 + Math.random() * 2.2,
    color: pickColor(palette, fallback),
    phase: Math.random() * Math.PI * 2,
    phaseSpeed: 0.007 + Math.random() * 0.012,
    baseAlpha: 0.18 + Math.random() * 0.24,
  }));
}

/**
 * Ambient glowing-particle backdrop. Mounts as an absolutely-positioned canvas
 * sized to the nearest positioned ancestor — make that ancestor span whatever
 * area the fireflies should cover (a section, or the whole page).
 */
export function Fireflies({
  color = '20,184,166',
  palette,
  burstColor = '250,204,21',
  energy = 0,
  burstSignal = 0,
  mouseReactive = false,
  densityDivisor = 26000,
  reducedMotion = false,
  className,
  style,
}: FirefliesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firefliesRef = useRef<Firefly[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const burstEnergyRef = useRef(0);
  const prevBurstSignalRef = useRef(burstSignal);

  // Read via refs inside the animation loop so streak/burst updates don't tear
  // down and re-seed the particle field on every render.
  const energyRef = useRef(energy);
  energyRef.current = energy;
  const burstSignalRef = useRef(burstSignal);
  burstSignalRef.current = burstSignal;
  const colorRef = useRef(color);
  colorRef.current = color;
  const paletteRef = useRef(palette);
  paletteRef.current = palette;
  const burstColorRef = useRef(burstColor);
  burstColorRef.current = burstColor;

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !parent || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      firefliesRef.current = seedFireflies(width, height, paletteRef.current, colorRef.current, densityDivisor);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleLeave = () => { mouseRef.current = null; };
    if (mouseReactive) {
      parent.addEventListener('mousemove', handleMove);
      parent.addEventListener('mouseleave', handleLeave);
    }

    if (reducedMotion) {
      // Static, motion-free rendering: no drift, no burst sparks, just a soft ambient field.
      ctx.clearRect(0, 0, width, height);
      for (const f of firefliesRef.current) {
        drawGlow(ctx, f.x, f.y, f.r * 1.4, f.color, f.baseAlpha * 0.6);
      }
      return () => ro.disconnect();
    }

    let rafId: number;
    const tick = () => {
      burstEnergyRef.current *= 0.94;
      if (prevBurstSignalRef.current !== burstSignalRef.current) {
        prevBurstSignalRef.current = burstSignalRef.current;
        burstEnergyRef.current = 1;
        for (let i = 0; i < 6; i++) {
          firefliesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4 - 0.15,
            r: 1.6 + Math.random() * 1.6,
            color: burstColorRef.current,
            phase: Math.random() * Math.PI * 2,
            phaseSpeed: 0.03,
            baseAlpha: 0.9,
            spark: true,
            life: 0,
            maxLife: 70 + Math.random() * 30,
          });
        }
      }

      const speedMul = 1 + energyRef.current * 1.4 + burstEnergyRef.current * 2.2;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, width, height);

      firefliesRef.current = firefliesRef.current.filter((f) => {
        if (f.spark) {
          f.life = (f.life ?? 0) + 1;
          if (f.life > (f.maxLife ?? 100)) return false;
        }

        f.phase += f.phaseSpeed;
        f.x += f.vx * speedMul;
        f.y += f.vy * speedMul;

        // Continuous random steering so ambient drift holds a steady, visible pace
        // instead of decaying to a standstill under the drag below.
        if (!f.spark) {
          f.vx += (Math.random() - 0.5) * 0.1;
          f.vy += (Math.random() - 0.5) * 0.1;
        }

        let nearMouseBoost = 0;
        if (mouse) {
          const dx = mouse.x - f.x;
          const dy = mouse.y - f.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120 && dist > 0.01) {
            f.vx += (dx / dist) * 0.0025;
            f.vy += (dy / dist) * 0.0025;
            nearMouseBoost = 0.15 * (1 - dist / 120);
          }
        }
        f.vx *= 0.975;
        f.vy *= 0.975;

        if (!f.spark) {
          if (f.x < -10) f.x = width + 10;
          if (f.x > width + 10) f.x = -10;
          if (f.y < -10) f.y = height + 10;
          if (f.y > height + 10) f.y = -10;
        }

        const twinkle = 0.5 + 0.5 * Math.sin(f.phase);
        const fade = f.spark ? Math.max(0, 1 - f.life! / (f.maxLife ?? 100)) : 1;
        const alpha = Math.min(1, (f.baseAlpha * (0.5 + 0.5 * twinkle) + nearMouseBoost + burstEnergyRef.current * 0.25) * fade);
        drawGlow(ctx, f.x, f.y, f.r * (1.4 + burstEnergyRef.current * 0.6), f.color, alpha);
        return true;
      });

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
      parent.removeEventListener('mousemove', handleMove);
      parent.removeEventListener('mouseleave', handleLeave);
    };
  }, [mouseReactive, reducedMotion, densityDivisor]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}
    />
  );
}
