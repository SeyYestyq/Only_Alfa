"use client";

/**
 * Blueprint — Iconimate
 *
 * Installed from https://iconimate.app/r/blueprint.json
 * Version b560081e01eb · icon last changed 2026-08-15
 *
 * This file is a COPY and does not update itself. To pull the current version:
 *   npx shadcn@latest add https://iconimate.app/r/blueprint.json
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

/** Gentle standard glide — used by every "normal" variant for hover-out. */
export const RETURN: Bezier = [0.4, 0, 0.2, 1];

/** Duration scale in seconds, calibrated for legibility at the 24px ship size. */
export const DUR_TOKEN = { instant: 0.12, fast: 0.2, base: 0.32, slow: 0.5 } as const;

/**
 * The canonical hover-out transition. Spread into every "normal" variant so that
 * interrupting a hover glides the icon home instead of snapping.
 */
export const RETURN_TRANSITION: Transition = { duration: DUR_TOKEN.base, ease: RETURN };

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

// DRAW & SNAP — the paper draws itself, and the moment it is finished the grid
// flies in and snaps onto it. Promoted from app/lab/blueprint (variant 6, which
// composes that page's `2 · Draw` with its `3 · Snap`).
//
// THIS MARK IS STROKED, NOT FILLED, AND THAT IS WHY THIS GESTURE IS HONEST HERE.
// `bird`, `heart` and `star` are filled compound paths: there is no stroke to run
// a dash along, so "drawing" them means faking it with clips. Every element here
// is already `fill="none" stroke="currentColor" stroke-width="16"`, so
// `pathLength` is native and free. Do not port this gesture to a filled icon.
//
// THE COMPOSITION IS THE POINT. Drawn by one pen, the sheet and grid read as a
// single continuous act of drawing. Snapped in together, the sheet is a given and
// only the grid is placed. Doing the sheet with the pen and the grid with the
// snap gives what neither has alone: paper is DRAWN, marks are PLACED — two
// different tools, in the right order.
//
// THE HANDOFF IS THE ONLY REAL TUNING DECISION. The pen lands at 0.50 and the
// first line begins its approach at 0.54. That 4% beat of stillness is what makes
// the paper visibly exist before anything lands on it; start the snap earlier and
// the lines fly toward a sheet still being drawn, which reads as two animations
// colliding rather than one handing off to the other.
//
// THE OPACITY TWEENS ARE LOAD-BEARING, NOT DECORATION. Every element here is
// round-capped, and a round-capped stroke at `pathLength: 0` renders a full
// 16-wide DOT parked at its start point — so without them the sheet shows a blob
// at (24,176) and, in the lab's other draw variants, four dots sit on the paper
// through the whole hold. (`bell-simple-slash` documents the same trap.) The two
// cases need DIFFERENT remedies and must not be merged:
//   - the OUTLINE gets a fast, separate tween (up over the first 0.05). Fading it
//     across its whole draw would hold the finished part of the line
//     semi-transparent for a full second.
//   - the GRID lines fade across their own approach, which is already what the
//     snap does, so it costs nothing.
// Butt caps would also kill the dots, at the cost of flat-ending every line.
//
// EACH LINE ENTERS ALONG ITS OWN AXIS — verticals from above and below,
// horizontals from left and right. A line entering across its own length reads as
// a wipe; entering along it reads as a part being placed. The overshoot is small
// and the settle fast (-6% and out): blueprint lines land on a measurement, and a
// springy bounce reads as jelly.
//
// THE RIGHT-HAND LINE STARTS OFF-CANVAS (x104..192 shifted +80 reaches x272,
// past the 256 wall) and the wrapper keeps `overflow: hidden`, so it is clipped
// until it enters. That is deliberate: it fades in while travelling, so only the
// faint leading frames are clipped, and nothing paints outside the box at rest.
//
// NO `repeat: Infinity` ANYWHERE, so there is no per-transition ambient gating to
// do — the hover replay loop in use-hover is already gated.
const MARK = "M24,176V64A24,24,0,0,1,48,40H64V152H48a24,24,0,0,0,0,48H232V64H64";

/** The four grid lines: verticals at x128/x168, horizontals at y112/y144. */
const GRID = [
  { x1: 128, y1: 96, x2: 128, y2: 160 },
  { x1: 168, y1: 96, x2: 168, y2: 160 },
  { x1: 104, y1: 112, x2: 192, y2: 112 },
  { x1: 104, y1: 144, x2: 192, y2: 144 },
];

/** The mark is stroke-only; it is never filled. */
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 16,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const DUR = 1.9;

const sheet: Variants = {
  normal: { pathLength: 1, opacity: 1, transition: RETURN_TRANSITION },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      pathLength: { duration: DUR, times: [0, 0.5], ease: "easeInOut" },
      opacity: { duration: DUR, times: [0, 0.05], ease: "linear" },
    },
  },
};

/** Enters from (dx, dy), holding off-frame until `delay`, then settling. */
function snapFrom(dx: number, dy: number, delay: number): Variants {
  return {
    normal: { x: 0, y: 0, opacity: 1, transition: RETURN_TRANSITION },
    animate: {
      x: [dx, dx, -dx * 0.06, 0, 0],
      y: [dy, dy, -dy * 0.06, 0, 0],
      opacity: [0, 0, 1, 1, 1],
      transition: {
        duration: DUR,
        times: [0, delay, Math.min(delay + 0.22, 0.94), Math.min(delay + 0.32, 0.98), 1],
        ease: ["linear", [0.2, 0.9, 0.3, 1], "easeOut", "linear"],
      },
    },
  };
}
// 0.08 apart, tighter than a snap-only pass would be, because the grid has only
// the back half of the cycle to finish in.
const SNAPS = [snapFrom(0, -70, 0.54), snapFrom(0, 70, 0.62), snapFrom(-80, 0, 0.7), snapFrom(80, 0, 0.78)];

export const BlueprintIcon = forwardRef<IconHandle, IconProps>(function BlueprintIcon(
  { size = 28, style, ...props },
  ref,
) {
  const { controls, reduced, start, stop, bind } = useHover();
  useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }), [start, stop]);

  if (reduced) {
    return (
      <div {...props} {...bind} style={{ display: "inline-flex", overflow: "hidden", ...style }}>
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 256 256">
          <g {...STROKE}>
            <path d={MARK} />
            {GRID.map((l, i) => (
              <line key={i} {...l} />
            ))}
          </g>
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
        initial="normal"
        animate={controls}
        style={{ overflow: "visible" }}
      >
        <g {...STROKE}>
          {/* The pen draws the sheet; the grid is placed onto it afterwards. */}
          <motion.path d={MARK} variants={sheet} />
          {GRID.map((l, i) => (
            <motion.line key={i} {...l} variants={SNAPS[i]} />
          ))}
        </g>
      </motion.svg>
    </div>
  );
});
