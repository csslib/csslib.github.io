// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { BEZIER_GRAPH, DRAG_SENSITIVITY, HALF_TURN_DEGREES, PERCENT_RANGE, SHADOW_OFFSET_RANGE_PX } from '../config/constants.js';
import { clampToRange, cloneDeep, convertRadiansToDegrees } from '../utils/value-math.js';

const BEZIER_X_RANGE = { min: 0, max: 1 };
const BEZIER_Y_RANGE = { min: -0.4, max: 1.5 };
const BEZIER_DECIMAL_PLACES = 2;
const BOX_SPACING_FALLBACK_RANGE_PX = { min: 0, max: 80 };
const DIAL_ZERO_OFFSET_DEGREES = 90;
const FULL_TURN_DEGREES = 360;
const DIAL_CENTER_PERCENT = 50;

export function computeDialHandlePosition(angleDegrees, radiusPercent) {
  const radians = ((angleDegrees - DIAL_ZERO_OFFSET_DEGREES) * Math.PI) / HALF_TURN_DEGREES;
  return {
    left: DIAL_CENTER_PERCENT + radiusPercent * Math.cos(radians),
    top: DIAL_CENTER_PERCENT + radiusPercent * Math.sin(radians)
  };
}

export function mapToBezierGraph(progressX, progressY) {
  return {
    x: BEZIER_GRAPH.left + progressX * BEZIER_GRAPH.width,
    y: BEZIER_GRAPH.bottom - progressY * BEZIER_GRAPH.height
  };
}

export function insertVertexAtNearestEdge(points, newVertex) {
  const nextPoints = cloneDeep(points);
  let insertIndex = nextPoints.length;
  let nearestDistance = Infinity;
  for (let i = 0; i < nextPoints.length; i++) {
    const edgeStart = nextPoints[i];
    const edgeEnd = nextPoints[(i + 1) % nextPoints.length];
    const edgeMidX = (edgeStart.x + edgeEnd.x) / 2;
    const edgeMidY = (edgeStart.y + edgeEnd.y) / 2;
    const distance = Math.hypot(newVertex.x - edgeMidX, newVertex.y - edgeMidY);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      insertIndex = i + 1;
    }
  }
  nextPoints.splice(insertIndex, 0, newVertex);
  return nextPoints;
}

export function computeDragValueChanges(drag, event, context) {
  const pointer = {
    clientX: event.clientX,
    clientY: event.clientY,
    deltaX: event.clientX - drag.startX,
    deltaY: event.clientY - drag.startY
  };
  switch (drag.type) {
    case 'xy-pad':
      return computeXYPadChanges(drag, pointer);
    case 'angle-dial':
      return computeAngleDialChanges(drag, pointer);
    case 'corner-handle':
      return computeCornerChanges(drag, pointer, context.currentValues);
    case 'dynamic-polygon-vertex':
      return computeVertexChanges(drag, pointer);
    case 'multi-shadow-layer':
      return computeShadowLayerChanges(drag, pointer);
    case 'bezier-point':
      return computeBezierPointChanges(drag, pointer);
    case 'box-spacing':
      return computeBoxSpacingChanges(drag, pointer, context.controls);
    default:
      return null;
  }
}

function computeXYPadChanges({ options: pad, initialValues }, pointer) {
  const xSpan = pad.xMax - pad.xMin;
  const ySpan = pad.yMax - pad.yMin;
  const nextX = Math.round(clampToRange(initialValues[pad.x] + (pointer.deltaX / DRAG_SENSITIVITY.xyPadTravelPx) * xSpan, pad.xMin, pad.xMax));
  const nextY = Math.round(clampToRange(initialValues[pad.y] + (pointer.deltaY / DRAG_SENSITIVITY.xyPadTravelPx) * ySpan, pad.yMin, pad.yMax));
  return { [pad.x]: nextX, [pad.y]: nextY };
}

