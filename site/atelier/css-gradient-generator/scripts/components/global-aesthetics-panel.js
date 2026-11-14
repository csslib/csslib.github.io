// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, nothing } from 'lit';
import { OpenStudioElement } from './open-studio-element.js';
import { BASE_WASH, DEFAULT_COLOR_SPACE, DEFAULT_GRAIN_OPACITY, DEFAULT_HUE_MODE, PERCENT } from '../config/constants.js';
import { renderPanelSection } from '../ui/panel-parts.js';

const BASE_COLOR_PICKER_FALLBACK = '#0B1120';

class GlobalAestheticsPanel extends OpenStudioElement {
  static properties = {
    globals: { type: Object },
    noise: { type: Object }
  };

  _updateGlobals(patch) {
    this._emit('globals-update', { patch });
  }

  _updateNoise(patch) {
    this._emit('noise-update', { patch });
  }

  render() {
    const globals = this.globals || {};
    return html`
      ${renderPanelSection({
        icon: 'ph-sliders-horizontal',
        title: 'Global Canvas & Aesthetic Enhancers',
        trailing: this._renderResetGradingButton(),
        body: html`
          ${this._renderInterpolationSelectors(globals)}
          ${this._renderBaseCanvasControls(globals)}
          ${this._renderGradingSliders(globals)}
          ${this._renderEnhancerControls(globals)}
        `
      })}
    `;
  }

  _renderResetGradingButton() {
    return html`
        <button
          type="button"
          @click=${() => this._updateGlobals({ hueShift: 0, lightnessOffset: 0, chromaBoost: 1, reachScale: 1 })}
          class="shrink-0 whitespace-nowrap text-[10px] font-mono text-indigo-600 hover:underline"
        >
          Reset Grading
        </button>
    `;
  }

  _renderInterpolationSelectors(globals) {
    return html`
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] font-medium text-slate-500 mb-1">Global Color Space</label>
            <select
              .value=${globals.colorSpace || DEFAULT_COLOR_SPACE}
              @change=${(event) => this._updateGlobals({ colorSpace: event.target.value })}
              class="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800"
            >
              <option value="oklch">OKLCH (Perceptual)</option>
              <option value="oklab">Oklab (Uniform Lab)</option>
              <option value="linear-rgb">Linear sRGB</option>
              <option value="srgb">Legacy sRGB</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-medium text-slate-500 mb-1">Hue Trajectory</label>
            <select
              .value=${globals.hueMode || DEFAULT_HUE_MODE}
              @change=${(event) => this._updateGlobals({ hueMode: event.target.value })}
              class="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800"
            >
              <option value="shorter">shorter arc</option>
              <option value="longer">longer rainbow arc</option>
              <option value="increasing">increasing (CW)</option>
              <option value="decreasing">decreasing (CCW)</option>
            </select>
          </div>
        </div>
    `;
  }

  _renderBaseCanvasControls(globals) {
    const isWashEnabled = globals.baseGradientEnabled !== false;
    return html`
        <div class="space-y-2 pt-2 border-t border-slate-100">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold text-slate-700">Base Canvas Atmosphere</span>
            <label class="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                .checked=${isWashEnabled}
                @change=${(event) => this._updateGlobals({ baseGradientEnabled: event.target.checked })}
                class="rounded text-indigo-600"
              />
              <span>Dual-Tone Wash</span>
            </label>
          </div>

          <div class="grid grid-cols-12 gap-2 items-center">
            <div class="col-span-4 flex items-center gap-1.5">
              <input
                type="color"
                .value=${globals.baseColor || BASE_COLOR_PICKER_FALLBACK}
                @input=${(event) => this._updateGlobals({ baseColor: event.target.value.toUpperCase() })}
                class="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 shrink-0"
              />
              <span class="text-[10px] font-mono text-slate-600 truncate">${globals.baseColor || BASE_COLOR_PICKER_FALLBACK}</span>
            </div>

            ${isWashEnabled ? html`
              <div class="col-span-4 flex items-center gap-1.5">
                <input
                  type="color"
                  .value=${globals.baseSecondaryColor || BASE_WASH.defaultSecondary}
                  @input=${(event) => this._updateGlobals({ baseSecondaryColor: event.target.value.toUpperCase() })}
                  class="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 shrink-0"
                />
                <span class="text-[10px] font-mono text-slate-600 truncate">${globals.baseSecondaryColor || BASE_WASH.defaultSecondary}</span>
              </div>
              <div class="col-span-4 flex items-center gap-1">
                <span class="text-[10px] font-mono text-slate-400">∠</span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  .value=${String(globals.baseAngle ?? BASE_WASH.defaultAngle)}
                  @input=${(event) => this._updateGlobals({ baseAngle: Number(event.target.value) })}
                  class="studio-slider w-full"
                />
              </div>
            ` : nothing}
          </div>
        </div>
    `;
  }

