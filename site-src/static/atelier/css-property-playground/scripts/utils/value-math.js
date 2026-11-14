// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { HALF_TURN_DEGREES } from '../config/constants.js';

const HEX_RADIX = 16;

export function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

export function removeAt(list, index) {
  const remaining = cloneDeep(list);
  remaining.splice(index, 1);
  return remaining;
}

export function clampToRange(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function convertToPercentOfRange(value, min, max) {
  return ((value - min) / (max - min)) * 100;
}

export function convertRadiansToDegrees(radians) {
  return (radians * HALF_TURN_DEGREES) / Math.PI;
}

export function convertHexToRgba(hex, alpha, fallbackColor) {
  const hexDigits = (hex || fallbackColor.hex).replace('#', '');
  const red = parseInt(hexDigits.substring(0, 2), HEX_RADIX) || fallbackColor.red;
  const green = parseInt(hexDigits.substring(2, 4), HEX_RADIX) || fallbackColor.green;
  const blue = parseInt(hexDigits.substring(4, 6), HEX_RADIX) || fallbackColor.blue;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
