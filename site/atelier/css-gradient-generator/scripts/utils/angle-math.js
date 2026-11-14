// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { FULL_TURN_DEG, QUARTER_TURN_DEG } from '../config/constants.js';

export function roundTo(value, decimals) {
  return Number(value.toFixed(decimals));
}

export function degreesToRadians(angleDeg) {
  return (angleDeg * Math.PI) / 180;
}

export function radiansToDegrees(angleRad) {
  return (angleRad * 180) / Math.PI;
}

export function cssAngleToRadians(angleDeg) {
  return degreesToRadians(angleDeg - QUARTER_TURN_DEG);
}

export function wrapDegrees(angleDeg) {
  return ((angleDeg % FULL_TURN_DEG) + FULL_TURN_DEG) % FULL_TURN_DEG;
}
