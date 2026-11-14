// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { DEFAULT_COLOR_SPACE, POLYGON_SIDES } from '../config/constants.js';
import { BOUNDARY_SHAPES, BOX, INTERACTION_MODES } from '../data/field-options.js';
import { cssAngleToRadians } from '../utils/angle-math.js';

const DEFAULT_INTERACTION_MODE = 'smooth-oklch';

export function resolveColorSpace(globals, isNaiveSrgb) {
  return isNaiveSrgb ? 'srgb' : (globals.colorSpace || DEFAULT_COLOR_SPACE);
}

export function resolveRimHex(control) {
  return control.useSecondaryColor ? (control.secondaryColor || control.color) : control.color;
}

export function resolveInteractionModeId(control) {
  return control.interactionMode || DEFAULT_INTERACTION_MODE;
}

export function findInteractionMode(modeId) {
  return INTERACTION_MODES.find(mode => mode.id === modeId);
}

export function findBoundaryShape(shapeId) {
  return BOUNDARY_SHAPES.find(shape => shape.id === shapeId);
}

export function clampPolygonSides(sides) {
  return Math.max(POLYGON_SIDES.min, Math.min(POLYGON_SIDES.max, Math.round(sides || POLYGON_SIDES.default)));
}

export function computePolygonVertices({ center, radius, sides, angleDeg = 0 }) {
  const sideCount = clampPolygonSides(sides);
  const startRad = cssAngleToRadians(angleDeg);
  const vertices = [];
  for (let vertexIndex = 0; vertexIndex < sideCount; vertexIndex++) {
    const theta = startRad + (vertexIndex * 2 * Math.PI) / sideCount;
    vertices.push({
      x: center.x + Math.cos(theta) * radius,
      y: center.y + Math.sin(theta) * radius
    });
  }
  return vertices;
}

export function computeRectangleOutline({ center, halfWidth, halfHeight, angleDeg = 0 }) {
  const axisRad = cssAngleToRadians(angleDeg);
  const cos = Math.cos(axisRad);
  const sin = Math.sin(axisRad);
  const toStagePoint = (dx, dy) => ({
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  });
  const edgeHalfWidth = halfWidth * BOX.edgeMidpointRatio;
  const edgeHalfHeight = halfHeight * BOX.edgeMidpointRatio;
  return {
    corners: [
      toStagePoint(-halfWidth, -halfHeight),
      toStagePoint(halfWidth, -halfHeight),
      toStagePoint(halfWidth, halfHeight),
      toStagePoint(-halfWidth, halfHeight)
    ],
    edges: [
      toStagePoint(-edgeHalfWidth, 0),
      toStagePoint(edgeHalfWidth, 0),
      toStagePoint(0, -edgeHalfHeight),
      toStagePoint(0, edgeHalfHeight)
    ]
  };
}

export function computeBoxHalfWidth(reach) {
  return reach * BOX.halfWidthRatio;
}

export function computeBoxHalfHeight(halfWidth, aspect) {
  return halfWidth / Math.max(BOX.minHalfHeightAspect, aspect);
}

export function formatSvgPoints(points) {
  return points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
}
