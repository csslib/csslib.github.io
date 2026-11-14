// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, nothing } from 'lit';
import { ColorMath } from '../color/color-math.js';
import { GradientFieldCompiler } from '../compiler/gradient-field-compiler.js';
import { WindowPointerDragElement } from './window-pointer-drag-element.js';
import { PANEL_HEADER_CLASS, PERCENT } from '../config/constants.js';
import { buildBridgePreviewBackground, buildFalloffTrackBackground } from '../curves/curve-paths.js';
import { CONTROL_DEFAULTS } from '../data/field-options.js';
import { roundTo } from '../utils/angle-math.js';

const FALLOFF_TRACK_LIMITS = { maxHardness: 80, minMidpointSpan: 10, minMidpoint: 0.1, maxMidpoint: 0.9 };

const HARMONY_OPTIONS = [
  { id: 'analogous', label: 'Analogous' },
  { id: 'complementary', label: 'Dipole' },
  { id: 'triadic', label: 'Triadic' },
  { id: 'split', label: 'Split-Comp' },
  { id: 'golden', label: 'Golden φ' }
];

class ControlGradientTrack extends WindowPointerDragElement {
  static properties = {
    control: { type: Object },
    allControls: { type: Array },
    globals: { type: Object },
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
    if (!this.activeHandle || !this.control) return;
    const track = this.querySelector('.control-radial-bar');
    if (!track) return;
    const trackRect = track.getBoundingClientRect();
    const pointerPercent = ColorMath.clamp(((event.clientX - trackRect.left) / trackRect.width) * PERCENT, 0, PERCENT);

    if (this.activeHandle === 'hardness') {
      this._emitControlUpdate({ hardness: Math.round(ColorMath.clamp(pointerPercent, 0, FALLOFF_TRACK_LIMITS.maxHardness)) });
    } else if (this.activeHandle === 'midpoint') {
      this._emitControlUpdate({ midpoint: roundTo(this._midpointAtPercent(pointerPercent), 2) });
    }
  }

  _midpointAtPercent(pointerPercent) {
    const hardness = this.control.hardness ?? CONTROL_DEFAULTS.hardness;
    const falloffSpan = Math.max(FALLOFF_TRACK_LIMITS.minMidpointSpan, PERCENT - hardness);
    return ColorMath.clamp((pointerPercent - hardness) / falloffSpan, FALLOFF_TRACK_LIMITS.minMidpoint, FALLOFF_TRACK_LIMITS.maxMidpoint);
  }

  _handleWindowPointerUp() {
    this.activeHandle = null;
  }

  _emitControlUpdate(patch) {
    if (!this.control) return;
    this._emit('control-update', { id: this.control.id, patch });
  }

  _requestHarmony(harmonyType) {
    this._emit('apply-harmony', { harmonyType });
  }

  _sceneContext() {
    return { allControls: this.allControls, globals: this.globals, isNaiveSrgb: false };
  }

  render() {
    if (!this.control) return nothing;
    const neighbor = GradientFieldCompiler.findNearestNeighbor(this.control, this.allControls);

    return html`
      <section class="border-b border-slate-200">
        ${this._renderHeader()}
        <div class="p-3.5 space-y-3">
          ${this._renderHarmonyBar()}
          ${this._renderFalloffTrack()}
          ${neighbor ? this._renderNeighborBridge(neighbor) : nothing}
        </div>
      </section>
    `;
  }

  _renderHeader() {
    return html`
        <div class=${PANEL_HEADER_CLASS}>
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="w-2.5 h-2.5 shrink-0 rounded-full border border-black/15" style="background: ${this.control.color}"></span>
            <h3 class="min-w-0 text-[11px] leading-snug font-semibold uppercase tracking-wider text-slate-700">
              ${this.control.name} — Core-to-Boundary Falloff Track
            </h3>
          </div>
        </div>
    `;
  }

  _renderHarmonyBar() {
    return html`
          <div class="flex flex-wrap items-center gap-1">
            <span class="text-[11px] font-medium text-slate-500 mr-1 flex items-center gap-1">
              <i class="ph-duotone ph-magic-wand text-indigo-600"></i> Harmonize All Controls:
            </span>
            ${HARMONY_OPTIONS.map(harmony => html`
              <button
                type="button"
                @click=${() => this._requestHarmony(harmony.id)}
                class="px-2 py-1 text-[11px] font-medium rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200/80 transition-colors"
                title="Harmonize all canvas control points around ${this.control.name} using ${harmony.label} OKLCH math"
              >
                ${harmony.label}
              </button>
            `)}
          </div>
    `;
  }