function computeAngleDialChanges({ options, stageRect }, pointer) {
  const centerX = stageRect.left + stageRect.width / 2;
  const centerY = stageRect.top + stageRect.height / 2;
  const radians = Math.atan2(pointer.clientY - centerY, pointer.clientX - centerX);
  const angleDegrees = Math.round(convertRadiansToDegrees(radians) + DIAL_ZERO_OFFSET_DEGREES);
  return { [options.angleKey]: wrapDialDegrees(angleDegrees, options.min) };
}

function wrapDialDegrees(angleDegrees, minDegrees) {
  if (minDegrees === 0 && angleDegrees < 0) return angleDegrees + FULL_TURN_DEGREES;
  if (minDegrees < 0 && angleDegrees > HALF_TURN_DEGREES) return angleDegrees - FULL_TURN_DEGREES;
  return angleDegrees;
}

function computeCornerChanges({ options, initialValues }, pointer, currentValues) {
  const { xKey, yKey, dirX, dirY } = options;
  const dragPercent = (startValue, direction, deltaPx) =>
    Math.round(clampToRange(startValue + direction * (deltaPx / DRAG_SENSITIVITY.cornerPxPerPercent), PERCENT_RANGE.min, PERCENT_RANGE.max));
  const valueChanges = { [xKey]: dragPercent(initialValues[xKey], dirX, pointer.deltaX) };
  if (!currentValues.useSlash || !yKey) return valueChanges;
  valueChanges[yKey] = dragPercent(initialValues[yKey], dirY, pointer.deltaY);
  return valueChanges;
}

function computeVertexChanges({ options, initialValues }, pointer) {
  const points = cloneDeep(initialValues.points || []);
  const vertex = points[options.index];
  if (!vertex) return null;
  vertex.x = Math.round(clampToRange(vertex.x + (pointer.deltaX / DRAG_SENSITIVITY.vertexPxPerPercent), PERCENT_RANGE.min, PERCENT_RANGE.max));
  vertex.y = Math.round(clampToRange(vertex.y + (pointer.deltaY / DRAG_SENSITIVITY.vertexPxPerPercent), PERCENT_RANGE.min, PERCENT_RANGE.max));
  return { points };
}

function computeShadowLayerChanges({ options, initialValues }, pointer) {
  const layers = cloneDeep(initialValues.layers || []);
  const layer = layers[options.layerIndex];
  if (!layer) return null;
  layer.x = Math.round(clampToRange(layer.x + pointer.deltaX / DRAG_SENSITIVITY.shadowPxPerOffsetPx, SHADOW_OFFSET_RANGE_PX.min, SHADOW_OFFSET_RANGE_PX.max));
  layer.y = Math.round(clampToRange(layer.y + pointer.deltaY / DRAG_SENSITIVITY.shadowPxPerOffsetPx, SHADOW_OFFSET_RANGE_PX.min, SHADOW_OFFSET_RANGE_PX.max));
  return { layers };
}

function computeBezierPointChanges({ options, initialValues }, pointer) {
  const { xKey, yKey } = options;
  const nextX = clampToRange(initialValues[xKey] + pointer.deltaX / DRAG_SENSITIVITY.bezierTravelPx, BEZIER_X_RANGE.min, BEZIER_X_RANGE.max);
  const nextY = clampToRange(initialValues[yKey] - pointer.deltaY / DRAG_SENSITIVITY.bezierTravelPx, BEZIER_Y_RANGE.min, BEZIER_Y_RANGE.max);
  return {
    [xKey]: Number(nextX.toFixed(BEZIER_DECIMAL_PLACES)),
    [yKey]: Number(nextY.toFixed(BEZIER_DECIMAL_PLACES))
  };
}

function computeBoxSpacingChanges({ options, initialValues }, pointer, controls) {
  const { key, axis, factor } = options;
  const deltaPx = (axis === 'y' ? pointer.deltaY : pointer.deltaX) * factor;
  const control = controls.find(candidate => candidate.key === key);
  const min = control ? control.min : BOX_SPACING_FALLBACK_RANGE_PX.min;
  const max = control ? control.max : BOX_SPACING_FALLBACK_RANGE_PX.max;
  return { [key]: Math.round(clampToRange(initialValues[key] + deltaPx, min, max)) };
}