  _renderGradingSliders(globals) {
    return html`
        <div class="space-y-2.5 pt-2 border-t border-slate-100">
          <div class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-slate-600">Global Hue Shift (All Controls)</span>
              <span class="font-mono text-slate-800">${globals.hueShift > 0 ? `+${globals.hueShift}` : (globals.hueShift || 0)}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              .value=${String(globals.hueShift || 0)}
              @input=${(event) => this._updateGlobals({ hueShift: Number(event.target.value) })}
              class="studio-slider w-full"
            />
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div class="space-y-1">
              <div class="flex justify-between text-[11px]">
                <span class="text-slate-600">Chroma Vibrance</span>
                <span class="font-mono text-slate-800">${Math.round((globals.chromaBoost ?? 1) * PERCENT)}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.6"
                step="0.05"
                .value=${String(globals.chromaBoost ?? 1)}
                @input=${(event) => this._updateGlobals({ chromaBoost: Number(event.target.value) })}
                class="studio-slider w-full"
              />
            </div>

            <div class="space-y-1">
              <div class="flex justify-between text-[11px]">
                <span class="text-slate-600">Boundary Reach</span>
                <span class="font-mono text-slate-800">${Math.round((globals.reachScale ?? 1) * PERCENT)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.7"
                step="0.05"
                .value=${String(globals.reachScale ?? 1)}
                @input=${(event) => this._updateGlobals({ reachScale: Number(event.target.value) })}
                class="studio-slider w-full"
              />
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-slate-600">Global Lightness Offset</span>
              <span class="font-mono text-slate-800">${(globals.lightnessOffset || 0) > 0 ? `+${globals.lightnessOffset}` : (globals.lightnessOffset || 0)}%</span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="1"
              .value=${String(globals.lightnessOffset || 0)}
              @input=${(event) => this._updateGlobals({ lightnessOffset: Number(event.target.value) })}
              class="studio-slider w-full"
            />
          </div>
        </div>
    `;
  }

  _renderEnhancerControls(globals) {
    return html`
        <div class="space-y-2.5 pt-2 border-t border-slate-100">
          <div class="grid grid-cols-2 gap-2.5">
            <div class="space-y-1">
              <div class="flex justify-between text-[11px]">
                <span class="text-slate-600" title="Soft wide radial ambient light bloom">Ambient Glow</span>
                <span class="font-mono text-slate-800">${Math.round((globals.sheenIntensity || 0) * PERCENT)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.45"
                step="0.02"
                .value=${String(globals.sheenIntensity || 0)}
                @input=${(event) => this._updateGlobals({ sheenIntensity: Number(event.target.value) })}
                class="studio-slider w-full"
              />
            </div>

            <div class="space-y-1">
              <div class="flex justify-between text-[11px]">
                <span class="text-slate-600">Edge Vignette</span>
                <span class="font-mono text-slate-800">${Math.round((globals.vignetteIntensity || 0) * PERCENT)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.65"
                step="0.02"
                .value=${String(globals.vignetteIntensity || 0)}
                @input=${(event) => this._updateGlobals({ vignetteIntensity: Number(event.target.value) })}
                class="studio-slider w-full"
              />
            </div>
          </div>

          ${this._renderGrainControls()}
        </div>
    `;
  }

  _renderGrainControls() {
    const isGrainEnabled = Boolean(this.noise?.enabled);
    return html`
          <div class="pt-1 flex items-center justify-between gap-2">
            <label class="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                .checked=${isGrainEnabled}
                @change=${(event) => this._updateNoise({ enabled: event.target.checked })}
                class="rounded text-indigo-600"
              />
              <span>Analog Anti-Banding Grain</span>
            </label>
            ${isGrainEnabled ? html`
              <div class="flex items-center gap-2 w-36">
                <input
                  type="range"
                  min="0.02"
                  max="0.35"
                  step="0.01"
                  .value=${String(this.noise.opacity || DEFAULT_GRAIN_OPACITY)}
                  @input=${(event) => this._updateNoise({ opacity: Number(event.target.value) })}
                  class="studio-slider w-full"
                />
                <span class="text-[10px] font-mono text-slate-600 w-8 text-right">
                  ${Math.round((this.noise.opacity || DEFAULT_GRAIN_OPACITY) * PERCENT)}%
                </span>
              </div>
            ` : nothing}
          </div>
    `;
  }
}
customElements.define('global-aesthetics-panel', GlobalAestheticsPanel);