  _renderFalloffTrack() {
    const trackBackground = buildFalloffTrackBackground(this.control, this._sceneContext());
    const hardness = this.control.hardness ?? CONTROL_DEFAULTS.hardness;
    const midpoint = this.control.midpoint ?? CONTROL_DEFAULTS.midpoint;
    const midpointPercent = hardness + (PERCENT - hardness) * midpoint;
    const midpointLabel = Math.round(midpoint * PERCENT);

    return html`
        <div class="relative pt-2 px-3">
          <div class="relative h-5 mb-1">
            <button
              type="button"
              @pointerdown=${(event) => this._startHandleDrag('hardness', event)}
              style="left: ${hardness}%"
              title="Core Plateau Hardness: ${hardness}% (Drag to adjust solid core hold)"
              class="absolute -translate-x-1/2 top-0 group focus:outline-none cursor-ew-resize z-20"
            >
              <div class="px-1.5 py-0.5 rounded bg-slate-800 text-white text-[9px] font-mono shadow flex items-center gap-0.5 group-hover:bg-indigo-600 transition-colors">
                <span>Core</span>
                <span>${hardness}%</span>
              </div>
            </button>

            <button
              type="button"
              @pointerdown=${(event) => this._startHandleDrag('midpoint', event)}
              style="left: ${midpointPercent}%"
              title="Boundary Midpoint Speed Hint: ${midpointLabel}%"
              class="absolute -translate-x-1/2 top-0.5 group focus:outline-none cursor-ew-resize z-20"
            >
              <div class="w-3.5 h-3.5 rotate-45 rounded-[2px] bg-white border-2 border-indigo-600 shadow-sm group-hover:scale-125 transition-transform"></div>
              <span class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap">
                Midpoint ${midpointLabel}%
              </span>
            </button>
          </div>

          <div class="control-radial-bar relative h-8 w-full rounded-lg alpha-checkerboard border border-slate-300 shadow-inner overflow-hidden">
            <div class="w-full h-full" style="background: ${trackBackground}"></div>
            <div
              style="left: ${hardness}%"
              class="absolute top-0 bottom-0 border-l-2 border-dashed border-white/80 pointer-events-none"
            ></div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] font-mono text-slate-500 mt-1.5">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full border border-black/15" style="background:${this.control.color}"></span>
              <span>0% Center (${this.control.x}%, ${this.control.y}%)</span>
            </span>
            <span class="text-indigo-600 font-medium">
              ◆ Midpoint ${midpointLabel}%
            </span>
            <span class="flex items-center gap-1.5">
              <span>100% Boundary Edge (Reach ${this.control.radius}%)</span>
              <span class="w-2.5 h-2.5 rounded-full border border-slate-300 alpha-checkerboard"></span>
            </span>
          </div>
        </div>
    `;
  }

  _renderNeighborBridge(neighbor) {
    const bridgeBackground = buildBridgePreviewBackground(this.control, neighbor, this.globals);
    return html`
          <div class="rounded-lg bg-slate-50 border border-slate-200 p-2.5 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
            <div class="flex items-center gap-2 text-xs min-w-0">
              <i class="ph-duotone ph-intersect-three text-indigo-600 text-base shrink-0"></i>
              <div class="min-w-0">
                <span class="font-semibold text-slate-700">Boundary Zone with Nearest Control:</span>
                <span class="font-mono text-indigo-700 ml-1">${neighbor.name}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 w-full xl:w-56 shrink-0">
              <span class="w-3.5 h-3.5 rounded-full shrink-0 border border-black/15" style="background:${this.control.color}"></span>
              <div class="h-4 flex-1 rounded-md border border-slate-300 shadow-inner" style="background: ${bridgeBackground}"></div>
              <span class="w-3.5 h-3.5 rounded-full shrink-0 border border-black/15" style="background:${neighbor.color}"></span>
            </div>
          </div>
    `;
  }
}
customElements.define('control-gradient-track', ControlGradientTrack);
