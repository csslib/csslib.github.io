// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { ColorMath } from '../color/color-math.js';
import { Easing } from '../color/easing.js';
import { BASE_WASH, DEFAULT_BOUNDARY_SHAPE, DEFAULT_HUE_MODE, FALLBACK_HEX, FULL_TURN_DEG, PERCENT, STAGE_CENTER_PERCENT } from '../config/constants.js';
import { BOX, CONTROL_DEFAULTS, POLYGON } from '../data/field-options.js';
import { clampPolygonSides, computeBoxHalfHeight, computeBoxHalfWidth, computePolygonVertices, computeRectangleOutline, findInteractionMode, resolveColorSpace, resolveInteractionModeId, resolveRimHex } from '../geometry/boundary-geometry.js';
import { cssAngleToRadians, roundTo } from '../utils/angle-math.js';

const TERRACE_CONTOUR_CURVE = { p1: [0.88, 0.0], p2: [0.12, 1.0] };

const FIELD_FALLOFF = {
  maxCoreHardness: 0.85,
  minFalloffSpan: 0.001,
  singleColorRimAlphaRatio: 0.65,
  secondaryColorProgressGain: 1.15,
  rimAlphaMix: 0.6,
  edgeCutoff: 0.999
};

const HARMONIC_BRIDGE = { neighborMix: 0.45, chromaGain: 1.22, minChroma: 0.08, maxChroma: 0.32 };
const RING_ENVELOPE = { minPeak: 0.15, maxPeak: 0.8, sigma: 0.22, edgeExponent: 4 };
const RIPPLE_ENVELOPE = { amplitude: 0.24, center: 0.74, width: 0.11 };
const FIELD_REACH_LIMITS = { min: 8, max: 160 };
const RADIAL_SAMPLING = { naiveCount: 2, minCount: 6, defaultCount: 10 };
const EMITTER_SAMPLE_COUNT = 6;

const BEAM = {
  defaultAspectRatio: 2.0,
  minAspect: 0.4,
  maxAspect: 3.5,
  minorAxisAspectRatio: 0.65,
  lobeOffsetRatio: 0.28,
  minLobeOffset: 4,
  lobeWeight: 0.62,
  lobeReachRatio: 0.85
};

const CONIC = {
  minSpread: 30,
  maxSpread: 360,
  midSamplePosition: 0.45,
  fullCircleSpread: 355,
  maxFeatherDeg: 35,
  featherRatio: 0.25,
  midStopRatio: 0.45
};

const LINEAR_PLANE = {
  minAnchor: 5,
  maxAnchor: 95,
  minSpan: 15,
  spanRatio: 0.85,
  sampleCount: 8,
  leadOffset: 0.15,
  leadInRatio: 0.35
};

const VIGNETTE = { minIntensity: 0.01, midAlphaRatio: 0.35, defaultColor: '#0F172A', defaultBlendMode: 'multiply' };
const SHEEN = { minIntensity: 0.01, defaultAngle: 125, offsetPercent: 32, peakAlphaRatio: 0.75, midAlphaRatio: 0.28 };

export class GradientFieldCompiler {
  static compileScene(controls, globals = {}, { isNaiveSrgb = false } = {}) {
    const scene = { allControls: controls, globals, isNaiveSrgb };
    const basePrimary = ColorMath.applyGlobalGrading(globals.baseColor || BASE_WASH.defaultPrimary, globals);
    const layers = [
      this.buildVignetteLayer(globals),
      this.buildSheenLayer(globals),
      ...(controls || []).flatMap(control => this.compileControlLayers(control, scene)),
      this.buildBaseWashLayer(basePrimary, scene)
    ].filter(Boolean);

    const backgroundImages = layers.map(layer => layer.css);
    const blendModes = layers.map(layer => layer.blendMode || 'normal');
    return {
      fallbackColor: basePrimary,
      backgroundImages,
      blendModes,
      inlineStyle: backgroundImages.length > 0
        ? `background-color: ${basePrimary}; background-image: ${backgroundImages.join(', ')}; background-blend-mode: ${blendModes.join(', ')};`
        : `background-color: ${basePrimary};`
    };
  }

