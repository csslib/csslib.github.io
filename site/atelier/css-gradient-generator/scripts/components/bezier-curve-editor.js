// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, svg, nothing } from 'lit';
import { EASING_PRESETS, Easing } from '../color/easing.js';
import { WindowPointerDragElement } from './window-pointer-drag-element.js';
import { BEZIER_PLOT, STEP_BANDS } from '../config/constants.js';
import { buildBezierCurvePath, buildSteppedCurvePath, toCurvePadX, toCurvePadY, toNormalizedCurvePoint } from '../curves/curve-paths.js';
import { roundTo } from '../utils/angle-math.js';

const BEZIER_GRID_FRACTIONS = [0.25, 0.5, 0.75];
const EDITOR_DEFAULT_SAMPLES_PER_SEGMENT = 12;

class BezierCurveEditor extends WindowPointerDragElement {
  static properties = {
    easing: { type: Object },
    activeHandle: { type: String, state: true }
  };

  constructor() {
    super();
    this.activeHandle = null;
  }

  _startHandleDrag(handleName, event) {
    event.preventDefault();
    event.stopPropagation();
    this.activeHandle = handleName;
  }

  _handleWindowPointerMove(event) {
    if (!this.activeHandle) return;
    const curvePad = this.querySelector('.bezier-svg-pad');
    if (!curvePad) return;
    const handlePoint = toNormalizedCurvePoint(event, curvePad.getBoundingClientRect());

    const nextEasing = structuredClone(this.easing);
    nextEasing.mode = 'custom';
    const handleKey = this.activeHandle === 'p1' ? 'p1' : 'p2';
    nextEasing[handleKey] = [roundTo(handlePoint.x, 2), roundTo(handlePoint.y, 2)];
    this._emitEasingChange(nextEasing);
  }

  _handleWindowPointerUp() {
    this.activeHandle = null;
  }

  _selectPreset(presetKey) {
    const preset = EASING_PRESETS[presetKey];
    if (!preset) return;
    this._emitEasingChange({
      ...structuredClone(this.easing),
      mode: presetKey,
      p1: [...preset.p1],
      p2: [...preset.p2]
    });
  }

  _updateNumericField(field, value) {
    this._emitEasingChange({
      ...structuredClone(this.easing),
      [field]: Number(value)
    });
  }

  _emitEasingChange(nextEasing) {
    this._emit('easing-change', { easing: nextEasing });
  }

  render() {
    if (!this.easing) return nothing;
    const isStepped = this.easing.mode === 'steps';

    return html`
      <div class="space-y-3">
        ${this._renderPresetGrid()}
        ${this._renderCurvePad(isStepped)}
        ${isStepped ? this._renderBandCountSlider() : this._renderPrecisionSlider()}
      </div>
    `;
  }

