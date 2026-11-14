// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { ColorMath } from '../color/color-math.js';
import { DEFAULT_BOUNDARY_SHAPE, OVERLAY_REACH_RATIO, PERCENT, QUARTER_TURN_DEG } from '../config/constants.js';
import { CONTROL_DEFAULTS } from '../data/field-options.js';
import { computeBoxHalfHeight, computeBoxHalfWidth } from '../geometry/boundary-geometry.js';
import { cssAngleToRadians, radiansToDegrees, roundTo, wrapDegrees } from '../utils/angle-math.js';

const STAGE_HANDLE_LIMITS = { min: 4, max: 96 };
const REACH_DRAG_LIMITS = { min: 12, max: 135 };
const ASPECT_DRAG = { minDistance: 3, minAspect: 0.4, maxAspect: 3.4 };
const ANGLE_HANDLE = { maxDistance: 28, reachRatio: 0.82 };

export function toStagePercent(event, stageRect, { min, max }) {
  return {
    x: ColorMath.clamp(((event.clientX - stageRect.left) / stageRect.width) * PERCENT, min, max),
    y: ColorMath.clamp(((event.clientY - stageRect.top) / stageRect.height) * PERCENT, min, max)
  };
}

export function computeCanvasDragPatch(dragType, control, pointer, globals) {
  const centerX = control.x ?? CONTROL_DEFAULTS.x;
  const centerY = control.y ?? CONTROL_DEFAULTS.y;
  const distanceFromCenter = Math.hypot(pointer.x - centerX, pointer.y - centerY);

  switch (dragType) {
    case 'position':
      return { x: Math.round(pointer.x), y: Math.round(pointer.y) };
    case 'angle': {
      const pointerAngle = radiansToDegrees(Math.atan2(pointer.y - centerY, pointer.x - centerX));
      return { angle: wrapDegrees(Math.round(pointerAngle + QUARTER_TURN_DEG)) };
    }
    case 'radius':
      return { radius: ColorMath.clamp(Math.round(distanceFromCenter / OVERLAY_REACH_RATIO), REACH_DRAG_LIMITS.min, REACH_DRAG_LIMITS.max) };
    case 'aspect': {
      const reachScale = Number(globals?.reachScale ?? 1);
      const halfWidth = computeBoxHalfWidth((control.radius ?? CONTROL_DEFAULTS.radius) * reachScale);
      const distance = Math.max(ASPECT_DRAG.minDistance, distanceFromCenter);
      return { aspectRatio: ColorMath.clamp(roundTo(halfWidth / distance, 2), ASPECT_DRAG.minAspect, ASPECT_DRAG.maxAspect) };
    }
    default:
      return null;
  }
}

export function computeHandlePositions(control, reachScale) {
  const centerX = control.x ?? CONTROL_DEFAULTS.x;
  const centerY = control.y ?? CONTROL_DEFAULTS.y;
  const scaledRadius = (control.radius ?? CONTROL_DEFAULTS.radius) * reachScale;
  const handleReach = (control.boundaryShape || DEFAULT_BOUNDARY_SHAPE) === 'rect-box'
    ? computeBoxHalfWidth(scaledRadius)
    : scaledRadius * OVERLAY_REACH_RATIO;
  const axisRad = cssAngleToRadians(control.angle ?? CONTROL_DEFAULTS.angle);
  const perpendicularRad = axisRad + Math.PI / 2;
  const angleHandleDistance = Math.min(ANGLE_HANDLE.maxDistance, handleReach * ANGLE_HANDLE.reachRatio);
  const aspectHandleDistance = computeBoxHalfHeight(handleReach, control.aspectRatio ?? CONTROL_DEFAULTS.aspectRatio);
  const clampToStage = (value) => ColorMath.clamp(value, STAGE_HANDLE_LIMITS.min, STAGE_HANDLE_LIMITS.max);

  return {
    angleHandle: {
      x: clampToStage(centerX + Math.cos(axisRad) * angleHandleDistance),
      y: clampToStage(centerY + Math.sin(axisRad) * angleHandleDistance)
    },
    reachHandle: {
      x: clampToStage(centerX + Math.cos(axisRad) * handleReach),
      y: clampToStage(centerY + Math.sin(axisRad) * handleReach)
    },
    aspectHandle: {
      x: clampToStage(centerX + Math.cos(perpendicularRad) * aspectHandleDistance),
      y: clampToStage(centerY + Math.sin(perpendicularRad) * aspectHandleDistance)
    }
  };
}
