"use client";

/**
 * List — Iconimate
 *
 * Installed from https://iconimate.app/r/list.json
 * Version 42da7d34840b · icon last changed 2026-09-02
 *
 * Animation code: copyright (c) 2026 Muhammad Ammar (smammar100), MIT.
 * Glyph geometry: Phosphor Icons, copyright (c) 2023 Phosphor Icons, MIT.
 *                 https://phosphoricons.com
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { DOMAttributes, HTMLAttributes } from "react";
import { motion, useAnimation, useReducedMotion } from "motion/react";
import type { Transition, Variants } from "motion/react";

export interface IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export interface IconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export type Bezier = [number, number, number, number];
export const ARRIVE: Bezier = [0.16, 1, 0.3, 1];
export const RETURN: Bezier = [0.4, 0, 0.2, 1];
export const DUR_TOKEN = { instant: 0.12, fast: 0.2, base: 0.32, slow: 0.5 } as const;
export const RETURN_TRANSITION: Transition = { duration: DUR_TOKEN.base, ease: RETURN };

type AnimationControls = ReturnType<typeof useAnimation>;

export interface HoverController {
  controls: AnimationControls;
  reduced: boolean;
  ambient: boolean;
  start: () => void;
  stop: () => void;
  bind: Pick<DOMAttributes<Element>, "onMouseEnter" | "onMouseLeave" | "onFocus" | "onBlur">;
}

export function useHover(): HoverController {
  const controls = useAnimation();
  const reduced = false;
  const ambient = !(useReducedMotion() ?? false);
  const looping = useRef(false);
  const replayTimer = useRef<number | undefined>(undefined);

  const start = useCallback(() => {
    if (looping.current) return;
    looping.current = true;
    const run = () => {
      if (!looping.current) return;
      const t0 = performance.now();
      void controls.start("animate").then(() => {
        if (!looping.current) return;
        controls.set("normal");
        if (!ambient) {
          looping.current = false;
          return;
        }
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

const X1 = 40;
const X2 = 216;
const ROWS = [64, 128, 192] as const;

const line = (y: number) => ({ x1: X1, y1: y, x2: X2, y2: y });

const DUR = 0.78;

const collapse = (dir: -1 | 0 | 1): Variants =>
  dir === 0
    ? { normal: { y: 0, transition: RETURN_TRANSITION }, animate: { y: 0 } }
    : {
        normal: { y: 0, transition: RETURN_TRANSITION },
        animate: {
          y: [0, dir * 64, dir * 64, dir * -5, 0],
          transition: {
            duration: DUR,
            times: [0, 0.34, 0.48, 0.62, 1],
            ease: ["easeInOut", "linear", "easeOut", ARRIVE],
          },
        },
      };

const DIRS = [1, 0, -1] as const;

export const ListIcon = forwardRef<IconHandle, IconProps>(function ListIcon(
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
          fill="none"
          stroke="currentColor"
          strokeWidth={16}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ROWS.map((y) => (
            <line key={y} {...line(y)} />
          ))}
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
        fill="none"
        stroke="currentColor"
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial="normal"
        animate={controls}
      >
        {ROWS.map((y, i) => (
          <motion.line key={y} {...line(y)} variants={collapse(DIRS[i])} />
        ))}
      </motion.svg>
    </div>
  );
});
