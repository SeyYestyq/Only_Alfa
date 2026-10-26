"use client";

/**
 * Bell Ringing — Iconimate
 *
 * Installed from https://iconimate.app/r/bell-ringing.json
 * Version 33e99ff04024 · icon last changed 2026-08-12
 *
 * This file is a COPY and does not update itself. To pull the current version:
 *   npx shadcn@latest add https://iconimate.app/r/bell-ringing.json
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

// EMIT — the bell rocks, the clapper trails it, and the sound leaves as two wavefronts that
// travel outward and fade, twice over the gesture.
//
// The arcs are CONCENTRIC on the dome centre (128,112), which is what makes this honest:
// scaling about that point moves them along their own radius, so they genuinely travel away
// from the bell rather than just getting bigger. Two passes rather than one, because a
// single expansion reads as a throb while two read as sound leaving. The shell and clapper
// keyframes are the same RING motion shipping in bell.tsx, so this icon is a sibling of that
// one rather than a second, unrelated gesture.
//
// THE SPLIT IS THE TRAP, AND IT IS THE SAME ONE THE PLAIN BELL HAS.
// The source draws the clapper as NEGATIVE SPACE: the collar's dip (r=40, x88.8..167.2) and
// the clapper's tongue (r=24, x105.38..150.62) are CONCENTRIC about (128,192) — measured at
// 192.04 and 191.98 — leaving a wall of exactly 40-24 = 16 units, the icon's stroke weight.
// Under nonzero the two cancel. Fill the tongue on its own and a solid blob hangs under the
// bell; mask it out and it survives rest but not motion, because sliding the hole leaves the
// crescent lopsided. So the dip comes OUT of the shell and the clapper is its own outline,
// an annular segment whose white middle is its own hollowness. No mask.
// Verified: ARC_R + ARC_L + SHELL + CLAPPER against the source glyph is 51 differing pixels
// at a max alpha gap of 63 — antialiasing where fills abut, not geometry.
//
// EVERY NUMBER IS MEASURED OFF THE PATH.
//   · shell spans x32..224 y32..200; the largest rotation about its crown (128,32) keeping
//     every sampled point on the artboard is 12.90°, so it swings 12;
//   · the clapper has 16.58 units of clearance to the wall, so it travels 16. It TRANSLATES
//     rather than rotates — it and the collar are concentric, so turning it about their
//     shared centre only slides it along a wall it is already parallel to (3.32 units of
//     travel, invisible at icon size) whereas sliding it crosses the gap;
//   · the arcs are concentric on the dome centre (128,112) and scale about it, so they move
//     along their own radius rather than merely enlarging. The cap before they leave the box
//     is 1.165, so they peak at 1.14.
//
// The arcs are PART OF THE SOURCE GLYPH, not added ink, so they rest at scale 1 and
// opacity 1 — the resting icon is the untouched Phosphor mark, arcs included.
const ARC_R =
  "M224,71.1a8,8,0,0,1-10.78-3.42,94.13,94.13,0,0,0-33.46-36.91,8,8,0,1,1,8.54-13.54,111.46,111.46,0,0,1,39.12,43.09A8,8,0,0,1,224,71.1Z";
const ARC_L =
  "M35.71,72a8,8,0,0,0,7.1-4.32A94.13,94.13,0,0,1,76.27,30.77a8,8,0,1,0-8.54-13.54A111.46,111.46,0,0,0,28.61,60.32,8,8,0,0,0,35.71,72Z";
const SHELL =
  "M221.81,175.94A16,16,0,0,1,208,200H48a16,16,0,0,1-13.79-24.06C43.22,160.39,48,138.28,48,112a80,80,0,0,1,160,0C208,138.27,212.78,160.38,221.81,175.94Z" +
  "M208,184c-10.64-18.27-16-42.49-16-72a64,64,0,0,0-128,0c0,29.52-5.38,53.74-16,72Z";
const CLAPPER = "M167.2,200a40,40,0,0,1-78.4,0L105.38,200a24,24,0,0,0,45.24,0Z";
// Full original glyph, for the reduced-motion static render.
const BELL_RINGING =
  "M224,71.1a8,8,0,0,1-10.78-3.42,94.13,94.13,0,0,0-33.46-36.91,8,8,0,1,1,8.54-13.54,111.46,111.46,0,0,1,39.12,43.09A8,8,0,0,1,224,71.1ZM35.71,72a8,8,0,0,0,7.1-4.32A94.13,94.13,0,0,1,76.27,30.77a8,8,0,1,0-8.54-13.54A111.46,111.46,0,0,0,28.61,60.32,8,8,0,0,0,35.71,72Zm186.1,103.94A16,16,0,0,1,208,200H167.2a40,40,0,0,1-78.4,0H48a16,16,0,0,1-13.79-24.06C43.22,160.39,48,138.28,48,112a80,80,0,0,1,160,0C208,138.27,212.78,160.38,221.81,175.94ZM150.62,200H105.38a24,24,0,0,0,45.24,0ZM208,184c-10.64-18.27-16-42.49-16-72a64,64,0,0,0-128,0c0,29.52-5.38,53.74-16,72Z";

const CROWN = { transformBox: "view-box" as const, originX: 0.5, originY: 32 / 256 };
const DOME = { transformBox: "view-box" as const, originX: 0.5, originY: 112 / 256 };

const SWING = 12; // inside the measured 12.90° cap
const TRAVEL = 16; // inside the measured 16.58 clearance
const LOUD = 1.14; // inside the measured 1.165 scale cap

const shell: Variants = {
  normal: { rotate: 0, transition: RETURN_TRANSITION },
  animate: {
    rotate: [0, -11, SWING, -9.5, 7.4, -2.5, 0],
    transition: { duration: 0.85, times: [0, 0.2, 0.44, 0.64, 0.8, 0.92, 1], ease: "easeInOut" },
  },
};

const clapper: Variants = {
  normal: { x: 0, transition: RETURN_TRANSITION },
  animate: {
    // trails the shell by ~0.04 of the timeline, which is what makes it read as a heavy arm
    // being carried rather than a part glued to the bell
    x: [0, -TRAVEL, TRAVEL, -13, 9, -3.5, 0],
    transition: { duration: 0.85, times: [0, 0.24, 0.48, 0.68, 0.84, 0.94, 1], ease: "easeInOut" },
  },
};

// Both arcs travel together, out and back, twice. They return to scale 1 / opacity 1 inside
// the animation — they are part of the glyph, so the resting icon must be the untouched mark.
const arcs: Variants = {
  normal: { scale: 1, opacity: 1, transition: RETURN_TRANSITION },
  animate: {
    scale: [1, LOUD, 1, LOUD, 1],
    opacity: [1, 0.25, 1, 0.35, 1],
    transition: { duration: 0.85, times: [0, 0.22, 0.44, 0.66, 1], ease: "easeInOut" },
  },
};

export const BellRingingIcon = forwardRef<IconHandle, IconProps>(function BellRingingIcon(
  { size = 28, style, ...props },
  ref,
) {
  const { controls, reduced, start, stop, bind } = useHover();
  useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }), [start, stop]);

  if (reduced) {
    return (
      <div {...props} {...bind} style={{ display: "inline-flex", overflow: "hidden", ...style }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 256 256"
          fill="currentColor"
        >
          <path d={BELL_RINGING} />
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
        {/* The arcs sit OUTSIDE the shell group: sound does not swing with the thing
            emitting it, and a fixed reference is what makes the shell's rock readable. */}
        <motion.g variants={arcs} style={DOME}>
          <path d={ARC_L} />
          <path d={ARC_R} />
        </motion.g>

        <motion.g variants={shell} style={CROWN}>
          <path d={SHELL} />
          <motion.path d={CLAPPER} variants={clapper} />
        </motion.g>
      </motion.svg>
    </div>
  );
});
