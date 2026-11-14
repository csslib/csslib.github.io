// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { ColorMath } from '../color/color-math.js';
import { wrapDegrees } from '../utils/angle-math.js';

export const CONTROL_DEFAULTS = {
  x: 50,
  y: 50,
  angle: 135,
  radius: 65,
  hardness: 12,
  midpoint: 0.5,
  alpha: 0.95,
  secondaryAlpha: 0.65,
  weight: 1,
  aspectRatio: 1.8,
  boxCrispness: 75,
  polygonSharpness: 78,
  innerRadius: 38,
  sectorSpread: 140
};

export const BOUNDARY_SHAPES = [
  { id: 'circle', label: 'Radial Circle', icon: 'ph-circle-dashed', description: 'Uniform isotropic field around (X, Y)' },
  { id: 'rect-box', label: 'Rectangle / Box', icon: 'ph-rectangle', description: 'Rotatable rectangular region with width, height & corner definition' },
  { id: 'polygon', label: 'Polygon (3–8 Sides)', icon: 'ph-polygon', description: 'Regular N-sided polygonal field (Triangle, Diamond, Pentagon, Hexagon, Octagon)' },
  { id: 'ellipse-beam', label: 'Directional Beam', icon: 'ph-oval', description: 'Stretched elliptical spotlight oriented along Angle' },
  { id: 'ring-torus', label: 'Hollow Ring Halo', icon: 'ph-target', description: 'Toroidal halo peaking between inner & outer radius' },
  { id: 'conic-wedge', label: 'Conic Sector', icon: 'ph-chart-pie-slice', description: 'Angular fan sweeping outward from (X, Y)' },
  { id: 'linear-plane', label: 'Linear Wavefront', icon: 'ph-wave-sine', description: 'Directional linear ramp anchored at (X, Y)' }
];

export const INTERACTION_MODES = [
  { id: 'smooth-oklch', label: 'Perceptual Feather', blendMode: 'normal', badge: 'OKLCH Normal', description: 'Seamless perceptual transition into neighboring controls' },
  { id: 'harmonic-bridge', label: 'Chroma Bridge (Anti-Mud)', blendMode: 'normal', badge: 'Chroma Boost', description: 'Injects high-chroma OKLCH bridge at boundary to prevent grey zones' },
  { id: 'screen-bloom', label: 'Luminous Bloom', blendMode: 'screen', badge: 'Screen', description: 'Additive light energy where control boundaries intersect' },
  { id: 'multiply-glaze', label: 'Pigment Glaze', blendMode: 'multiply', badge: 'Multiply', description: 'Deepens saturation and shadow at overlapping boundaries' },
  { id: 'velvet-overlay', label: 'Velvet Contrast', blendMode: 'soft-light', badge: 'Soft-Light', description: 'Organic contrast boost along boundary intersections' },
  { id: 'dodge-caustic', label: 'Caustic Specular', blendMode: 'color-dodge', badge: 'Color-Dodge', description: 'High-energy electric highlight where fields collide' },
  { id: 'terrace-contour', label: 'Crisp Voronoi Edge', blendMode: 'normal', badge: 'Hard Edge', description: 'Steep S-curve boundary creating distinct graphic cells' },
  { id: 'ripple-interference', label: 'Wave Interference', blendMode: 'screen', badge: 'Harmonic Ring', description: 'Oscillatory outer ring that ripples into adjacent fields' }
];

export const BOX = {
  minAspect: 0.4,
  maxAspect: 3.5,
  minCrispness: 0.15,
  maxCrispness: 1.0,
  halfWidthRatio: 0.36,
  minHalfHeightAspect: 0.45,
  outlineInset: 0.72,
  edgeMidpointRatio: 0.68,
  subEmitterDefaultHardness: 14,
  maxHardness: 75,
  crispnessHardnessGain: 18,
  coreReachRatio: 1.35,
  coreWeight: 0.72,
  cornerWeight: 0.58,
  minCornerReach: 12,
  cornerRoundness: 1.25,
  cornerCrispnessFactor: 0.28,
  minEdgeReach: 14,
  edgeReachRatio: 0.95,
  edgeWeight: 0.45
};

export const POLYGON = {
  minSharpness: 0.2,
  maxSharpness: 1.0,
  vertexOffsetRatio: 0.34,
  vertexOffsetBase: 0.55,
  vertexOffsetSharpnessGain: 0.45,
  minLobeReach: 12,
  lobeReachBase: 0.68,
  lobeReachPerSide: 0.035,
  subEmitterDefaultHardness: 14,
  maxHardness: 72,
  sharpnessHardnessGain: 16,
  coreReachRatio: 0.72,
  coreWeight: 0.78,
  vertexWeight: 0.62,
  sideNormalizer: 3.5
};

export const ARRANGE_PATTERNS = [
  { id: 'ring', label: 'Orbit', icon: 'ph-circles-three' },
  { id: 'grid', label: 'Grid', icon: 'ph-squares-four' },
  { id: 'wave', label: 'Wave', icon: 'ph-wave-sine' },
  { id: 'spiral', label: 'Spiral', icon: 'ph-spiral' },
  { id: 'scatter', label: 'Scatter', icon: 'ph-shuffle' }
];

export const NODE_COORDINATE_FIELDS = [
  { label: 'X', field: 'x', min: 0, max: 100, valueClass: 'text-slate-800', toValue: (value) => ColorMath.clamp(value, 0, 100) },
  { label: 'Y', field: 'y', min: 0, max: 100, valueClass: 'text-slate-800', toValue: (value) => ColorMath.clamp(value, 0, 100) },
  { label: 'R', field: 'radius', title: 'Influence Boundary Reach %', min: 10, max: 140, valueClass: 'text-indigo-700', toValue: (value) => ColorMath.clamp(value, 10, 140) },
  { label: '∠', field: 'angle', title: 'Field Angle', min: 0, max: 360, valueClass: 'text-slate-800', toValue: (value) => wrapDegrees(value) }
];

export const HARMONY = {
  minChroma: 0.14,
  maxChroma: 0.27,
  minLightness: 0.48,
  maxLightness: 0.78,
  lightnessSwing: 0.06,
  analogousStepDeg: 34,
  complementaryDriftDeg: 18,
  triadicStepDeg: 120,
  triadicRowDriftDeg: 20,
  splitComplementAnglesDeg: [0, 150, 210],
  splitRowDriftDeg: 25,
  goldenStepDeg: 137.5,
  primaryLightnessRange: { min: 0.25, max: 0.90 },
  secondaryLightnessLift: 0.08,
  secondaryLightnessRange: { min: 0.30, max: 0.92 },
  secondaryChromaRatio: 0.9,
  secondaryChromaRange: { min: 0.08, max: 0.28 },
  secondaryHueOffsetDeg: 42
};
