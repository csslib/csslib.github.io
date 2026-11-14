// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { ColorMath } from '../color/color-math.js';
import { FULL_TURN_DEG, HALF_TURN_DEG, STAGE_CENTER_PERCENT } from '../config/constants.js';
import { radiansToDegrees } from '../utils/angle-math.js';

const RING_LAYOUT = { radiusPercent: 28 };
const GRID_LAYOUT = { leftPercent: 22, widthPercent: 56, topPercent: 24, heightPercent: 52 };
const WAVE_LAYOUT = { leftPercent: 16, widthPercent: 68, amplitudePercent: 24, baseAngleDeg: 45, angleSwingDeg: 45 };
const SPIRAL_LAYOUT = { goldenAngleRad: 2.39996, innerRadiusPercent: 10, spreadPercent: 28, minPercent: 10, maxPercent: 90 };
const SCATTER_LAYOUT = { minPercent: 15, rangePercent: 70 };

export function layoutRing(index, count) {
  const theta = (index / count) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.round(STAGE_CENTER_PERCENT + Math.cos(theta) * RING_LAYOUT.radiusPercent),
    y: Math.round(STAGE_CENTER_PERCENT + Math.sin(theta) * RING_LAYOUT.radiusPercent),
    angle: Math.round((radiansToDegrees(theta) + HALF_TURN_DEG) % FULL_TURN_DEG)
  };
}

export function layoutGrid(index, count, control) {
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    x: Math.round(columns === 1 ? STAGE_CENTER_PERCENT : GRID_LAYOUT.leftPercent + (column / (columns - 1)) * GRID_LAYOUT.widthPercent),
    y: Math.round(rows === 1 ? STAGE_CENTER_PERCENT : GRID_LAYOUT.topPercent + (row / (rows - 1)) * GRID_LAYOUT.heightPercent),
    angle: control.angle
  };
}

export function layoutWave(index, count) {
  const t = count === 1 ? 0.5 : index / (count - 1);
  return {
    x: Math.round(WAVE_LAYOUT.leftPercent + t * WAVE_LAYOUT.widthPercent),
    y: Math.round(STAGE_CENTER_PERCENT + Math.sin(t * Math.PI * 2) * WAVE_LAYOUT.amplitudePercent),
    angle: Math.round(WAVE_LAYOUT.baseAngleDeg + Math.cos(t * Math.PI * 2) * WAVE_LAYOUT.angleSwingDeg)
  };
}

export function layoutSpiral(index, count) {
  const goldenAngle = index * SPIRAL_LAYOUT.goldenAngleRad;
  const distance = SPIRAL_LAYOUT.innerRadiusPercent + Math.sqrt(index + 0.5) * (SPIRAL_LAYOUT.spreadPercent / Math.sqrt(count));
  return {
    x: ColorMath.clamp(Math.round(STAGE_CENTER_PERCENT + Math.cos(goldenAngle) * distance), SPIRAL_LAYOUT.minPercent, SPIRAL_LAYOUT.maxPercent),
    y: ColorMath.clamp(Math.round(STAGE_CENTER_PERCENT + Math.sin(goldenAngle) * distance), SPIRAL_LAYOUT.minPercent, SPIRAL_LAYOUT.maxPercent),
    angle: Math.round(radiansToDegrees(goldenAngle) % FULL_TURN_DEG)
  };
}

export function layoutScatter() {
  return {
    x: Math.round(SCATTER_LAYOUT.minPercent + Math.random() * SCATTER_LAYOUT.rangePercent),
    y: Math.round(SCATTER_LAYOUT.minPercent + Math.random() * SCATTER_LAYOUT.rangePercent),
    angle: Math.round(Math.random() * FULL_TURN_DEG)
  };
}