  _renderPresetGrid() {
    return html`
        <div class="grid grid-cols-2 gap-1.5">
          ${Object.entries(EASING_PRESETS).map(([presetKey, preset]) => {
            const isActive = this.easing.mode === presetKey;
            return html`
              <button
                type="button"
                @click=${() => this._selectPreset(presetKey)}
                class="px-2.5 py-1.5 text-xs font-medium rounded-lg border text-left transition-all flex items-center justify-between ${
                  isActive
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                    : 'bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-slate-100'
                }"
              >
                <span class="truncate">${preset.label}</span>
                ${isActive ? html`<i class="ph-fill ph-check-circle text-indigo-600"></i>` : nothing}
              </button>
            `;
          })}
        </div>
    `;
  }

  _renderCurvePad(isStepped) {
    const handle1 = this.easing.p1 || EASING_PRESETS.linear.p1;
    const handle2 = this.easing.p2 || EASING_PRESETS.linear.p2;
    const [x1, y1] = handle1;
    const [x2, y2] = handle2;
    const curvePath = isStepped
      ? buildSteppedCurvePath(Easing.countStepBands(this.easing))
      : buildBezierCurvePath(handle1, handle2);
    const { originX, originY, width, height } = BEZIER_PLOT;

    return html`
        <div class="relative rounded-lg border border-slate-200 bg-slate-50/70 p-2">
          <div class="flex items-center justify-between px-1 pb-1">
            <span class="text-[11px] font-mono text-slate-500">
              ${isStepped
                ? `steps(${this.easing.steps || STEP_BANDS.default}, jump-none)`
                : `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`}
            </span>
            <span class="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              ${isStepped ? 'Posterized' : 'Drag P1 / P2'}
            </span>
          </div>

          <svg
            viewBox="0 0 200 140"
            class="bezier-svg-pad w-full h-36 select-none overflow-visible cursor-crosshair"
          >
            <rect x=${originX} y=${originY} width=${width} height=${height} rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
            ${BEZIER_GRID_FRACTIONS.map(fraction => svg`
              <line x1=${toCurvePadX(fraction)} y1=${originY} x2=${toCurvePadX(fraction)} y2=${originY + height} stroke="#F1F5F9" stroke-width="1" />
              <line x1=${originX} y1=${toCurvePadY(fraction)} x2=${originX + width} y2=${toCurvePadY(fraction)} stroke="#F1F5F9" stroke-width="1" />
            `)}
            <line x1=${toCurvePadX(0)} y1=${toCurvePadY(0)} x2=${toCurvePadX(1)} y2=${toCurvePadY(1)} stroke="#CBD5E1" stroke-dasharray="3 3" stroke-width="1.2" />

            <path d=${curvePath} fill="none" stroke="#c0249c" stroke-width="2.75" stroke-linecap="round" />

            ${isStepped ? nothing : this._renderCurveHandles(handle1, handle2)}
          </svg>
        </div>
    `;
  }

  _renderCurveHandles([x1, y1], [x2, y2]) {
    return svg`
              <line x1=${toCurvePadX(0)} y1=${toCurvePadY(0)} x2=${toCurvePadX(x1)} y2=${toCurvePadY(y1)} stroke="#dc43bb" stroke-width="1.25" stroke-dasharray="2 2" />
              <line x1=${toCurvePadX(1)} y1=${toCurvePadY(1)} x2=${toCurvePadX(x2)} y2=${toCurvePadY(y2)} stroke="#EC4899" stroke-width="1.25" stroke-dasharray="2 2" />

              <g class="cursor-grab" @pointerdown=${(event) => this._startHandleDrag('p1', event)}>
                <circle cx=${toCurvePadX(x1)} cy=${toCurvePadY(y1)} r="10" fill="rgba(192, 36, 156, 0.12)" />
                <circle cx=${toCurvePadX(x1)} cy=${toCurvePadY(y1)} r="5.5" fill="#FFFFFF" stroke="#c0249c" stroke-width="2.5" />
              </g>

              <g class="cursor-grab" @pointerdown=${(event) => this._startHandleDrag('p2', event)}>
                <circle cx=${toCurvePadX(x2)} cy=${toCurvePadY(y2)} r="10" fill="rgba(236, 72, 153, 0.12)" />
                <circle cx=${toCurvePadX(x2)} cy=${toCurvePadY(y2)} r="5.5" fill="#FFFFFF" stroke="#EC4899" stroke-width="2.5" />
              </g>
            `;
  }

  _renderBandCountSlider() {
    const bandCount = this.easing.steps || STEP_BANDS.default;
    return html`
          <div class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="font-medium text-slate-600">Step Bands Count</span>
              <span class="font-mono font-semibold text-slate-900">${bandCount} bands</span>
            </div>
            <input
              type="range"
              min="2"
              max="16"
              step="1"
              .value=${String(bandCount)}
              @input=${(event) => this._updateNumericField('steps', event.target.value)}
              class="studio-slider w-full"
            />
          </div>
    `;
  }

  _renderPrecisionSlider() {
    const samplesPerSegment = this.easing.samples || EDITOR_DEFAULT_SAMPLES_PER_SEGMENT;
    return html`
          <div class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="font-medium text-slate-600" title="Number of intermediate perceptual color stops synthesized per segment">
                Compiled Spline Precision
              </span>
              <span class="font-mono font-semibold text-slate-900">${samplesPerSegment} stops/seg</span>
            </div>
            <input
              type="range"
              min="4"
              max="24"
              step="2"
              .value=${String(samplesPerSegment)}
              @input=${(event) => this._updateNumericField('samples', event.target.value)}
              class="studio-slider w-full"
            />
          </div>
    `;
  }
}
customElements.define('bezier-curve-editor', BezierCurveEditor);