  static sampleControlAt(control, u, { allControls = [], globals = {}, isNaiveSrgb = false } = {}) {
    const scene = { allControls, globals, isNaiveSrgb };
    const position = ColorMath.clamp(u, 0, 1);
    const coreHex = ColorMath.applyGlobalGrading(control.color || FALLBACK_HEX, globals);
    const rimHex = ColorMath.applyGlobalGrading(resolveRimHex(control), globals);
    const { coreAlpha, rimAlpha } = this.resolveFieldAlphas(control);

    const falloffProgress = this.computeFalloffProgress(control, position);
    const easedProgress = this.easeFalloffProgress(control, falloffProgress, isNaiveSrgb);
    const boundaryHex = this.resolveBoundaryHex(control, rimHex, scene);
    const colorProgress = control.useSecondaryColor
      ? ColorMath.clamp(easedProgress * FIELD_FALLOFF.secondaryColorProgressGain, 0, 1)
      : easedProgress;
    const colorSample = ColorMath.mixColors(coreHex, boundaryHex, colorProgress, {
      colorSpace: resolveColorSpace(globals, isNaiveSrgb),
      hueMode: globals.hueMode || DEFAULT_HUE_MODE
    });

    const envelopeAlpha = this.computeEnvelopeAlpha(control, position, easedProgress, isNaiveSrgb);
    const rimPresence = Math.sin(position * Math.PI);
    const baseAlpha = coreAlpha * (1 - position) + rimAlpha * rimPresence * FIELD_FALLOFF.rimAlphaMix;
    const alpha = position >= FIELD_FALLOFF.edgeCutoff ? 0 : ColorMath.clamp(baseAlpha * envelopeAlpha, 0, 1);

    return {
      rgb: colorSample.rgb,
      hex: colorSample.hex,
      alpha,
      css: ColorMath.rgbToCss(colorSample.rgb, alpha),
      oklch: colorSample.oklch
    };
  }

  static findNearestNeighbor(control, allControls) {
    const others = (allControls || []).filter(candidate => candidate.id !== control.id && candidate.visible !== false);
    if (others.length === 0) return null;
    let nearest = others[0];
    let nearestDistance = Infinity;
    for (const candidate of others) {
      const distance = Math.hypot(
        (candidate.x ?? CONTROL_DEFAULTS.x) - (control.x ?? CONTROL_DEFAULTS.x),
        (candidate.y ?? CONTROL_DEFAULTS.y) - (control.y ?? CONTROL_DEFAULTS.y)
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = candidate;
      }
    }
    return nearest;
  }

  static resolveFieldAlphas(control) {
    const weight = control.weight ?? CONTROL_DEFAULTS.weight;
    const coreAlpha = ColorMath.clamp((control.alpha ?? CONTROL_DEFAULTS.alpha) * weight, 0, 1);
    const rimAlpha = control.useSecondaryColor
      ? ColorMath.clamp((control.secondaryAlpha ?? CONTROL_DEFAULTS.secondaryAlpha) * weight, 0, 1)
      : coreAlpha * FIELD_FALLOFF.singleColorRimAlphaRatio;
    return { coreAlpha, rimAlpha };
  }

  static computeFalloffProgress(control, position) {
    const hardness = ColorMath.clamp((control.hardness ?? CONTROL_DEFAULTS.hardness) / PERCENT, 0, FIELD_FALLOFF.maxCoreHardness);
    if (position <= hardness) return 0;
    return (position - hardness) / Math.max(FIELD_FALLOFF.minFalloffSpan, 1 - hardness);
  }

  static easeFalloffProgress(control, falloffProgress, isNaiveSrgb) {
    if (isNaiveSrgb) return falloffProgress;
    if (resolveInteractionModeId(control) === 'terrace-contour') {
      return Easing.evaluateCubicBezier(falloffProgress, TERRACE_CONTOUR_CURVE);
    }
    return Easing.evaluateTransition(falloffProgress, control.midpoint ?? CONTROL_DEFAULTS.midpoint, control.easing);
  }

  static resolveBoundaryHex(control, rimHex, { allControls, globals, isNaiveSrgb }) {
    if (isNaiveSrgb || resolveInteractionModeId(control) !== 'harmonic-bridge') return rimHex;
    const neighbor = this.findNearestNeighbor(control, allControls);
    if (!neighbor) return rimHex;
    const neighborHex = ColorMath.applyGlobalGrading(neighbor.color, globals);
    const bridge = ColorMath.mixColors(rimHex, neighborHex, HARMONIC_BRIDGE.neighborMix, { colorSpace: 'oklch', hueMode: 'shorter' });
    return ColorMath.oklchToHex({
      ...bridge.oklch,
      C: ColorMath.clamp(bridge.oklch.C * HARMONIC_BRIDGE.chromaGain, HARMONIC_BRIDGE.minChroma, HARMONIC_BRIDGE.maxChroma)
    });
  }

