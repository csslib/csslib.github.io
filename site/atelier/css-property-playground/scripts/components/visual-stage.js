// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html } from 'lit';
import { LightDomLitElement } from './light-dom-lit-element.js';
import { BEZIER_GRAPH, BLEND_MODES, DEFAULT_PREVIEW_TEXT, DRAG_SENSITIVITY, FALLBACK_GRID_COLUMNS, PERCENT_RANGE, SHADOW_OFFSET_RANGE_PX } from '../config/constants.js';
import { CSS_PROPERTY_ENGINES } from '../data/property-engines.js';
import { describeClampState, getActiveLayerIndex } from '../engines/engine-state.js';
import { computeDialHandlePosition, computeDragValueChanges, insertVertexAtNearestEdge, mapToBezierGraph } from '../stage/drag-geometry.js';
import { dispatchValueChanges } from '../utils/browser-actions.js';
import { clampToRange, convertToPercentOfRange } from '../utils/value-math.js';

const FALLBACK_STAGE_RECT = { left: 0, top: 0, width: 300, height: 300 };
const ANGLE_DIAL_RADIUS_PERCENT = 42;
const GRADIENT_DIAL_RADIUS_PERCENT = 44;
const CORNER_HANDLE_POSITION_SCALE = 0.45;
const BEZIER_RACE_DISTANCE_PX = 164;

const MOTION_PATH_STAGE = {
  widthPx: 320,
  heightPx: 176,
  start: { x: 20, y: 130 },
  end: { x: 300, y: 130 },
  defaultControlX: 160,
  defaultControlY: 15
};

const VARIABLE_FONT_HANDLE_BOUNDS_PERCENT = {
  left: { min: 8, max: 92 },
  top: { min: 12, max: 88 }
};

const CORNER_HANDLES = [
  { xKey: 'tlX', yKey: 'tlY', dirX: 1, dirY: 1, horizontalSide: 'left', verticalSide: 'top', translateClasses: '-translate-x-1/2 -translate-y-1/2', title: 'Drag Top-Left Corner Radius' },
  { xKey: 'trX', yKey: 'trY', dirX: -1, dirY: 1, horizontalSide: 'right', verticalSide: 'top', translateClasses: 'translate-x-1/2 -translate-y-1/2', title: 'Drag Top-Right Corner Radius' },
  { xKey: 'brX', yKey: 'brY', dirX: -1, dirY: -1, horizontalSide: 'right', verticalSide: 'bottom', translateClasses: 'translate-x-1/2 translate-y-1/2', title: 'Drag Bottom-Right Corner Radius' },
  { xKey: 'blX', yKey: 'blY', dirX: 1, dirY: -1, horizontalSide: 'left', verticalSide: 'bottom', translateClasses: '-translate-x-1/2 translate-y-1/2', title: 'Drag Bottom-Left Corner Radius' }
];

const BOX_PADDING_HANDLES = [
  { key: 'padTop', axis: 'y', factor: DRAG_SENSITIVITY.boxSpacingFactor, positionClasses: 'top-1 left-1/2 -translate-x-1/2', title: 'Drag Vertical Top Padding' },
  { key: 'padBottom', axis: 'y', factor: -DRAG_SENSITIVITY.boxSpacingFactor, positionClasses: 'bottom-1 left-1/2 -translate-x-1/2', title: 'Drag Vertical Bottom Padding' },
  { key: 'padLeft', axis: 'x', factor: DRAG_SENSITIVITY.boxSpacingFactor, positionClasses: 'left-1 top-1/2 -translate-y-1/2', title: 'Drag Horizontal Left Padding' },
  { key: 'padRight', axis: 'x', factor: -DRAG_SENSITIVITY.boxSpacingFactor, positionClasses: 'right-1 top-1/2 -translate-y-1/2', title: 'Drag Horizontal Right Padding' }
];

