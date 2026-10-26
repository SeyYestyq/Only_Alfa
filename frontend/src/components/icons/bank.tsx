"use client";

/**
 * Bank — Iconimate
 *
 * Installed from https://iconimate.app/r/bank.json
 * Version 1098ac5fe240 · icon last changed 2026-08-12
 *
 * This file is a COPY and does not update itself. To pull the current version:
 *   npx shadcn@latest add https://iconimate.app/r/bank.json
 * To check whether yours is behind, compare the version above against
 * https://iconimate.app/r/registry.json.
 *
 * Animation code: copyright (c) 2026 Muhammad Ammar (smammar100), MIT.
 * Glyph geometry: Phosphor Icons, copyright (c) 2023 Phosphor Icons, MIT.
 *                 https://phosphoricons.com
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { DOMAttributes, HTMLAttributes } from "react";
import { motion, useAnimation, useReducedMotion } from "motion/react";
import type { Transition, Variants } from "motion/react";

/** Imperative handle every icon exposes — lets consumers trigger motion on touch, where `:hover` never fires. */
export interface IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export interface IconProps extends HTMLAttributes<HTMLDivElement> {
  /** Rendered width & height in px. Defaults to 28; the set is calibrated to read at 24 (ship size). */
  size?: number;
}

/** A cubic-bezier easing curve. */
export type Bezier = [number, number, number, number];

/** Confident in/out for travels — slides and sweeps across the artboard. */
export const SWEEP: Bezier = [0.65, 0, 0.35, 1];

/** Decelerate-to-rest with an expo-out tail — things landing / arriving. */
export const ARRIVE: Bezier = [0.16, 1, 0.3, 1];

/** Gentle standard glide — used by every "normal" variant for hover-out. */
export const RETURN: Bezier = [0.4, 0, 0.2, 1];

/** Duration scale in seconds, calibrated for legibility at the 24px ship size. */
export const DUR = { instant: 0.12, fast: 0.2, base: 0.32, slow: 0.5 } as const;

/**
 * The canonical hover-out transition. Spread into every "normal" variant so that
 * interrupting a hover glides the icon home instead of snapping.
 */
export const RETURN_TRANSITION: Transition = { duration: DUR.base, ease: RETURN };

/* ─────────────────────────────────────────────────────────────────────────────
 * Principle helpers — shared vocabulary for Disney's 12 principles. See MOTION.md.
 * Additive only; pure data/factories (server-safe). Reach for these instead of
 * inlining magic numbers so the whole set speaks one language.
 * ───────────────────────────────────────────────────────────────────────────── */

/** The controls object returned by `useAnimation()` — derived to stay resilient to motion's type renames. */
type AnimationControls = ReturnType<typeof useAnimation>;

export interface HoverController {
  /** The single controls instance every animated element in the icon is gated through. */
  controls: AnimationControls;
  /**
   * True when the icon should render its static fallback instead of animating.
   *
   * Deliberately **not** the OS `prefers-reduced-motion` value. Taking the static
   * path leaves a reduced-motion visitor unable to preview an icon at all, which
   * defeats a gallery whose entire content is motion. The preference is honoured
   * on `ambient` instead: an explicit hover/tap still performs the gesture once,
   * but nothing repeats unattended. Kept as a field so the per-icon static
   * fallbacks stay wired and a product decision can switch them on in one place.
   */
  reduced: boolean;
  /**
   * True when motion may repeat on its own — the replay loop below, and any
   * icon transition carrying `repeat: Infinity`.
   *
   * False when the user prefers reduced motion. Icons with ambient/looping
   * tracks must gate `repeat` on this; one-shot gestures ignore it, because a
   * gesture the user asked for by hovering is not unattended motion.
   */
  ambient: boolean;
  /** Play the "animate" variant. */
  start: () => void;
  /** Glide back to the "normal" variant. */
  stop: () => void;
  /** Spread onto the icon's wrapper. Keyboard focus triggers it too, not just pointer. */
  bind: Pick<DOMAttributes<Element>, "onMouseEnter" | "onMouseLeave" | "onFocus" | "onBlur">;
}

