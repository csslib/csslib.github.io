// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { svg, nothing } from 'lit';
import { DEFAULT_BOUNDARY_SHAPE, PERCENT, POLYGON_SIDES, QUARTER_TURN_DEG } from '../config/constants.js';
import { CONTROL_DEFAULTS } from '../data/field-options.js';
import { computeBoxHalfHeight, computeBoxHalfWidth, computePolygonVertices, computeRectangleOutline, formatSvgPoints } from '../geometry/boundary-geometry.js';

const BEAM_OUTLINE = { maxMajorStretch: 1.8, majorAspectRatio: 0.75, minorAspectRatio: 0.65 };

export function renderShapeOutline(control, outline) {
  switch (control.boundaryShape || DEFAULT_BOUNDARY_SHAPE) {
    case 'rect-box': return renderBoxOutline(outline);
    case 'polygon': return renderPolygonOutline(control, outline);
    case 'ellipse-beam': return renderBeamOutline(outline);
    case 'ring-torus': return renderRingOutline(control, outline);
    default: return renderCircleOutline(outline);
  }
}

function renderBoxOutline({ centerX, centerY, scaledRadius, angle, aspect, stroke, strokeWidth, isSelected }) {
  const halfWidth = computeBoxHalfWidth(scaledRadius);
  const { corners } = computeRectangleOutline({
    center: { x: centerX, y: centerY },
    halfWidth,
    halfHeight: computeBoxHalfHeight(halfWidth, aspect),
    angleDeg: angle
  });
  return svg`
                  <polygon
                    points=${formatSvgPoints(corners)}
                    fill="none"
                    stroke=${stroke}
                    stroke-width=${strokeWidth}
                    stroke-dasharray="1.5 1.1"
                  />
                  ${isSelected ? corners.map(corner => svg`
                    <rect
                      x=${corner.x - 0.8}
                      y=${corner.y - 0.8}
                      width="1.6"
                      height="1.6"
                      fill="#FFFFFF"
                      stroke="#c0249c"
                      stroke-width="0.3"
                    />
                  `) : nothing}
                `;
}

function renderPolygonOutline(control, { centerX, centerY, reach, angle, stroke, strokeWidth, isSelected }) {
  const vertices = computePolygonVertices({
    center: { x: centerX, y: centerY },
    radius: reach,
    sides: control.polygonSides || POLYGON_SIDES.default,
    angleDeg: angle
  });
  return svg`
                  <polygon
                    points=${formatSvgPoints(vertices)}
                    fill="none"
                    stroke=${stroke}
                    stroke-width=${strokeWidth}
                    stroke-dasharray="1.5 1.1"
                  />
                  ${isSelected ? vertices.map(vertex => svg`
                    <circle
                      cx=${vertex.x}
                      cy=${vertex.y}
                      r="0.95"
                      fill="#FFFFFF"
                      stroke="#c0249c"
                      stroke-width="0.35"
                    />
                  `) : nothing}
                `;
}

function renderBeamOutline({ centerX, centerY, reach, angle, aspect, stroke, strokeWidth }) {
  return svg`
                  <ellipse
                    cx=${centerX} cy=${centerY}
                    rx=${reach * Math.min(BEAM_OUTLINE.maxMajorStretch, aspect * BEAM_OUTLINE.majorAspectRatio)}
                    ry=${reach / Math.max(1, aspect * BEAM_OUTLINE.minorAspectRatio)}
                    transform="rotate(${angle - QUARTER_TURN_DEG} ${centerX} ${centerY})"
                    fill="none"
                    stroke=${stroke}
                    stroke-width=${strokeWidth}
                    stroke-dasharray="1.5 1.2"
                  />
                `;
}

function renderRingOutline(control, { centerX, centerY, reach, stroke, strokeWidth }) {
  return svg`
                  <circle
                    cx=${centerX} cy=${centerY} r=${reach}
                    fill="none" stroke=${stroke} stroke-width=${strokeWidth} stroke-dasharray="1.5 1.2"
                  />
                  <circle
                    cx=${centerX} cy=${centerY} r=${reach * ((control.innerRadius ?? CONTROL_DEFAULTS.innerRadius) / PERCENT)}
                    fill="none" stroke="rgba(220, 67, 187, 0.85)" stroke-width=${strokeWidth} stroke-dasharray="0.8 0.8"
                  />
                `;
}

function renderCircleOutline({ centerX, centerY, reach, stroke, strokeWidth }) {
  return svg`
                  <circle
                    cx=${centerX} cy=${centerY} r=${reach}
                    fill="none" stroke=${stroke} stroke-width=${strokeWidth} stroke-dasharray="1.5 1.2"
                  />
                `;
}