  static computeEnvelopeAlpha(control, position, easedProgress, isNaiveSrgb) {
    if (control.boundaryShape === 'ring-torus') return this.computeRingEnvelope(control, position);
    if (!isNaiveSrgb && resolveInteractionModeId(control) === 'ripple-interference') {
      const ripple = RIPPLE_ENVELOPE.amplitude * Math.exp(-Math.pow((position - RIPPLE_ENVELOPE.center) / RIPPLE_ENVELOPE.width, 2));
      return ColorMath.clamp(1 - easedProgress + ripple, 0, 1);
    }
    return 1 - easedProgress;
  }

  static computeRingEnvelope(control, position) {
    const peakRatio = ColorMath.clamp((control.innerRadius ?? CONTROL_DEFAULTS.innerRadius) / PERCENT, RING_ENVELOPE.minPeak, RING_ENVELOPE.maxPeak);
    const distanceFromRing = (position - peakRatio) / RING_ENVELOPE.sigma;
    return Math.exp(-0.5 * distanceFromRing * distanceFromRing) * (1 - Math.pow(position, RING_ENVELOPE.edgeExponent));
  }

  static compileControlLayers(control, scene) {
    if (control.visible === false) return [];
    const field = this.resolveFieldPlacement(control, scene.globals);

    switch (control.boundaryShape || DEFAULT_BOUNDARY_SHAPE) {
      case 'ellipse-beam': return this.compileBeamLayers(control, field, scene);
      case 'rect-box': return this.compileBoxLayers(control, field, scene);
      case 'polygon': return this.compilePolygonLayers(control, field, scene);
      case 'conic-wedge': return this.compileConicLayers(control, field, scene);
      case 'linear-plane': return this.compileLinearPlaneLayers(control, field, scene);
      default: return this.compileCircleLayers(control, field, scene);
    }
  }

  static resolveFieldPlacement(control, globals) {
    const reachScale = Number(globals.reachScale ?? 1);
    const interactionMode = findInteractionMode(resolveInteractionModeId(control));
    return {
      reachPercent: ColorMath.clamp(
        Math.round((control.radius ?? CONTROL_DEFAULTS.radius) * reachScale),
        FIELD_REACH_LIMITS.min,
        FIELD_REACH_LIMITS.max
      ),
      x: Math.round(control.x ?? CONTROL_DEFAULTS.x),
      y: Math.round(control.y ?? CONTROL_DEFAULTS.y),
      angle: Math.round(control.angle ?? CONTROL_DEFAULTS.angle),
      blendMode: interactionMode ? interactionMode.blendMode : 'normal'
    };
  }

  static buildRadialStops(control, scene, maxPercent) {
    if (!scene.isNaiveSrgb && control.easing?.mode === 'steps') {
      return this.buildSteppedRadialStops(control, scene, maxPercent);
    }
    const sampleCount = scene.isNaiveSrgb
      ? RADIAL_SAMPLING.naiveCount
      : Math.max(RADIAL_SAMPLING.minCount, control.easing?.samples || RADIAL_SAMPLING.defaultCount);
    const stops = [];
    for (let i = 0; i <= sampleCount; i++) {
      const u = i / sampleCount;
      const sample = this.sampleControlAt(control, u, scene);
      stops.push(`${sample.css} ${roundTo(u * maxPercent, 1)}%`);
    }
    return stops.join(', ');
  }

  static buildSteppedRadialStops(control, scene, maxPercent) {
    const bandCount = Easing.countStepBands(control.easing);
    const stops = [];
    for (let band = 0; band < bandCount; band++) {
      const bandStart = band / bandCount;
      const bandEnd = (band + 1) / bandCount;
      const sample = this.sampleControlAt(control, bandStart, scene);
      stops.push(`${sample.css} ${roundTo(bandStart * maxPercent, 1)}%`, `${sample.css} ${roundTo(bandEnd * maxPercent, 1)}%`);
    }
    const edgeSample = this.sampleControlAt(control, 1, scene);
    stops.push(`${edgeSample.css} ${maxPercent}%`);
    return stops.join(', ');
  }

