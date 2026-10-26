"use client";

/**
 * Arrow Line Up — Iconimate
 *
 * Installed from https://iconimate.app/r/arrow-line-up.json
 * Version c1a324a016fe · icon last changed 2026-08-12
 *
 * This file is a COPY and does not update itself. To pull the current version:
 *   npx shadcn@latest add https://iconimate.app/r/arrow-line-up.json
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

// Shared WHIP engine for the arrow-line family. Two flavors, both with the line
// recoiling — bowing away on impact like a trampoline, then wobbling back to flat.
// Principles: SQUASH & STRETCH (the arrow collapses into / lunges from its line),
// ANTICIPATION (the SHOOT mode winds back toward the line before lunging out),
// OVERLAPPING ACTION (the line reacts a beat AFTER the arrow lands, then wobbles),
// FOLLOW-THROUGH (the elastic settle). Reduced-motion: variants gate to undefined.
//
//  • SQUASH (straight arrows whose head points at the line): the arrow collapses
//    perpendicular into its line (scaleY / scaleX, anchored on the line) and whips
//    back out with an exaggerated overshoot + elastic bounce.
//  • SHOOT (diagonal arrows whose head points away from the line): the line wobbles
//    first as the arrow anticipates back toward it, then the arrow lunges out in the
//    direction its head points (overshoot) and settles.

type LineCfg = {
  orient: "h" | "v";
  /** Fixed coordinate of the line (y for horizontal, x for vertical). */
  at: number;
  /** Endpoints of the line along its length. */
  from: number;
  to: number;
  /** Signed peak bow offset on impact (+down/right, -up/left). */
  bow: number;
};
type Cfg = {
  arrow: string;
  line: LineCfg;
  /** SQUASH mode — perpendicular collapse into the line. */
  scale?: "scaleX" | "scaleY";
  origin?: { x: number; y: number };
  /** SHOOT mode — lunge in the head's pointing direction (e.g. {x:-1,y:1} = down-left). */
  dir?: { x: number; y: number };
};

const SHOOT_A = 9; // anticipation back toward the line
const SHOOT_S = 28; // lunge out in the pointing direction (overshoot)
const SHOOT_R = 6; // small bounce-back
function shootVariants(dir: { x: number; y: number }): Variants {
  return {
    normal: { x: 0, y: 0, transition: RETURN_TRANSITION },
    animate: {
      // rest → anticipate toward the line → lunge out (pointing dir) → bounce → settle
      x: [0, SHOOT_A * -dir.x, SHOOT_S * dir.x, SHOOT_R * -dir.x, 0],
      y: [0, SHOOT_A * -dir.y, SHOOT_S * dir.y, SHOOT_R * -dir.y, 0],
      transition: { duration: 1, ease: ["easeOut", "easeInOut", "easeOut", "easeInOut"], times: [0, 0.26, 0.58, 0.78, 1] },
    },
  };
}

function lineD(o: LineCfg, ctrl: number) {
  const mid = (o.from + o.to) / 2;
  return o.orient === "h"
    ? `M${o.from},${o.at}Q${mid},${ctrl},${o.to},${o.at}`
    : `M${o.at},${o.from}Q${ctrl},${mid},${o.at},${o.to}`;
}

const WHIP_KEYS = [1, 0.02, 1.5, 0.82, 1.16, 0.95, 1.03, 1];
const WHIP_T: Transition = { duration: 1, ease: "easeInOut", times: [0, 0.16, 0.42, 0.58, 0.72, 0.84, 0.93, 1] };
const whipY: Variants = { normal: { scaleY: 1, transition: RETURN_TRANSITION }, animate: { scaleY: WHIP_KEYS, transition: WHIP_T } };
const whipX: Variants = { normal: { scaleX: 1, transition: RETURN_TRANSITION }, animate: { scaleX: WHIP_KEYS, transition: WHIP_T } };

export function makeArrowLineWhip({ arrow, line, scale, origin, dir }: Cfg) {
  const flat = lineD(line, line.at);
  const peak = lineD(line, line.at + line.bow);
  const back = lineD(line, line.at - line.bow * 0.5);
  const settle = lineD(line, line.at + line.bow * 0.3);

  // SHOOT (diagonal) vs SQUASH (straight) arrow motion.
  const arrowVariants = dir ? shootVariants(dir) : scale === "scaleX" ? whipX : whipY;
  const arrowStyle =
    dir || !origin ? undefined : { transformBox: "view-box" as const, originX: origin.x, originY: origin.y };

  const lineWobble: Variants = {
    normal: { d: flat, transition: RETURN_TRANSITION },
    animate: {
      // flat until the arrow lands (~0.14), then bow away and wobble back to flat
      d: [flat, flat, peak, back, settle, flat],
      transition: { duration: 1, ease: "easeInOut", times: [0, 0.14, 0.3, 0.5, 0.74, 1] },
    },
  };

  return forwardRef<IconHandle, IconProps>(function ArrowLineWhipIcon({ size = 28, style, ...props }, ref) {
    const { controls, reduced, start, stop, bind } = useHover();
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }), [start, stop]);
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
          <motion.path d={arrow} variants={reduced ? undefined : arrowVariants} style={arrowStyle} />
          <motion.path
            d={flat}
            variants={reduced ? undefined : lineWobble}
            fill="none"
            stroke="currentColor"
            strokeWidth={16}
            strokeLinecap="round"
          />
        </motion.svg>
      </div>
    );
  });
}

// WHIP — arrow folds up into the top line and whips back out.
export const ArrowLineUpIcon = makeArrowLineWhip({
  arrow:
    "M205.66,138.34a8,8,0,0,1-11.32,11.32L136,91.31V224a8,8,0,0,1-16,0V91.31L61.66,149.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0Z",
  line: { orient: "h", at: 40, from: 40, to: 216, bow: -40 },
  scale: "scaleY",
  origin: { x: 0.5, y: 40 / 256 },
});
