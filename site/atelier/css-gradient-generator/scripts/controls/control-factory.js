// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { ColorMath } from '../color/color-math.js';
import { FULL_TURN_DEG, HALF_TURN_DEG } from '../config/constants.js';
import { HARMONY } from '../data/field-options.js';

const NEW_CONTROL_PALETTE = ['#6366F1', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#A855F7', '#F43F5E'];
const NEW_CONTROL_SECONDARY_PALETTE_OFFSET = 2;
const NEW_CONTROL_ANGLE_STEP_DEG = 65;
const DUPLICATE_PLACEMENT = { offsetPercent: 10, minPercent: 5, maxPercent: 95 };

export function createControlId() {
  return 'ctrl-' + Date.now();
}

export function createControl({ index, x, y, boundaryShape }) {
  return {
    id: createControlId(),
    name: `Control Point ${index + 1}`,
    visible: true,
    x: Math.round(x),
    y: Math.round(y),
    angle: Math.round((index * NEW_CONTROL_ANGLE_STEP_DEG) % FULL_TURN_DEG),
    radius: 66,
    hardness: 12,
    aspectRatio: 1.8,
    boxCrispness: 75,
    polygonSides: 5,
    polygonSharpness: 78,
    innerRadius: 38,
    sectorSpread: 140,
    boundaryShape,
    interactionMode: 'harmonic-bridge',
    color: NEW_CONTROL_PALETTE[index % NEW_CONTROL_PALETTE.length],
    alpha: 0.92,
    useSecondaryColor: true,
    secondaryColor: NEW_CONTROL_PALETTE[(index + NEW_CONTROL_SECONDARY_PALETTE_OFFSET) % NEW_CONTROL_PALETTE.length],
    secondaryAlpha: 0.58,
    midpoint: 0.5,
    weight: 1,
    easing: { mode: 'smoothstep', p1: [0.65, 0.0], p2: [0.35, 1.0], samples: 10, steps: 5 }
  };
}

export function offsetDuplicateCoordinate(coordinate) {
  return ColorMath.clamp(coordinate + DUPLICATE_PLACEMENT.offsetPercent, DUPLICATE_PLACEMENT.minPercent, DUPLICATE_PLACEMENT.maxPercent);
}

export function computeHarmonyOffset(harmonyType, index) {
  const rowIndex = Math.floor(index / 3);
  if (harmonyType === 'analogous') {
    return { hueStepDeg: index * HARMONY.analogousStepDeg, lightnessShift: (index % 2 === 0 ? 1 : -1) * HARMONY.lightnessSwing };
  }
  if (harmonyType === 'complementary') {
    const driftDeg = index * HARMONY.complementaryDriftDeg;
    return { hueStepDeg: index % 2 === 0 ? driftDeg : HALF_TURN_DEG + driftDeg, lightnessShift: (index % 3 - 1) * HARMONY.lightnessSwing };
  }
  if (harmonyType === 'triadic') {
    return { hueStepDeg: (index % 3) * HARMONY.triadicStepDeg + rowIndex * HARMONY.triadicRowDriftDeg, lightnessShift: 0 };
  }
  if (harmonyType === 'split') {
    return { hueStepDeg: HARMONY.splitComplementAnglesDeg[index % 3] + rowIndex * HARMONY.splitRowDriftDeg, lightnessShift: 0 };
  }
  return { hueStepDeg: index * HARMONY.goldenStepDeg, lightnessShift: 0 };
}

export function buildHarmonyColors({ hue, C, L }, { hueStepDeg, lightnessShift }) {
  const primaryRange = HARMONY.primaryLightnessRange;
  const secondaryRange = HARMONY.secondaryLightnessRange;
  const chromaRange = HARMONY.secondaryChromaRange;
  return {
    color: ColorMath.oklchToHex({
      L: ColorMath.clamp(L + lightnessShift, primaryRange.min, primaryRange.max),
      C,
      h: (hue + hueStepDeg + FULL_TURN_DEG) % FULL_TURN_DEG
    }),
    secondaryColor: ColorMath.oklchToHex({
      L: ColorMath.clamp(L + lightnessShift + HARMONY.secondaryLightnessLift, secondaryRange.min, secondaryRange.max),
      C: ColorMath.clamp(C * HARMONY.secondaryChromaRatio, chromaRange.min, chromaRange.max),
      h: (hue + hueStepDeg + HARMONY.secondaryHueOffsetDeg + FULL_TURN_DEG) % FULL_TURN_DEG
    })
  };
}