  static buildCircleEmitter(emitterControl, scene, { center, stopPercentAt }) {
    const stops = [];
    for (let i = 0; i <= EMITTER_SAMPLE_COUNT; i++) {
      const u = i / EMITTER_SAMPLE_COUNT;
      const sample = this.sampleControlAt(emitterControl, u, scene);
      stops.push(`${sample.css} ${roundTo(stopPercentAt(u), 1)}%`);
    }
    const centerX = ColorMath.clamp(roundTo(center.x, 1), 0, PERCENT);
    const centerY = ColorMath.clamp(roundTo(center.y, 1), 0, PERCENT);
    return `radial-gradient(circle at ${centerX}% ${centerY}%, ${stops.join(', ')})`;
  }

  static compileCircleLayers(control, field, scene) {
    return [{
      css: `radial-gradient(circle at ${field.x}% ${field.y}%, ${this.buildRadialStops(control, scene, field.reachPercent)})`,
      blendMode: field.blendMode
    }];
  }

  static compileBeamLayers(control, field, scene) {
    const aspect = ColorMath.clamp(Number(control.aspectRatio ?? BEAM.defaultAspectRatio), BEAM.minAspect, BEAM.maxAspect);
    const axisRad = cssAngleToRadians(field.angle);
    const majorRadius = Math.round(field.reachPercent * aspect);
    const minorRadius = Math.round(field.reachPercent / Math.max(1, aspect * BEAM.minorAxisAspectRatio));
    const mainLayer = {
      css: `radial-gradient(${majorRadius}% ${minorRadius}% at ${field.x}% ${field.y}%, ${this.buildRadialStops(control, scene, PERCENT)})`,
      blendMode: field.blendMode
    };

    const lobeOffset = Math.round(field.reachPercent * BEAM.lobeOffsetRatio * (aspect - 1));
    if (Math.abs(lobeOffset) <= BEAM.minLobeOffset) return [mainLayer];

    const lobeControl = { ...control, weight: (control.weight ?? CONTROL_DEFAULTS.weight) * BEAM.lobeWeight };
    const offsetX = Math.cos(axisRad) * lobeOffset;
    const offsetY = Math.sin(axisRad) * lobeOffset;
    const lobeCenters = [
      { x: field.x + offsetX, y: field.y + offsetY },
      { x: field.x - offsetX, y: field.y - offsetY }
    ];
    const lobeLayers = lobeCenters.map(lobeCenter => ({
      css: this.buildCircleEmitter(lobeControl, scene, {
        center: {
          x: ColorMath.clamp(Math.round(lobeCenter.x), 0, PERCENT),
          y: ColorMath.clamp(Math.round(lobeCenter.y), 0, PERCENT)
        },
        stopPercentAt: (u) => u * field.reachPercent * BEAM.lobeReachRatio
      }),
      blendMode: field.blendMode
    }));
    return [mainLayer, ...lobeLayers];
  }

  static compileBoxLayers(control, field, scene) {
    const aspect = ColorMath.clamp(Number(control.aspectRatio ?? CONTROL_DEFAULTS.aspectRatio), BOX.minAspect, BOX.maxAspect);
    const crispness = ColorMath.clamp(
      Number(control.boxCrispness ?? CONTROL_DEFAULTS.boxCrispness) / PERCENT,
      BOX.minCrispness,
      BOX.maxCrispness
    );
    const halfWidth = computeBoxHalfWidth(field.reachPercent);
    const halfHeight = computeBoxHalfHeight(halfWidth, aspect);
    const outline = computeRectangleOutline({
      center: { x: field.x, y: field.y },
      halfWidth: halfWidth * BOX.outlineInset,
      halfHeight: halfHeight * BOX.outlineInset,
      angleDeg: field.angle
    });
    const emitterHardness = Math.min(
      BOX.maxHardness,
      Math.round((control.hardness ?? BOX.subEmitterDefaultHardness) + crispness * BOX.crispnessHardnessGain)
    );
    const buildEmitterLayer = this.createSubEmitterBuilder(control, field, scene, emitterHardness);

    const cornerReach = Math.max(BOX.minCornerReach, Math.round(Math.min(halfWidth, halfHeight) * (BOX.cornerRoundness - crispness * BOX.cornerCrispnessFactor)));
    const edgeReach = Math.max(BOX.minEdgeReach, Math.round(Math.max(halfWidth, halfHeight) * BOX.edgeReachRatio));

    return [
      buildEmitterLayer({ x: field.x, y: field.y }, Math.round(Math.max(halfWidth, halfHeight) * BOX.coreReachRatio), BOX.coreWeight),
      ...outline.corners.map(corner => buildEmitterLayer(corner, cornerReach, BOX.cornerWeight * crispness)),
      buildEmitterLayer(outline.edges[0], edgeReach, BOX.edgeWeight),
      buildEmitterLayer(outline.edges[1], edgeReach, BOX.edgeWeight)
    ];
  }

