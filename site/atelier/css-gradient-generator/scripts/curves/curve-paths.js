// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { ColorMath } from '../color/color-math.js';
import { GradientFieldCompiler } from '../compiler/gradient-field-compiler.js';
import { BEZIER_PLOT, DEFAULT_COLOR_SPACE, DEFAULT_HUE_MODE, FIELD_PROFILE, PERCENT } from '../config/constants.js';
import { resolveRimHex } from '../geometry/boundary-geometry.js';

const BEZIER_POINTER_INSET_PX = 16;
const FALLOFF_TRACK_SAMPLE_COUNT = 16;
const BRIDGE_PREVIEW_MIX = 0.5;

export function toNormalizedCurvePoint(event, padRect) {
  const usableWidth = padRect.width - BEZIER_POINTER_INSET_PX * 2;
  const usableHeight = padRect.height - BEZIER_POINTER_INSET_PX * 2;
  return {
    x: ColorMath.clamp((event.clientX - padRect.left - BEZIER_POINTER_INSET_PX) / usableWidth, 0, 1),
    y: ColorMath.clamp(1 - (event.clientY - padRect.top - BEZIER_POINTER_INSET_PX) / usableHeight, 0, 1)
  };
}

export function toCurvePadX(value) {
  return BEZIER_PLOT.originX + value * BEZIER_PLOT.width;
}

export function toCurvePadY(value) {
  return BEZIER_PLOT.originY + (1 - value) * BEZIER_PLOT.height;
}

export function buildSteppedCurvePath(bandCount) {
  const segments = [`M ${toCurvePadX(0)} ${toCurvePadY(0)}`];
  for (let band = 0; band < bandCount; band++) {
    const level = band / (bandCount - 1);
    segments.push(`L ${toCurvePadX(band / bandCount)} ${toCurvePadY(level)}`);
    segments.push(`L ${toCurvePadX((band + 1) / bandCount)} ${toCurvePadY(level)}`);
  }
  return segments.join(' ');
}

export function buildBezierCurvePath([x1, y1], [x2, y2]) {
  return `M ${toCurvePadX(0)} ${toCurvePadY(0)} C ${toCurvePadX(x1)} ${toCurvePadY(y1)}, ${toCurvePadX(x2)} ${toCurvePadY(y2)}, ${toCurvePadX(1)} ${toCurvePadY(1)}`;
}

export function buildFieldProfilePoints(control, sceneContext) {
  if (!control) return { lightnessPoints: '', chromaPoints: '' };
  const { sampleCount, width, height, verticalPadding, maxChroma } = FIELD_PROFILE;
  const plotHeight = height - verticalPadding * 2;
  const lightnessPoints = [];
  const chromaPoints = [];
  for (let i = 0; i <= sampleCount; i++) {
    const u = i / sampleCount;
    const sample = GradientFieldCompiler.sampleControlAt(control, u, sceneContext);
    const x = u * width;
    const lightnessY = height - sample.oklch.L * plotHeight - verticalPadding;
    const chromaY = height - Math.min(1, sample.oklch.C / maxChroma) * plotHeight - verticalPadding;
    lightnessPoints.push(`${x.toFixed(1)},${lightnessY.toFixed(1)}`);
    chromaPoints.push(`${x.toFixed(1)},${chromaY.toFixed(1)}`);
  }
  return { lightnessPoints: lightnessPoints.join(' '), chromaPoints: chromaPoints.join(' ') };
}

export function buildFalloffTrackBackground(control, sceneContext) {
  const stops = [];
  for (let i = 0; i <= FALLOFF_TRACK_SAMPLE_COUNT; i++) {
    const u = i / FALLOFF_TRACK_SAMPLE_COUNT;
    const sample = GradientFieldCompiler.sampleControlAt(control, u, sceneContext);
    stops.push(`${sample.css} ${(u * PERCENT).toFixed(1)}%`);
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

export function buildBridgePreviewBackground(control, neighbor, globals) {
  const coreHex = ColorMath.applyGlobalGrading(control.color, globals);
  const rimHex = ColorMath.applyGlobalGrading(resolveRimHex(control), globals);
  const neighborHex = ColorMath.applyGlobalGrading(neighbor.color, globals);
  const bridge = ColorMath.mixColors(rimHex, neighborHex, BRIDGE_PREVIEW_MIX, {
    colorSpace: globals?.colorSpace || DEFAULT_COLOR_SPACE,
    hueMode: globals?.hueMode || DEFAULT_HUE_MODE
  });
  return `linear-gradient(90deg, ${coreHex} 0%, ${rimHex} 35%, ${bridge.hex} 55%, ${neighborHex} 100%)`;
}