const SHAPE_OUTSIDE_CENTER_PAD = { x: 'cx', y: 'cy', xMin: 0, xMax: 75, yMin: 15, yMax: 85 };
const GRADIENT_CENTER_PAD = { x: 'centerX', y: 'centerY', xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
const CLIP_CENTER_PAD = { x: 'circleX', y: 'circleY', xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
const MOTION_PATH_CONTROL_PAD = { x: 'curveX', y: 'curvePeak', xMin: 40, xMax: 280, yMin: -40, yMax: 170 };

const Z_INDEX_CARDS = [
  { valueKey: 'zA', label: 'Card A (Indigo)', colorClasses: 'bg-brand-600 text-white', offsetClasses: '-translate-x-10 -translate-y-6' },
  { valueKey: 'zB', label: 'Card B (Emerald)', colorClasses: 'bg-emerald-500 text-white', offsetClasses: 'translate-x-0 translate-y-0' },
  { valueKey: 'zC', label: 'Card C (Rose)', colorClasses: 'bg-rose-500 text-white', offsetClasses: 'translate-x-10 translate-y-6' }
];

class VisualStage extends LightDomLitElement {
  static properties = {
    engine: { type: Object },
    values: { type: Object },
    areGuidesVisible: { type: Boolean },
    isBezierRaceRunning: { type: Boolean }
  };

  constructor() {
    super();
    this.engine = CSS_PROPERTY_ENGINES[0];
    this.values = {};
    this.areGuidesVisible = true;
    this.isBezierRaceRunning = false;
    this._activeDrag = null;
    this._boundPointerMove = this._handlePointerMove.bind(this);
    this._boundPointerUp = this._handlePointerUp.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('pointermove', this._boundPointerMove);
    window.addEventListener('pointerup', this._boundPointerUp);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('pointermove', this._boundPointerMove);
    window.removeEventListener('pointerup', this._boundPointerUp);
  }

  render() {
    return html`
      <div class="flex flex-col bg-white">
        ${this.renderToolbar()}

        <div
          id="interactive-stage-box"
          class="blueprint-grid relative min-h-[300px] sm:min-h-[330px] flex items-center justify-center p-5 overflow-hidden"
        >
          ${this.renderStageContent()}
        </div>
      </div>
    `;
  }

  emitValueChanges(valueChanges) {
    dispatchValueChanges(this, valueChanges);
  }

  emitReset() {
    this.dispatchEvent(new CustomEvent('reset-params', { bubbles: true, composed: true }));
  }

  startDrag(type, options, event) {
    event.preventDefault();
    event.stopPropagation();
    const stageElement = this.querySelector('#interactive-stage-box');
    const stageRect = stageElement ? stageElement.getBoundingClientRect() : FALLBACK_STAGE_RECT;
    this._activeDrag = {
      type,
      options,
      startX: event.clientX,
      startY: event.clientY,
      stageRect,
      initialValues: { ...this.values }
    };
  }

  startXYPadDrag(pad, event) {
    this.startDrag('xy-pad', pad, event);
  }

  _handlePointerMove(event) {
    if (!this._activeDrag) return;
    const context = { currentValues: this.values, controls: this.engine.controls };
    const valueChanges = computeDragValueChanges(this._activeDrag, event, context);
    if (valueChanges) this.emitValueChanges(valueChanges);
  }

  _handlePointerUp() {
    this._activeDrag = null;
  }

  renderToolbar() {
    return html`
      <div class="min-h-11 px-3.5 py-2 bg-white border-b border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-2.5 h-2.5 rounded-full bg-brand-600 shrink-0"></span>
          <span class="font-mono text-xs font-bold text-slate-800 truncate">${this.engine.name}</span>
          <span class="hidden sm:inline text-[11px] px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-medium border border-brand-200/60 shrink-0">
            Interactive Stage
          </span>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            @click=${() => { this.areGuidesVisible = !this.areGuidesVisible; }}
            class="px-2.5 py-1 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
              this.areGuidesVisible
                ? 'bg-brand-50 border-brand-200 text-brand-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }"
            title="Toggle Interactive Gizmo Handles & Rulers"
          >
            <i class="ph-bold ${this.areGuidesVisible ? 'ph-eye' : 'ph-eye-slash'}"></i>
            <span>Visual Gizmos & Rulers</span>
          </button>

          <button
            @click=${() => this.emitReset()}
            class="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition flex items-center gap-1"
            title="Reset parameters to default"
          >
            <i class="ph-bold ph-arrow-counter-clockwise"></i>
            <span>Reset</span>
          </button>
        </div>
      </div>
    `;
  }

  renderStageContent() {
    const engine = this.engine;
    const values = this.values;
    const cssText = engine.buildCss(values);

    switch (engine.gizmoType) {
      case 'corner-radius':
        return this.renderCornerRadiusStage(values, cssText);
      case 'border-image-stage':
        return this.renderBorderImageStage(values, cssText);
      case 'clamp-graph':
        return this.renderClampStage(values);
      case 'box-model':
        return this.renderBoxModelStage(values, cssText);
      case 'outline-ring':
        return this.renderOutlineStage(values, cssText);
      case 'aspect-box':
        return this.renderAspectStage(values, cssText);
      case 'xy-pad':
        return this.renderXYPadStage(engine, values, cssText);
      case 'multi-box-shadow':
        return this.renderMultiBoxShadowStage(values, cssText);
      case 'multi-text-shadow':
        return this.renderMultiTextShadowStage(values, cssText);
      case 'multi-gradient':
        return this.renderMultiGradientStage(values, cssText);
      case 'bg-pattern-stage':
        return this.renderBackgroundPatternStage(values, cssText);
      case 'blend-mode-stage':
        return this.renderBlendModeStage(engine, values);
      case 'angle-dial':
        return this.renderAngleDialStage(engine, values, cssText);
      case 'clip-polygon':
        return this.renderClipPolygonStage(values, cssText);
      case 'shape-outside-sim':
        return this.renderShapeOutsideStage(values);
      case 'mask-stage':
        return this.renderMaskStage(cssText);
      case 'draggable-lens':
        return this.renderBackdropLensStage(engine, values, cssText);
      case 'filter-split':
        return this.renderFilterStage(values, cssText);
      case 'type-ruler':
        return this.renderTypographyStage(values, cssText);
      case 'variable-font-stage':
        return this.renderVariableFontStage(engine, values, cssText);
      case 'underline-anatomy':
        return this.renderUnderlineStage(values, cssText);
      case 'line-clamp-stage':
        return this.renderLineClampStage(values, cssText);
      case 'columns-preview':
        return this.renderColumnsStage(cssText);
      case 'flex-simulator':
        return this.renderFlexStage(values);
      case 'grid-simulator':
        return this.renderGridStage(values);
      case 'bezier-editor':
        return this.renderBezierStage(values);
      case 'keyframes-stage':
        return this.renderKeyframesStage(values);
      case 'motion-path':
        return this.renderMotionPathStage(values);
      case 'scroll-offset-sim':
        return this.renderScrollOffsetStage(values);
      case 'z-index-layers':
        return this.renderZIndexStage(values);
      default:
        return html`<div style=${cssText} class="w-56 h-56 bg-brand-600 rounded-xl"></div>`;
    }
  }

  renderCornerRadiusStage(values, cssText) {
    const describeCorner = (xKey, yKey) => `${values[xKey]}%${values.useSlash ? `/${values[yKey]}%` : ''}`;
    return html`
      <div class="relative w-64 h-64 flex items-center justify-center">
        ${this.areGuidesVisible ? html`
          <div class="absolute inset-0 border-2 border-dashed border-slate-300 rounded-none pointer-events-none"></div>
          <div class="absolute -top-6 left-0 right-0 flex justify-between text-[10px] font-mono text-slate-500">
            <span>TL: ${describeCorner('tlX', 'tlY')}</span>
            <span>TR: ${describeCorner('trX', 'trY')}</span>
          </div>
          <div class="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] font-mono text-slate-500">
            <span>BL: ${describeCorner('blX', 'blY')}</span>
            <span>BR: ${describeCorner('brX', 'brY')}</span>
          </div>
        ` : ''}

        <div
          style="${cssText}"
          class="w-full h-full bg-gradient-to-br from-brand-500 via-indigo-600 to-violet-600 shadow-xl flex flex-col items-center justify-center text-white p-6 text-center transition-colors"
        >
          <span class="font-mono text-xs uppercase tracking-wider opacity-80">Drag Corners</span>
          <span class="text-sm font-semibold mt-1">
            ${values.useSlash ? '8-Value Super-Ellipse' : '4-Corner Radius'}
          </span>
        </div>

        ${this.areGuidesVisible ? CORNER_HANDLES.map(handle => this.renderCornerHandle(handle, values)) : ''}
      </div>
    `;
  }

  renderCornerHandle(handle, values) {
    const horizontalRadius = values[handle.xKey];
    const verticalRadius = values.useSlash ? values[handle.yKey] : horizontalRadius;
    const { xKey, yKey, dirX, dirY } = handle;
    return html`
      <div
        @pointerdown=${(event) => this.startDrag('corner-handle', { xKey, yKey, dirX, dirY }, event)}
        style="${handle.horizontalSide}: ${horizontalRadius * CORNER_HANDLE_POSITION_SCALE}%; ${handle.verticalSide}: ${verticalRadius * CORNER_HANDLE_POSITION_SCALE}%;"
        class="gizmo-handle absolute ${handle.translateClasses} w-5 h-5 rounded-full bg-white border-2 border-brand-600 shadow-md flex items-center justify-center"
        title="${handle.title}"
      >
        <div class="w-1.5 h-1.5 rounded-full bg-brand-600"></div>
      </div>
    `;
  }

  renderBorderImageStage(values, cssText) {
    return html`
      <div class="flex flex-col sm:flex-row items-center gap-6">
        <div class="relative w-44 h-44 rounded-xl overflow-hidden shadow-md border border-slate-300 shrink-0"
             style="background: linear-gradient(${values.angle}deg, #4f46e5, #ec4899, #f59e0b);">
          <div class="absolute inset-0 bg-black/15"></div>
          <div style="top: ${values.sliceTop}%;" class="absolute left-0 right-0 border-t-2 border-dashed border-white/95"></div>
          <div style="bottom: ${values.sliceBottom}%;" class="absolute left-0 right-0 border-t-2 border-dashed border-white/95"></div>
          <div style="left: ${values.sliceLeft}%;" class="absolute top-0 bottom-0 border-l-2 border-dashed border-white/95"></div>
          <div style="right: ${values.sliceRight}%;" class="absolute top-0 bottom-0 border-l-2 border-dashed border-white/95"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="px-2 py-0.5 rounded bg-slate-900/80 text-white font-mono text-[10px]">
              9-Slice Source
            </span>
          </div>
        </div>

        <div class="p-4 bg-white rounded-xl border border-dashed border-slate-300">
          <div
            style="${cssText}"
            class="w-56 h-36 bg-white flex flex-col items-center justify-center p-4 text-center"
          >
            <span class="font-mono text-xs font-bold text-slate-800">border-image Box</span>
            <span class="font-mono text-[10px] text-slate-500 mt-1">
              width: ${values.borderW}px | outset: ${values.outset}px
            </span>
          </div>
        </div>
      </div>
    `;
  }

  renderClampStage(values) {
    const preferredPx = values.basePx + (values.vwSlope / 100) * values.simViewport;
    const clampedPx = clampToRange(preferredPx, values.minPx, values.maxPx);

    return html`
      <div class="w-full max-w-lg flex flex-col gap-4">
        <div class="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-mono">
          <span>Viewport: <strong>${values.simViewport}px</strong></span>
          <span class="px-2 py-0.5 rounded bg-brand-500/30 text-brand-200 border border-brand-400/30">${describeClampState(preferredPx, values)}</span>
          <span>Computed: <strong class="text-emerald-400">${clampedPx.toFixed(1)}px</strong></span>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center overflow-hidden">
          <div style="font-size: ${clampedPx}px; line-height: 1.15;" class="font-extrabold text-slate-900 transition-all">
            Fluid Typography
          </div>
          <div class="text-[11px] font-mono text-slate-400 mt-2">
            clamp(${values.minPx}px, ${values.basePx}px + ${values.vwSlope}vw, ${values.maxPx}px)
          </div>
        </div>
      </div>
    `;
  }

  renderBoxModelStage(values, cssText) {
    return html`
      <div class="relative flex items-center justify-center p-6">
        <div class="bg-amber-100/75 border-2 border-dashed border-amber-400 rounded-2xl p-4 relative flex items-center justify-center transition-all">
          ${this.areGuidesVisible ? html`
            <span class="absolute top-1 left-2.5 text-[10px] font-mono font-bold text-amber-800 uppercase">
              margin (${values.marTop}px ${values.marRight}px ${values.marBottom}px ${values.marLeft}px)
            </span>
          ` : ''}

          <div
            style="${cssText}"
            class="relative bg-emerald-100/90 border-2 border-brand-600 rounded-xl shadow-md transition-all flex items-center justify-center"
          >
            ${this.areGuidesVisible ? BOX_PADDING_HANDLES.map(handle => this.renderPaddingHandle(handle, values)) : ''}

            <div class="bg-brand-600 text-white rounded-lg px-6 py-4 text-center shadow-inner min-w-[140px]">
              <div class="font-mono text-[10px] uppercase tracking-wider opacity-80">Content Box</div>
              <div class="text-xs font-semibold mt-0.5">border-box</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderPaddingHandle(handle, values) {
    const { key, axis, factor } = handle;
    return html`
      <div
        @pointerdown=${(event) => this.startDrag('box-spacing', { key, axis, factor }, event)}
        class="gizmo-handle absolute ${handle.positionClasses} px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono text-[9px] shadow"
        title="${handle.title}"
      >${values[key]}px</div>
    `;
  }

  renderOutlineStage(values, cssText) {
    return html`
      <div class="relative flex items-center justify-center p-10">
        <div
          style="${cssText}"
          class="w-56 h-36 bg-white border-2 border-slate-800 shadow-lg flex flex-col items-center justify-center p-4 text-center transition-all"
        >
          <span class="text-xs font-bold text-slate-800">Element Border Edge</span>
          <span class="font-mono text-[11px] text-brand-600 mt-1">
            outline-offset: ${values.offset}px
          </span>
          <span class="text-[10px] text-slate-400 mt-0.5">No layout shift!</span>
        </div>
      </div>
    `;
  }

  renderAspectStage(values, cssText) {
    return html`
      <div class="flex flex-col items-center justify-center">
        <div
          style="${cssText}"
          class="bg-gradient-to-tr from-brand-600 to-indigo-500 text-white rounded-2xl shadow-lg border-2 border-white flex flex-col items-center justify-center p-4 relative overflow-hidden max-h-60"
        >
          ${this.areGuidesVisible ? html`
            <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-30">
              <line x1="0" y1="0" x2="100%" y2="100%" stroke="white" stroke-width="1.5" stroke-dasharray="4 4" />
            </svg>
          ` : ''}
          <span class="font-mono text-lg font-bold">${values.ratioW} : ${values.ratioH}</span>
          <span class="font-mono text-[11px] opacity-85 mt-0.5">width: ${values.width}px</span>
        </div>
      </div>
    `;
  }

  renderXYPadStage(engine, values, cssText) {
    const pad = engine.gizmoKeys;
    const handlePosition = {
      left: convertToPercentOfRange(values[pad.x], pad.xMin, pad.xMax),
      top: convertToPercentOfRange(values[pad.y], pad.yMin, pad.yMax)
    };

    if (engine.id === 'object-position') return this.renderFocalPointStage(pad, handlePosition, values, cssText);
    if (engine.id === 'transform-origin') return this.renderTransformOriginStage(pad, handlePosition, values, cssText);
    return this.renderPerspectiveStage(pad, handlePosition, values, cssText);
  }

  renderFocalPointStage(pad, handlePosition, values, cssText) {
    return html`
      <div class="relative w-64 h-52 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-lg bg-slate-100">
        <img
          src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80"
          onerror="this.src='https://placehold.co/600x400/4f46e5/ffffff?text=Focal+Subject'"
          alt="Sample Focal Demo"
          style="${cssText}"
          class="w-full h-full pointer-events-none select-none"
        />
        ${this.areGuidesVisible ? html`
          <div
            @pointerdown=${(event) => this.startXYPadDrag(pad, event)}
            style="left: ${handlePosition.left}%; top: ${handlePosition.top}%;"
            class="gizmo-handle absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand-600/90 border-2 border-white text-white shadow-lg flex items-center justify-center"
            title="Drag Focal Point (${values[pad.x]}% ${values[pad.y]}%)"
          >
            <i class="ph-bold ph-crosshair text-sm"></i>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderTransformOriginStage(pad, handlePosition, values, cssText) {
    return html`
      <div class="relative w-56 h-56 flex items-center justify-center">
        <div class="absolute inset-0 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-100/50 pointer-events-none"></div>

        <div
          style="${cssText}"
          class="w-full h-full bg-gradient-to-br from-brand-500 to-indigo-700/90 text-white rounded-2xl shadow-xl flex flex-col items-center justify-center p-4 text-center"
        >
          <span class="font-mono text-xs opacity-80">Origin Pivot</span>
          <span class="font-mono text-sm font-bold mt-1">${values.originX}% ${values.originY}%</span>
        </div>

        ${this.areGuidesVisible ? html`
          <div
            @pointerdown=${(event) => this.startXYPadDrag(pad, event)}
            style="left: ${handlePosition.left}%; top: ${handlePosition.top}%;"
            class="gizmo-handle absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-rose-500 border-2 border-white text-white shadow-lg flex items-center justify-center z-20"
            title="Drag Transform Origin Pin"
          >
            <i class="ph-fill ph-push-pin text-xs"></i>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderPerspectiveStage(pad, handlePosition, values, cssText) {
    return html`
      <div class="relative w-64 h-56 flex items-center justify-center">
        <div
          style="${cssText}"
          class="w-56 h-44 bg-gradient-to-tr from-slate-900 via-brand-700 to-indigo-500 text-white rounded-2xl shadow-2xl border border-white/30 flex flex-col items-center justify-center p-4 text-center select-none"
        >
          <i class="ph-duotone ph-cube text-3xl mb-1 text-indigo-200"></i>
          <div class="font-mono text-xs font-bold">3D Perspective Plane</div>
          <div class="font-mono text-[10px] opacity-80 mt-1">
            perspective: ${values.persp || 550}px
          </div>
        </div>

        ${this.areGuidesVisible ? html`
          <div
            @pointerdown=${(event) => this.startXYPadDrag(pad, event)}
            style="left: ${handlePosition.left}%; top: ${handlePosition.top}%;"
            class="gizmo-handle absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-brand-600 text-white font-mono text-[10px] font-bold shadow-lg flex items-center gap-1 ring-2 ring-white"
            title="Drag to tilt 3D plane"
          >
            <i class="ph-bold ph-arrows-out-cardinal"></i>
            <span>Drag 3D</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderAngleDialStage(engine, values, cssText) {
    const angleKey = engine.gizmoKeys.angle;
    const angleDegrees = values[angleKey] || 0;
    const handlePosition = computeDialHandlePosition(angleDegrees, ANGLE_DIAL_RADIUS_PERCENT);
    const minDegrees = engine.controls.find(control => control.key === angleKey)?.min ?? 0;

    return html`
      <div class="relative w-60 h-60 flex items-center justify-center">
        <div
          style="${cssText}"
          class="w-48 h-48 rounded-2xl shadow-xl border border-slate-200/80 flex flex-col items-center justify-center p-4 text-center bg-white text-slate-800"
        >
          <span class="font-mono text-xs font-semibold opacity-90">${engine.name}</span>
          <span class="font-mono text-lg font-bold mt-1 text-brand-600">${angleDegrees}deg</span>
        </div>

        ${this.areGuidesVisible ? html`
          <div class="absolute inset-0 rounded-full border border-dashed border-brand-400/70 pointer-events-none"></div>
          <div
            @pointerdown=${(event) => this.startDrag('angle-dial', { angleKey, min: minDegrees }, event)}
            style="left: ${handlePosition.left}%; top: ${handlePosition.top}%;"
            class="gizmo-handle absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-brand-600 border-2 border-white text-white shadow-lg flex items-center justify-center"
            title="Drag around dial to rotate angle"
          >
            <i class="ph-bold ph-arrows-clockwise text-xs"></i>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderMultiBoxShadowStage(values, cssText) {
    const layers = values.layers || [];
    const activeLayerIndex = getActiveLayerIndex(layers, values.activeLayerIdx);
    const activeLayer = layers[activeLayerIndex] || { x: 0, y: 16 };

    return html`
      <div class="relative w-64 h-56 flex items-center justify-center">
        <div
          style="${cssText}"
          class="w-52 h-40 bg-white rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center p-4 text-center transition-shadow"
        >
          <span class="font-mono text-xs font-bold text-slate-800">${layers.length} Shadow Layer${layers.length > 1 ? 's' : ''}</span>
          <span class="text-[11px] text-slate-500 mt-1">
            Active: Layer #${activeLayerIndex + 1} (${activeLayer.inset ? 'inset' : 'outer'})
          </span>
        </div>

        ${this.areGuidesVisible && layers[activeLayerIndex] ? this.renderShadowLayerHandle({
          layerIndex: activeLayerIndex,
          layer: activeLayer,
          iconClass: 'ph-sun',
          title: `Drag Layer #${activeLayerIndex + 1} Offset (${activeLayer.x}px, ${activeLayer.y}px)`
        }) : ''}
      </div>
    `;
  }

  renderMultiTextShadowStage(values, cssText) {
    const layers = values.layers || [];
    const activeLayerIndex = getActiveLayerIndex(layers, values.activeLayerIdx);
    const activeLayer = layers[activeLayerIndex] || { x: 2, y: 2 };

    return html`
      <div class="relative w-80 h-52 flex items-center justify-center">
        <div
          style="${cssText}"
          class="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 select-none text-center break-words max-w-full"
        >
          ${values.previewText || DEFAULT_PREVIEW_TEXT}
        </div>

        ${this.areGuidesVisible && layers[activeLayerIndex] ? this.renderShadowLayerHandle({
          layerIndex: activeLayerIndex,
          layer: activeLayer,
          iconClass: 'ph-arrows-out-cardinal',
          title: `Drag Layer #${activeLayerIndex + 1} Offset`
        }) : ''}
      </div>
    `;
  }

  renderShadowLayerHandle({ layerIndex, layer, iconClass, title }) {
    const left = convertToPercentOfRange(layer.x, SHADOW_OFFSET_RANGE_PX.min, SHADOW_OFFSET_RANGE_PX.max);
    const top = convertToPercentOfRange(layer.y, SHADOW_OFFSET_RANGE_PX.min, SHADOW_OFFSET_RANGE_PX.max);
    return html`
      <div
        @pointerdown=${(event) => this.startDrag('multi-shadow-layer', { layerIndex }, event)}
        style="left: ${left}%; top: ${top}%;"
        class="gizmo-handle absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-brand-600 text-white font-mono text-[10px] font-bold shadow-lg flex items-center gap-1 ring-2 ring-white"
        title="${title}"
      >
        <i class="ph-bold ${iconClass}"></i>
        <span>L#${layerIndex + 1}: ${layer.x}px, ${layer.y}px</span>
      </div>
    `;
  }

  renderMultiGradientStage(values, cssText) {
    const hasAngleHandle = values.type === 'linear' || values.type === 'conic';
    const hasCenterHandle = values.type === 'radial' || values.type === 'conic';

    return html`
      <div class="relative w-64 h-64 flex items-center justify-center">
        <div
          style="${cssText}"
          class="w-52 h-52 rounded-2xl shadow-xl border-2 border-white flex flex-col items-center justify-center p-4 text-center text-white relative overflow-hidden"
        >
          <span class="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-xs font-mono text-xs font-bold">
            ${values.repeating ? 'repeating-' : ''}${values.type}-gradient
          </span>
          <span class="px-2 py-0.5 rounded bg-black/25 font-mono text-[10px] mt-1">
            ${(values.stops || []).length} Color Stops
          </span>
        </div>

        ${this.areGuidesVisible && hasAngleHandle ? this.renderGradientAngleHandle(values.angle || 0) : ''}
        ${this.areGuidesVisible && hasCenterHandle ? this.renderGradientCenterHandle(values) : ''}
      </div>
    `;
  }

  renderGradientAngleHandle(angleDegrees) {
    const handlePosition = computeDialHandlePosition(angleDegrees, GRADIENT_DIAL_RADIUS_PERCENT);
    return html`
      <div class="absolute inset-0 rounded-full border border-dashed border-brand-400/70 pointer-events-none"></div>
      <div
        @pointerdown=${(event) => this.startDrag('angle-dial', { angleKey: 'angle', min: 0 }, event)}
        style="left: ${handlePosition.left}%; top: ${handlePosition.top}%;"
        class="gizmo-handle absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-brand-600 border-2 border-white text-white shadow-lg flex items-center justify-center"
        title="Drag Angle (${angleDegrees}deg)"
      >
        <i class="ph-bold ph-arrows-clockwise text-xs"></i>
      </div>
    `;
  }

  renderGradientCenterHandle(values) {
    return html`
      <div
        @pointerdown=${(event) => this.startXYPadDrag(GRADIENT_CENTER_PAD, event)}
        style="left: ${values.centerX}%; top: ${values.centerY}%;"
        class="gizmo-handle absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border-2 border-brand-600 text-brand-700 shadow-lg flex items-center justify-center"
        title="Drag Gradient Center (${values.centerX}% ${values.centerY}%)"
      >
        <i class="ph-bold ph-crosshair text-xs"></i>
      </div>
    `;
  }

  renderBackgroundPatternStage(values, cssText) {
    return html`
      <div class="relative w-72 h-52 rounded-2xl border-2 border-slate-300 shadow-inner bg-white overflow-hidden flex items-center justify-center"
           style="${cssText}">
        <div class="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-xs border border-slate-200 shadow-sm font-mono text-xs text-slate-800">
          ${values.sizeW}px × ${values.sizeH}px Tile
        </div>
      </div>
    `;
  }

  renderBlendModeStage(engine, values) {
    const activeMode = BLEND_MODES[values.modeIdx] || 'multiply';
    return html`
      <div class="relative w-72 h-56 rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden shadow-lg" style="isolation: isolate;">
        <div class="w-32 h-32 rounded-full bg-cyan-400 -translate-x-8 translate-y-2"></div>
        <div class="w-32 h-32 rounded-full bg-amber-400 translate-x-10 translate-y-4"></div>

        <div
          @pointerdown=${(event) => this.startXYPadDrag(engine.gizmoKeys, event)}
          style="mix-blend-mode: ${activeMode}; opacity: ${values.opacity}; transform: translate(${values.offsetX}px, ${values.offsetY}px);"
          class="gizmo-handle absolute w-36 h-36 rounded-2xl bg-rose-500 flex flex-col items-center justify-center text-white p-2 text-center shadow-lg border border-white/40"
          title="Drag Blended Layer"
        >
          <span class="font-mono text-xs font-bold uppercase">${activeMode}</span>
          <span class="text-[10px] opacity-90 mt-0.5">Drag Me</span>
        </div>
      </div>
    `;
  }

  handlePolygonDoubleClick(event, values) {
    if (values.mode !== 'polygon') return;
    if (event.target.closest('.gizmo-handle')) return;
    const box = event.currentTarget.getBoundingClientRect();
    const clickedVertex = {
      x: Math.round(clampToRange(((event.clientX - box.left) / box.width) * 100, PERCENT_RANGE.min, PERCENT_RANGE.max)),
      y: Math.round(clampToRange(((event.clientY - box.top) / box.height) * 100, PERCENT_RANGE.min, PERCENT_RANGE.max))
    };
    this.emitValueChanges({ points: insertVertexAtNearestEdge(values.points || [], clickedVertex) });
  }

  renderClipPolygonStage(values, cssText) {
    const points = values.points || [];
    const isPolygonMode = values.mode === 'polygon';
    const isCircularMode = values.mode === 'circle' || values.mode === 'ellipse';

    return html`
      <div class="flex flex-col items-center gap-2">
        <div
          @dblclick=${(event) => this.handlePolygonDoubleClick(event, values)}
          class="relative w-64 h-64 flex items-center justify-center cursor-crosshair select-none"
          title="Double-click anywhere on the box to insert a new vertex!"
        >
          <div class="absolute inset-0 border border-dashed border-slate-300 bg-slate-100/60 rounded-lg pointer-events-none"></div>

          ${this.areGuidesVisible && isPolygonMode ? this.renderPolygonOutline(points) : ''}

          <div
            style="${cssText}"
            class="w-full h-full bg-gradient-to-tr from-brand-600 via-indigo-500 to-emerald-400 flex flex-col items-center justify-center text-white p-4 text-center shadow-lg"
          >
            <span class="font-mono text-xs font-bold uppercase tracking-wider">
              ${isPolygonMode ? `${points.length}-Point Polygon` : `clip-path: ${values.mode}()`}
            </span>
            <span class="text-[10px] opacity-90 mt-1">
              ${isPolygonMode ? 'Drag vertices or dbl-click to add point' : 'Use controls or drag center'}
            </span>
          </div>

          ${this.areGuidesVisible && isPolygonMode ? points.map((point, index) => this.renderVertexHandle(point, index)) : ''}
          ${this.areGuidesVisible && isCircularMode ? this.renderClipCenterHandle(values) : ''}
        </div>
      </div>
    `;
  }

  renderPolygonOutline(points) {
    const svgPolygonPoints = points.map(point => `${point.x},${point.y}`).join(' ');
    return html`
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
        <polygon
          points="${svgPolygonPoints}"
          fill="none"
          stroke="#009d8e"
          stroke-width="1.2"
          stroke-dasharray="3 2"
        />
      </svg>
    `;
  }

  renderVertexHandle(point, index) {
    return html`
      <div
        @pointerdown=${(event) => this.startDrag('dynamic-polygon-vertex', { index }, event)}
        style="left: ${point.x}%; top: ${point.y}%;"
        class="gizmo-handle absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-brand-600 text-[10px] font-mono font-bold text-brand-700 shadow-md flex items-center justify-center z-20 hover:bg-brand-600 hover:text-white"
        title="Vertex #${index + 1} (${point.x}%, ${point.y}%) — Drag to move"
      >
        ${index + 1}
      </div>
    `;
  }

  renderClipCenterHandle(values) {
    return html`
      <div
        @pointerdown=${(event) => this.startXYPadDrag(CLIP_CENTER_PAD, event)}
        style="left: ${values.circleX}%; top: ${values.circleY}%;"
        class="gizmo-handle absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border-2 border-brand-600 text-brand-700 shadow-lg flex items-center justify-center z-20"
        title="Drag Center (${values.circleX}% ${values.circleY}%)"
      >
        <i class="ph-bold ph-crosshair text-xs"></i>
      </div>
    `;
  }

  renderShapeOutsideStage(values) {
    const circleShape = `circle(${values.radius}% at ${values.cx}% ${values.cy}%)`;
    return html`
      <div class="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div
          @pointerdown=${(event) => this.startXYPadDrag(SHAPE_OUTSIDE_CENTER_PAD, event)}
          style="float: left; width: ${values.floatBoxSize}px; height: ${values.floatBoxSize}px; shape-outside: ${circleShape}; shape-margin: ${values.shapeMargin}px; clip-path: ${circleShape};"
          class="gizmo-handle bg-gradient-to-br from-brand-600 to-rose-500 text-white flex flex-col items-center justify-center p-3 text-center shadow-md"
          title="Drag circle center to reflow editorial text!"
        >
          <span class="font-mono text-[10px] font-bold">Drag Shape</span>
          <span class="font-mono text-[9px] opacity-85">margin: ${values.shapeMargin}px</span>
        </div>
        <p class="text-xs text-slate-700 leading-relaxed text-justify">
          With <strong>shape-outside</strong> and <strong>shape-margin</strong>, continuous editorial prose flows organically around circular, elliptical, or polygonal float contours instead of colliding with a rigid rectangular box. Drag the floated orb on the left or scrub its radius and shape-margin to watch every line of typography reflow in real time!
        </p>
      </div>
    `;
  }

  renderMaskStage(cssText) {
    return html`
      <div class="relative w-72 h-52 rounded-2xl scenery-backdrop p-4 flex items-center justify-center border border-slate-200 shadow-inner">
        <div
          style="${cssText}"
          class="w-full h-full bg-slate-900 text-white rounded-xl p-4 flex flex-col justify-between shadow-lg"
        >
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs font-bold text-indigo-300">mask-image Card</span>
            <span class="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded">Alpha Mask</span>
          </div>
          <p class="text-xs text-slate-300 leading-snug">
            Notice how the dark card dissolves smoothly into the colorful backdrop underneath according to your mask gradient stops!
          </p>
        </div>
      </div>
    `;
  }

  renderBackdropLensStage(engine, values, cssText) {
    return html`
      <div class="relative w-80 h-60 rounded-2xl scenery-backdrop overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center select-none">
        <div class="absolute top-5 left-6 w-20 h-20 rounded-full bg-rose-500 shadow-lg"></div>
        <div class="absolute bottom-5 right-8 w-24 h-24 rounded-2xl rotate-12 bg-indigo-600 shadow-lg"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-black tracking-tight text-slate-900/80">
          REFRACTION
        </div>

        <div
          @pointerdown=${(event) => this.startXYPadDrag(engine.gizmoKeys, event)}
          style="${cssText} transform: translate(${values.lensX}px, ${values.lensY}px);"
          class="gizmo-handle w-52 h-36 rounded-2xl border border-white/70 shadow-xl flex flex-col items-center justify-center p-4 text-center z-10"
          title="Drag this frosted glass lens around!"
        >
          <i class="ph-duotone ph-sparkle text-brand-700 text-xl mb-1"></i>
          <div class="font-mono text-xs font-bold text-slate-900">Drag Glass Card</div>
          <div class="font-mono text-[10px] text-slate-700 mt-0.5">
            blur(${values.blur}px) saturate(${values.saturate}%)
          </div>
        </div>
      </div>
    `;
  }

  renderFilterStage(values, cssText) {
    return html`
      <div class="flex flex-col items-center gap-2">
        <div
          style="${cssText}"
          class="w-72 h-48 rounded-2xl overflow-hidden border-2 border-white shadow-xl scenery-backdrop flex flex-col items-center justify-center p-4 text-center relative"
        >
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-rose-500 text-white flex items-center justify-center shadow-md mb-2">
            <i class="ph-fill ph-palette text-3xl"></i>
          </div>
          <div class="font-bold text-slate-900 text-base">Optical Shader Pipeline</div>
          <div class="font-mono text-[11px] text-slate-700">
            hue(${values.hue}deg) contrast(${values.contrast}%)
          </div>
        </div>
      </div>
    `;
  }

  renderTypographyStage(values, cssText) {
    return html`
      <div class="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
        ${this.areGuidesVisible ? html`
          <div class="flex items-center justify-between text-[10px] font-mono text-brand-600 mb-2 pb-1.5 border-b border-dashed border-brand-200">
            <span>size: ${values.fontSize}px</span>
            <span>line-height: ${values.lineHeight}</span>
            <span>tracking: ${values.letterSpacing}em</span>
          </div>
        ` : ''}
        <p
          style="${cssText}"
          class="text-slate-900 font-semibold transition-all ${this.areGuidesVisible ? 'bg-[linear-gradient(to_bottom,transparent_95%,rgba(99,102,241,0.22)_95%)] bg-[length:100%_1.5em]' : ''}"
        >
          Good typography is invisible; great typography speaks with mathematical clarity and effortless rhythm.
        </p>
      </div>
    `;
  }

  renderVariableFontStage(engine, values, cssText) {
    const axes = engine.gizmoKeys;
    const { left: leftBounds, top: topBounds } = VARIABLE_FONT_HANDLE_BOUNDS_PERCENT;
    const handleLeft = clampToRange(convertToPercentOfRange(values.wght, axes.xMin, axes.xMax), leftBounds.min, leftBounds.max);
    const handleTop = clampToRange(convertToPercentOfRange(values.slnt, axes.yMin, axes.yMax), topBounds.min, topBounds.max);
    return html`
      <div class="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
        <div class="text-[10px] font-mono text-slate-400 mb-2">
          "wght" ${values.wght} | "slnt" ${values.slnt}deg
        </div>
        <div style="${cssText}" class="text-slate-900 select-none py-2">
          Variable Typography
        </div>
        ${this.areGuidesVisible ? html`
          <div
            @pointerdown=${(event) => this.startXYPadDrag(axes, event)}
            style="left: ${handleLeft}%; top: ${handleTop}%;"
            class="gizmo-handle absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-brand-600 text-white font-mono text-[10px] shadow-lg flex items-center gap-1"
            title="Drag X for Weight (100-900), Y for Slant"
          >
            <i class="ph-bold ph-text-aa"></i>
            <span>Drag Axes</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderUnderlineStage(values, cssText) {
    return html`
      <div class="bg-white border border-slate-200 rounded-2xl px-8 py-10 shadow-sm text-center">
        <span style="${cssText}" class="text-3xl font-bold text-slate-900">
          Typography & Descenders (g, j, p, y)
        </span>
        <div class="text-xs font-mono text-slate-400 mt-4">
          Notice how native underline interacts with descenders at offset ${values.offset}px
        </div>
      </div>
    `;
  }

  renderLineClampStage(values, cssText) {
    return html`
      <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div class="text-[10px] font-mono text-brand-600 font-bold mb-2">
          -webkit-line-clamp: ${values.lines} | width: ${values.boxWidth}px
        </div>
        <p style="${cssText} font-size: ${values.fontSize}px;" class="text-slate-700 leading-relaxed">
          Design systems rely on predictable card heights across responsive viewports. With -webkit-line-clamp, long user-generated descriptions or article titles automatically truncate with a clean ellipsis at the exact line boundary you specify without requiring JavaScript string slicing.
        </p>
      </div>
    `;
  }

  renderColumnsStage(cssText) {
    return html`
      <div
        style="${cssText}"
        class="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-xs text-slate-700 leading-relaxed text-justify"
      >
        CSS Multi-column layout automatically flows continuous editorial prose into balanced vertical columns. Designers can adjust column-count, column-gap, and column-rule-width to craft responsive magazine spreads without splitting DOM nodes manually.
      </div>
    `;
  }

  renderFlexStage(values) {
    const items = values.items || [];
    const selectedIndex = values.selectedIdx ?? 0;

    return html`
      <div class="flex flex-col items-center w-full">
        <div class="text-[11px] font-mono text-slate-500 mb-2 flex items-center gap-3">
          <span>Width: <strong class="text-brand-600">${values.containerW}px</strong></span>
          <span>gap: <strong class="text-brand-600">${values.gap}px</strong></span>
          <span class="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200">Click any item to edit</span>
        </div>
        <div
          style="width: ${values.containerW}px; gap: ${values.gap}px; justify-content: ${values.justify}; align-items: ${values.align}; flex-wrap: ${values.wrap};"
          class="max-w-full min-h-[110px] bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-3 flex transition-all"
        >
          ${items.map((item, index) => this.renderFlexItem(item, index, index === selectedIndex))}
        </div>
      </div>
    `;
  }

  renderFlexItem(item, index, isSelected) {
    return html`
      <button
        @click=${() => this.emitValueChanges({ selectedIdx: index })}
        style="flex: ${item.grow} ${item.shrink} ${item.basis}px;"
        class="rounded-xl p-2.5 text-center flex flex-col justify-center transition cursor-pointer ${
          isSelected
            ? 'bg-brand-600 text-white shadow-md ring-2 ring-brand-300'
            : 'bg-white hover:bg-brand-50 border border-slate-200 text-slate-700'
        }"
      >
        <div class="text-[10px] font-mono ${isSelected ? 'text-brand-100' : 'text-slate-400'}">
          #${index + 1} ${item.label}
        </div>
        <div class="text-xs font-mono font-bold mt-0.5">
          ${item.grow} ${item.shrink} ${item.basis}px
        </div>
      </button>
    `;
  }

  renderGridStage(values) {
    const columns = values.cols || FALLBACK_GRID_COLUMNS;
    const cells = values.cells || [];
    const selectedIndex = values.selectedCellIdx ?? 0;

    return html`
      <div class="w-full max-w-md">
        <div class="flex justify-between text-[11px] font-mono text-brand-600 mb-1.5 px-1">
          ${columns.map((fraction, columnIndex) => html`<span>Col #${columnIndex + 1}: ${fraction}fr</span>`)}
        </div>
        <div
          style="display: grid; grid-template-columns: ${columns.map(fraction => `${fraction}fr`).join(' ')}; grid-auto-flow: ${values.dense ? 'row dense' : 'row'}; gap: ${values.rowGap}px ${values.colGap}px;"
          class="bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-3"
        >
          ${cells.map((cell, index) => this.renderGridCell(cell, index, index === selectedIndex, columns.length))}
        </div>
      </div>
    `;
  }

  renderGridCell(cell, index, isSelected, columnCount) {
    return html`
      <button
        @click=${() => this.emitValueChanges({ selectedCellIdx: index })}
        style="grid-column: span ${Math.min(columnCount, cell.colSpan)}; grid-row: span ${cell.rowSpan};"
        class="rounded-xl p-3 text-center font-mono transition cursor-pointer flex flex-col items-center justify-center min-h-[54px] ${
          isSelected
            ? 'bg-brand-600 text-white shadow-md ring-2 ring-brand-300'
            : 'bg-white hover:bg-brand-50 border border-slate-200 text-slate-700'
        }"
      >
        <span class="text-xs font-bold">${cell.name}</span>
        <span class="text-[10px] opacity-80 mt-0.5">
          col:${cell.colSpan} × row:${cell.rowSpan}
        </span>
      </button>
    `;
  }

  renderBezierStage(values) {
    const start = mapToBezierGraph(0, 0);
    const control1 = mapToBezierGraph(values.x1, values.y1);
    const control2 = mapToBezierGraph(values.x2, values.y2);
    const end = mapToBezierGraph(1, 1);
    const timingFunction = `cubic-bezier(${values.x1}, ${values.y1}, ${values.x2}, ${values.y2})`;

    return html`
      <div class="flex flex-col sm:flex-row items-center gap-5">
        <div class="relative bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
          <svg width=${BEZIER_GRAPH.sizePx} height=${BEZIER_GRAPH.sizePx} class="overflow-visible select-none">
            <rect x=${BEZIER_GRAPH.left} y=${BEZIER_GRAPH.bottom - BEZIER_GRAPH.height} width=${BEZIER_GRAPH.width} height=${BEZIER_GRAPH.height} fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
            <line x1=${start.x} y1=${start.y} x2=${end.x} y2=${end.y} stroke="#cbd5e1" stroke-dasharray="4 4" stroke-width="1.5" />
            <line x1=${start.x} y1=${start.y} x2=${control1.x} y2=${control1.y} stroke="#f43f5e" stroke-width="2" />
            <line x1=${end.x} y1=${end.y} x2=${control2.x} y2=${control2.y} stroke="#009d8e" stroke-width="2" />
            <path
              d="M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}"
              fill="none"
              stroke="#0f172a"
              stroke-width="3"
              stroke-linecap="round"
            />
            ${this.renderBezierHandle(control1, { xKey: 'x1', yKey: 'y1' }, '#f43f5e')}
            ${this.renderBezierHandle(control2, { xKey: 'x2', yKey: 'y2' }, '#4f46e5')}
          </svg>
        </div>

        ${this.renderBezierRace(values.duration, timingFunction)}
      </div>
    `;
  }

  renderBezierHandle(graphPoint, valueKeys, fillColor) {
    return html`
      <circle
        @pointerdown=${(event) => this.startDrag('bezier-point', valueKeys, event)}
        cx=${graphPoint.x}
        cy=${graphPoint.y}
        r=${BEZIER_GRAPH.handleRadius}
        fill=${fillColor}
        stroke="#ffffff"
        stroke-width="2"
        class="gizmo-handle"
      />
    `;
  }

  renderBezierRace(durationMs, timingFunction) {
    const raceOffset = this.isBezierRaceRunning ? `${BEZIER_RACE_DISTANCE_PX}px` : '0px';
    return html`
      <div class="w-56 space-y-3">
        <button
          @click=${() => { this.isBezierRaceRunning = !this.isBezierRaceRunning; }}
          class="w-full py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition"
        >
          <i class="ph-fill ph-play"></i>
          <span>Trigger Transition Race</span>
        </button>

        <div class="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
          <div>
            <div class="text-[10px] font-mono text-brand-700 font-semibold mb-1">Custom Bezier (${durationMs}ms)</div>
            <div class="w-full bg-slate-100 rounded-full h-7 p-1 relative overflow-hidden">
              <div
                style="transition: transform ${durationMs}ms ${timingFunction}; transform: translateX(${raceOffset});"
                class="w-5 h-5 rounded-full bg-brand-600 shadow"
              ></div>
            </div>
          </div>
          <div>
            <div class="text-[10px] font-mono text-slate-400 mb-1">Linear Reference</div>
            <div class="w-full bg-slate-100 rounded-full h-7 p-1 relative overflow-hidden">
              <div
                style="transition: transform ${durationMs}ms linear; transform: translateX(${raceOffset});"
                class="w-5 h-5 rounded-full bg-slate-400"
              ></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderKeyframesStage(values) {
    return html`
      <div class="flex flex-col items-center gap-4">
        <style>
          @keyframes liveStudioKeyframes {
            0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); }
            50% { transform: translateY(${values.midY}px) scale(${values.midScale}) rotate(${values.midRotate}deg); }
          }
        </style>
        <div
          style="animation: liveStudioKeyframes ${values.duration}ms ease-in-out infinite; animation-play-state: ${values.paused ? 'paused' : 'running'};"
          class="w-44 h-28 rounded-2xl bg-gradient-to-tr from-brand-600 to-violet-500 text-white shadow-xl flex flex-col items-center justify-center p-4 text-center"
        >
          <i class="ph-fill ph-sparkle text-2xl mb-1"></i>
          <span class="font-mono text-xs font-bold">@keyframes 50%</span>
          <span class="font-mono text-[10px] opacity-85">
            Y:${values.midY}px | S:${values.midScale}
          </span>
        </div>
      </div>
    `;
  }

  renderMotionPathStage(values) {
    const { start, end, widthPx, heightPx } = MOTION_PATH_STAGE;
    const controlX = values.curveX ?? MOTION_PATH_STAGE.defaultControlX;
    const controlY = values.curvePeak ?? MOTION_PATH_STAGE.defaultControlY;
    const pathData = `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
    return html`
      <div class="relative w-80 h-44 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <svg width=${widthPx} height=${heightPx} class="absolute inset-0 pointer-events-none">
          <line x1=${start.x} y1=${start.y} x2=${controlX} y2=${controlY} stroke="#cbd5e1" stroke-dasharray="3 3" />
          <line x1=${end.x} y1=${end.y} x2=${controlX} y2=${controlY} stroke="#cbd5e1" stroke-dasharray="3 3" />
          <path d=${pathData} fill="none" stroke="#05c3ad" stroke-width="2.5" stroke-dasharray="6 4" />
          <circle cx=${start.x} cy=${start.y} r="5" fill="#94a3b8" />
          <circle cx=${end.x} cy=${end.y} r="5" fill="#10b981" />
        </svg>
        <div
          style="offset-path: path('${pathData}'); offset-distance: ${values.distance}%; offset-rotate: auto ${values.rotateOffset}deg;"
          class="w-9 h-9 -ml-4 -mt-4 rounded-xl bg-brand-600 text-white shadow-lg flex items-center justify-center"
        >
          <i class="ph-fill ph-paper-plane-right text-lg"></i>
        </div>
        ${this.areGuidesVisible ? html`
          <div
            @pointerdown=${(event) => this.startXYPadDrag(MOTION_PATH_CONTROL_PAD, event)}
            style="left: ${(controlX / widthPx) * 100}%; top: ${(controlY / heightPx) * 100}%;"
            class="gizmo-handle absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-rose-500 border-2 border-white shadow"
            title="Drag Path Curve Control Point"
          ></div>
        ` : ''}
        <div class="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] font-mono text-slate-500">
          <span>0% Start</span>
          <span class="text-brand-700 font-bold">offset-distance: ${values.distance}%</span>
          <span>100% End</span>
        </div>
      </div>
    `;
  }

  renderScrollOffsetStage(values) {
    const totalOffsetPx = values.scrollPadTop + values.scrollMarTop;
    const isTargetCovered = totalOffsetPx < values.headerH;
    return html`
      <div class="w-80 h-56 bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-md relative flex flex-col">
        <div
          style="height: ${values.headerH}px;"
          class="w-full bg-slate-900/90 backdrop-blur text-white px-4 flex items-center justify-between text-xs font-semibold z-20 shrink-0"
        >
          <span>Sticky Header (${values.headerH}px)</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono ${isTargetCovered ? 'bg-rose-500/30 text-rose-200' : 'bg-emerald-500/30 text-emerald-200'}">
            ${isTargetCovered ? 'Overlaps Target!' : 'Clears Cleanly'}
          </span>
        </div>

        ${this.areGuidesVisible && values.scrollPadTop > 0 ? html`
          <div
            style="height: ${values.scrollPadTop}px;"
            class="absolute top-0 left-0 right-0 bg-emerald-400/20 border-b-2 border-dashed border-emerald-500 z-10 pointer-events-none flex items-end justify-end px-2 pb-0.5"
          >
            <span class="text-[9px] font-mono font-bold text-emerald-800">scroll-padding-top: ${values.scrollPadTop}px</span>
          </div>
        ` : ''}

        <div class="flex-1 bg-slate-50 relative overflow-hidden">
          <div
            style="transform: translateY(${totalOffsetPx - values.headerH}px);"
            class="p-4 transition-transform"
          >
            <div class="bg-brand-50 border-2 border-brand-500 rounded-xl p-3">
              <div class="font-mono text-xs font-bold text-brand-900">#target-section Heading</div>
              <p class="text-[11px] text-slate-600 mt-1">
                Snapped at ${totalOffsetPx}px from top of viewport.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderZIndexStage(values) {
    return html`
      <div class="relative w-72 h-56 flex items-center justify-center">
        <div
          style="${values.explode ? 'transform: perspective(700px) rotateX(24deg) rotateY(-24deg); transform-style: preserve-3d;' : ''}"
          class="relative w-44 h-32 transition-transform duration-500"
        >
          ${Z_INDEX_CARDS.map(card => this.renderZIndexCard(card, values[card.valueKey]))}
        </div>
      </div>
    `;
  }

  renderZIndexCard(card, zIndex) {
    return html`
      <div
        style="z-index: ${zIndex};"
        class="absolute inset-0 ${card.colorClasses} ${card.offsetClasses} rounded-2xl shadow-xl border-2 border-white/80 p-3 flex flex-col justify-between transition-all"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold">${card.label}</span>
          <span class="px-2 py-0.5 rounded bg-black/25 font-mono text-xs font-bold">z: ${zIndex}</span>
        </div>
        <div class="text-[10px] font-mono opacity-85">position: relative</div>
      </div>
    `;
  }
}
customElements.define('visual-stage', VisualStage);