  static compilePolygonLayers(control, field, scene) {
    const sides = clampPolygonSides(control.polygonSides);
    const sharpness = ColorMath.clamp(
      Number(control.polygonSharpness ?? CONTROL_DEFAULTS.polygonSharpness) / PERCENT,
      POLYGON.minSharpness,
      POLYGON.maxSharpness
    );
    const vertexOffset = field.reachPercent * POLYGON.vertexOffsetRatio * (POLYGON.vertexOffsetBase + sharpness * POLYGON.vertexOffsetSharpnessGain);
    const vertices = computePolygonVertices({
      center: { x: field.x, y: field.y },
      radius: vertexOffset,
      sides,
      angleDeg: field.angle
    });
    const lobeReach = Math.max(POLYGON.minLobeReach, Math.round(field.reachPercent * (POLYGON.lobeReachBase - sides * POLYGON.lobeReachPerSide)));
    const emitterHardness = Math.min(
      POLYGON.maxHardness,
      Math.round((control.hardness ?? POLYGON.subEmitterDefaultHardness) + sharpness * POLYGON.sharpnessHardnessGain)
    );
    const buildEmitterLayer = this.createSubEmitterBuilder(control, field, scene, emitterHardness);
    const vertexWeight = (POLYGON.vertexWeight * sharpness) / Math.sqrt(sides / POLYGON.sideNormalizer);

    return [
      buildEmitterLayer({ x: field.x, y: field.y }, Math.round(field.reachPercent * POLYGON.coreReachRatio), POLYGON.coreWeight),
      ...vertices.map(vertex => buildEmitterLayer(vertex, lobeReach, vertexWeight))
    ];
  }

  static createSubEmitterBuilder(control, field, scene, emitterHardness) {
    const baseWeight = control.weight ?? CONTROL_DEFAULTS.weight;
    return (center, reachPercent, weightMultiplier) => ({
      css: this.buildCircleEmitter(
        { ...control, hardness: emitterHardness, weight: baseWeight * weightMultiplier },
        scene,
        { center, stopPercentAt: (u) => u * reachPercent }
      ),
      blendMode: field.blendMode
    });
  }

  static compileConicLayers(control, field, scene) {
    const spread = ColorMath.clamp(Number(control.sectorSpread ?? CONTROL_DEFAULTS.sectorSpread), CONIC.minSpread, CONIC.maxSpread);
    const startAngle = Math.round(field.angle - spread / 2);
    const coreSample = this.sampleControlAt(control, 0, scene);
    const midSample = this.sampleControlAt(control, CONIC.midSamplePosition, scene);
    const transparentCss = ColorMath.rgbToCss(coreSample.rgb, 0);
    const halfSpread = roundTo(spread / 2, 1);
    const featherDeg = roundTo(Math.min(CONIC.maxFeatherDeg, (FULL_TURN_DEG - spread) * CONIC.featherRatio), 1);
    const at = `${field.x}% ${field.y}%`;

    const conicCss = spread >= CONIC.fullCircleSpread
      ? `conic-gradient(from ${field.angle}deg at ${at}, ${transparentCss} 0deg, ${midSample.css} 90deg, ${coreSample.css} 180deg, ${midSample.css} 270deg, ${transparentCss} 360deg)`
      : `conic-gradient(from ${startAngle}deg at ${at}, ${transparentCss} 0deg, ${midSample.css} ${roundTo(halfSpread * CONIC.midStopRatio, 1)}deg, ${coreSample.css} ${halfSpread}deg, ${midSample.css} ${roundTo(spread - halfSpread * CONIC.midStopRatio, 1)}deg, ${transparentCss} ${spread}deg, ${transparentCss} ${roundTo(spread + featherDeg, 1)}deg, ${transparentCss} 360deg)`;

    return [{ css: conicCss, blendMode: field.blendMode }];
  }

