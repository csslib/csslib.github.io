// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { ColorMath } from './color-math.js';
import { STEP_BANDS } from '../config/constants.js';

export const EASING_PRESETS = {
  'smoothstep': { label: 'Organic Smooth', p1: [0.65, 0.0], p2: [0.35, 1.0] },
  'gaussian': { label: 'Gaussian Bell', p1: [0.45, 0.05], p2: [0.25, 1.0] },
  'expo-out': { label: 'Soft Plume', p1: [0.16, 1.0], p2: [0.30, 1.0] },
  'linear': { label: 'Linear (1:1)', p1: [0.25, 0.25], p2: [0.75, 0.75] },
  'dramatic': { label: 'Sharp Terrace', p1: [0.85, 0.0], p2: [0.15, 1.0] },
  'steps': { label: 'Contour Rings', p1: [0.5, 0.0], p2: [0.5, 1.0] }
};

const DEFAULT_EASING_CURVE = { p1: [0.65, 0.0], p2: [0.35, 1.0] };
const BEZIER_SOLVER = { iterations: 6, epsilon: 1e-5, linearTolerance: 0.001 };
const MIDPOINT_LIMITS = { min: 0.08, max: 0.92, neutral: 0.5, neutralTolerance: 0.005 };

export class Easing {
  static sampleBezierAxis(t, firstControl, secondControl) {
    return 3 * (1 - t) * (1 - t) * t * firstControl + 3 * (1 - t) * t * t * secondControl + t * t * t;
  }

  static sampleBezierAxisDerivative(t, firstControl, secondControl) {
    return 3 * (1 - t) * (1 - t) * firstControl + 6 * (1 - t) * t * (secondControl - firstControl) + 3 * t * t * (1 - secondControl);
  }

  static evaluateCubicBezier(x, { p1, p2 }) {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    if (Math.abs(x1 - y1) < BEZIER_SOLVER.linearTolerance && Math.abs(x2 - y2) < BEZIER_SOLVER.linearTolerance) return x;

    const t = ColorMath.clamp(this.solveBezierParameter(x, x1, x2), 0, 1);
    return ColorMath.clamp(this.sampleBezierAxis(t, y1, y2), 0, 1);
  }

  static solveBezierParameter(x, x1, x2) {
    let t = x;
    for (let iteration = 0; iteration < BEZIER_SOLVER.iterations; iteration++) {
      const error = this.sampleBezierAxis(t, x1, x2) - x;
      if (Math.abs(error) < BEZIER_SOLVER.epsilon) break;
      const slope = this.sampleBezierAxisDerivative(t, x1, x2);
      if (Math.abs(slope) < BEZIER_SOLVER.epsilon) break;
      t -= error / slope;
    }
    return t;
  }

  static applyMidpoint(localT, midpoint = MIDPOINT_LIMITS.neutral) {
    const clampedMidpoint = ColorMath.clamp(midpoint, MIDPOINT_LIMITS.min, MIDPOINT_LIMITS.max);
    if (Math.abs(clampedMidpoint - MIDPOINT_LIMITS.neutral) < MIDPOINT_LIMITS.neutralTolerance) return localT;
    if (localT <= 0) return 0;
    if (localT >= 1) return 1;
    const exponent = Math.log(MIDPOINT_LIMITS.neutral) / Math.log(clampedMidpoint);
    return Math.pow(localT, exponent);
  }

  static countStepBands(easing) {
    return Math.max(STEP_BANDS.min, easing?.steps || STEP_BANDS.default);
  }

  static quantizeToSteps(t, easing) {
    const bandCount = this.countStepBands(easing);
    return Math.min(1, Math.floor(t * bandCount) / (bandCount - 1));
  }

  static evaluateTransition(localT, midpoint, easing) {
    const t = this.applyMidpoint(localT, midpoint);
    if (!easing) return t;
    if (easing.mode === 'steps') return this.quantizeToSteps(t, easing);
    return this.evaluateCubicBezier(t, {
      p1: easing.p1 || DEFAULT_EASING_CURVE.p1,
      p2: easing.p2 || DEFAULT_EASING_CURVE.p2
    });
  }
}