/**
 * The common-case hover controller. Owns one `useAnimation` instance and the
 * enter / leave / focus / blur wiring, so motion across every element of an icon
 * is gated through a single source of truth.
 *
 * Per-icon files layer `forwardRef` + `useImperativeHandle` on top of this to
 * expose `startAnimation` / `stopAnimation`, since `:hover` never fires on touch.
 */
export function useHover(): HoverController {
  const controls = useAnimation();
  // Icons still animate for everyone — see `reduced` on HoverController for why
  // the static fallback is not wired to the OS preference.
  const reduced = false;
  // `useReducedMotion()` reads the media query directly and does NOT consult
  // <MotionConfig>, so app/providers.tsx's `reducedMotion="never"` cannot mask
  // this. That is intentional: this is the one place the real preference is read.
  const ambient = !(useReducedMotion() ?? false);

  // True while the pointer (or focus) is on the icon — the loop below keys off
  // it so the "animate" variant replays end-to-end until the user leaves.
  const looping = useRef(false);
  // The pending replay timer, tracked so stop()/unmount can clear it outright
  // rather than relying on a late fire noticing `looping` went false.
  const replayTimer = useRef<number | undefined>(undefined);

  const start = useCallback(() => {
    if (looping.current) return; // already looping — don't stack replays
    looping.current = true;
    const run = () => {
      if (!looping.current) return;
      const t0 = performance.now();
      void controls.start("animate").then(() => {
        if (!looping.current) return;
        // Snap back to "normal" (keyframes end where they start, so this is
        // invisible) so the next start("animate") actually replays — starting
        // a variant the elements are already at resolves immediately.
        controls.set("normal");
        // Reduced motion: the hover gets its one full pass — an explicit
        // preview the visitor asked for — and then stops. Nothing replays
        // unattended.
        if (!ambient) {
          looping.current = false;
          return;
        }
        // If the cycle resolved instantly (no animatable elements mounted),
        // pause before retrying instead of spinning a tight loop. Otherwise
        // breathe for 30% of the cycle before replaying, so the loop reads
        // as a rhythm rather than a frantic back-to-back repeat.
        const elapsed = performance.now() - t0;
        replayTimer.current = window.setTimeout(run, elapsed < 100 ? 300 : elapsed * 0.3);
      });
    };
    run();
  }, [controls, ambient]);

  const stop = useCallback(() => {
    looping.current = false;
    window.clearTimeout(replayTimer.current);
    void controls.start("normal");
  }, [controls]);

  // Never leave a loop or a pending replay running after unmount.
  useEffect(
    () => () => {
      looping.current = false;
      window.clearTimeout(replayTimer.current);
    },
    [],
  );

  return {
    controls,
    reduced,
    ambient,
    start,
    stop,
    bind: { onMouseEnter: start, onMouseLeave: stop, onFocus: start, onBlur: stop },
  };
}

// CONSTRUCT + $ — the bank builds itself: the ground slab lays down, the four
// columns rise from it left to right, the beam settles across them, the
// pediment lands with a soft overshoot — and once the last stone is placed, a
// dollar sign pops into the central bay and holds. Open for business.
//
// The Phosphor "bank" glyph is rebuilt from primitives that match it 1:1 so
// each architectural piece moves on its own:
//   PEDIMENT — roof band with its inner triangle punched even-odd.
//   COLUMNS  — four plain 16×64 rects (x48/96/144/192, y104–168).
//   BEAM     — the rounded entablature bar (y168–184).
//   GROUND   — the glyph's own rounded ground slab subpath (y200–216).
// The dollar sign is hidden at rest, so the resting glyph stays exact.
const PEDIMENT =
  "M232,104H24a8,8,0,0,1-4.19-14.81l104-64a8,8,0,0,1,8.38,0l104,64A8,8,0,0,1,232,104ZM52.26,88H203.74L128,41.39Z";