  static compileLinearPlaneLayers(control, field, scene) {
    const axisRad = cssAngleToRadians(field.angle);
    const projectedOffset = (field.x - STAGE_CENTER_PERCENT) * Math.cos(axisRad) + (field.y - STAGE_CENTER_PERCENT) * Math.sin(axisRad);
    const anchorPercent = ColorMath.clamp(Math.round(STAGE_CENTER_PERCENT + projectedOffset), LINEAR_PLANE.minAnchor, LINEAR_PLANE.maxAnchor);
    const span = Math.max(LINEAR_PLANE.minSpan, Math.round(field.reachPercent * LINEAR_PLANE.spanRatio));

    const sampledStops = [];
    for (let i = 0; i <= LINEAR_PLANE.sampleCount; i++) {
      const u = i / LINEAR_PLANE.sampleCount;
      const sample = this.sampleControlAt(control, u, scene);
      const position = ColorMath.clamp(roundTo(anchorPercent + (u - LINEAR_PLANE.leadOffset) * span, 1), 0, PERCENT);
      sampledStops.push({ position, css: sample.css });
    }
    const coreSample = this.sampleControlAt(control, 0, scene);
    const leadInStop = {
      position: Math.max(0, roundTo(anchorPercent - span * LINEAR_PLANE.leadInRatio, 1)),
      css: ColorMath.rgbToCss(coreSample.rgb, 0)
    };
    const orderedStops = [leadInStop, ...sampledStops]
      .sort((first, second) => first.position - second.position)
      .map(stop => `${stop.css} ${stop.position}%`);

    return [{
      css: `linear-gradient(${field.angle}deg, ${orderedStops.join(', ')})`,
      blendMode: field.blendMode
    }];
  }

  static buildVignetteLayer(globals) {
    const intensity = globals.vignetteIntensity;
    if (!intensity || intensity <= VIGNETTE.minIntensity) return null;
    const vignetteRgb = ColorMath.hexToRgb(globals.vignetteColor || VIGNETTE.defaultColor);
    const transparentCss = ColorMath.rgbToCss(vignetteRgb, 0);
    const midCss = ColorMath.rgbToCss(vignetteRgb, roundTo(intensity * VIGNETTE.midAlphaRatio, 3));
    const edgeCss = ColorMath.rgbToCss(vignetteRgb, roundTo(intensity, 3));
    return {
      css: `radial-gradient(circle at 50% 50%, ${transparentCss} 42%, ${midCss} 76%, ${edgeCss} 100%)`,
      blendMode: globals.vignetteBlend || VIGNETTE.defaultBlendMode
    };
  }

  static buildSheenLayer(globals) {
    const intensity = globals.sheenIntensity;
    if (!intensity || intensity <= SHEEN.minIntensity) return null;
    const sheenRad = cssAngleToRadians(Number(globals.sheenAngle ?? SHEEN.defaultAngle));
    const glowX = Math.round(STAGE_CENTER_PERCENT - Math.cos(sheenRad) * SHEEN.offsetPercent);
    const glowY = Math.round(STAGE_CENTER_PERCENT - Math.sin(sheenRad) * SHEEN.offsetPercent);
    const peakAlpha = roundTo(intensity * SHEEN.peakAlphaRatio, 3);
    const midAlpha = roundTo(intensity * SHEEN.midAlphaRatio, 3);
    return {
      css: `radial-gradient(110% 90% at ${glowX}% ${glowY}%, rgba(255, 255, 255, ${peakAlpha}) 0%, rgba(255, 255, 255, ${midAlpha}) 42%, rgba(255, 255, 255, 0) 85%)`,
      blendMode: 'soft-light'
    };
  }

  static buildBaseWashLayer(basePrimary, { globals, isNaiveSrgb }) {
    if (globals.baseGradientEnabled === false) return null;
    const baseSecondary = ColorMath.applyGlobalGrading(globals.baseSecondaryColor || BASE_WASH.defaultSecondary, globals);
    const baseAngle = Math.round(globals.baseAngle ?? BASE_WASH.defaultAngle);
    const midBase = ColorMath.mixColors(basePrimary, baseSecondary, BASE_WASH.midpoint, {
      colorSpace: resolveColorSpace(globals, isNaiveSrgb),
      hueMode: globals.hueMode || DEFAULT_HUE_MODE
    });
    return {
      css: `linear-gradient(${baseAngle}deg, ${basePrimary} 0%, ${midBase.hex} 50%, ${baseSecondary} 100%)`,
      blendMode: 'normal'
    };
  }
}