const COLUMNS = ["M48,104h16v64H48Z", "M96,104h16v64H96Z", "M144,104h16v64H144Z", "M192,104h16v64H192Z"];
const BEAM = "M32,168H224a8,8,0,0,1,0,16H32a8,8,0,0,1,0-16Z";
const GROUND = "M248,208a8,8,0,0,1-8,8H16a8,8,0,0,1,0-16H240A8,8,0,0,1,248,208Z";
const DOLLAR_S =
  "M138.5,125.5c0-6-4.5-9.5-10.5-9.5s-10.5,3.5-10.5,8.5c0,11,21,8.5,21,19.5c0,5-4.5,8.5-10.5,8.5s-10.5-3.5-10.5-9.5";
const DOLLAR_BAR = "M128,108v52";

const AT = (x: number, y: number) => ({
  transformBox: "view-box" as const,
  originX: x / 256,
  originY: y / 256,
});
const FOUNDATION = AT(128, 208);
const ROOFLINE = AT(128, 104);

const ground: Variants = {
  normal: { scaleX: 1, transition: RETURN_TRANSITION },
  animate: { scaleX: [0, 1], transition: { duration: 0.28, ease: SWEEP } },
};
const column = (i: number): Variants => ({
  normal: { scaleY: 1, transition: RETURN_TRANSITION },
  animate: {
    scaleY: [0, 1],
    transition: { duration: 0.3, ease: SWEEP, delay: 0.24 + i * 0.09 },
  },
});
const beam: Variants = {
  normal: { opacity: 1, y: 0, transition: RETURN_TRANSITION },
  animate: {
    opacity: [0, 1],
    y: [-14, 0],
    transition: { duration: 0.3, ease: ARRIVE, delay: 0.72 },
  },
};
const pediment: Variants = {
  normal: { opacity: 1, y: 0, scale: 1, transition: RETURN_TRANSITION },
  animate: {
    opacity: [0, 1, 1],
    y: [-20, 2, 0],
    scale: [0.92, 1.02, 1],
    transition: { duration: 0.45, ease: ARRIVE, times: [0, 0.7, 1], delay: 1.0 },
  },
};
const dollar: Variants = {
  normal: { scale: 0, opacity: 0, transition: { duration: 0.12 } },
  animate: {
    // pop in once the pediment lands, then HOLD — this keyframe is the longest
    // animation in the variant, so the hover-replay loop waits for it and the
    // dollar stays on screen for over a second each cycle.
    scale: [0, 1.25, 1, 1],
    opacity: [0, 1, 1, 1],
    transition: { duration: 1.3, ease: ARRIVE, times: [0, 0.16, 0.27, 1], delay: 1.45 },
  },
};

export const BankIcon = forwardRef<IconHandle, IconProps>(function BankIcon(
  { size = 28, style, ...props },
  ref,
) {
  const { controls, reduced, start, stop, bind } = useHover();
  useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }), [start, stop]);

  if (reduced) {
    return (
      <div {...props} {...bind} style={{ display: "inline-flex", overflow: "hidden", ...style }}>
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
          <path d={PEDIMENT} fillRule="evenodd" />
          {COLUMNS.map((d) => (
            <path key={d} d={d} />
          ))}
          <path d={BEAM} />
          <path d={GROUND} />
        </svg>
      </div>
    );
  }

  return (
    <div {...props} {...bind} style={{ display: "inline-flex", overflow: "hidden", ...style }}>
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="currentColor"
        initial="normal"
        animate={controls}
        style={{ overflow: "visible" }}
      >
        <motion.path d={GROUND} variants={ground} style={FOUNDATION} />
        {COLUMNS.map((d, i) => (
          <motion.path key={d} d={d} variants={column(i)} style={AT(56 + i * 48, 168)} />
        ))}
        <motion.path d={BEAM} variants={beam} />
        <motion.path d={PEDIMENT} fillRule="evenodd" variants={pediment} style={ROOFLINE} />
        {/* Dollar sign in the central bay — pops once the pediment has landed. */}
        <motion.g variants={dollar} style={AT(128, 134)}>
          <path d={DOLLAR_S} fill="none" stroke="currentColor" strokeWidth={8} strokeLinecap="round" />
          <path d={DOLLAR_BAR} fill="none" stroke="currentColor" strokeWidth={8} strokeLinecap="round" />
        </motion.g>
      </motion.svg>
    </div>
  );
});
