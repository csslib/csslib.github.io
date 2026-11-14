// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, nothing } from 'lit';
import { GradientFieldCompiler } from '../compiler/gradient-field-compiler.js';
import { OpenStudioElement } from './open-studio-element.js';
import { FIELD_PROFILE, PANEL_HEADER_CLASS } from '../config/constants.js';
import { buildFieldProfilePoints } from '../curves/curve-paths.js';
import { CONTROL_DEFAULTS } from '../data/field-options.js';
import { copyTextToClipboard, formatCopyableDeclarations, formatPreviewRuleset } from '../export/css-formatters.js';

const PREVIEW_COPY_FEEDBACK_MS = 1800;

class LiveCssPreviewBar extends OpenStudioElement {
  static properties = {
    controls: { type: Array },
    selectedControl: { type: Object },
    globals: { type: Object },
    isCssExpanded: { type: Boolean, state: true },
    isCopied: { type: Boolean, state: true }
  };

  constructor() {
    super();
    this.isCssExpanded = true;
    this.isCopied = false;
  }

  _compileScene() {
    return GradientFieldCompiler.compileScene(this.controls || [], this.globals || {}, { isNaiveSrgb: false });
  }

  _copyCss() {
    copyTextToClipboard(formatCopyableDeclarations(this._compileScene()));
    this.isCopied = true;
    setTimeout(() => { this.isCopied = false; }, PREVIEW_COPY_FEEDBACK_MS);
    this._emit('css-copied');
  }

  render() {
    const compiledScene = this._compileScene();
    const profiledControl = this.selectedControl || (this.controls && this.controls[0]);

    return html`
      <section class="border-b border-slate-200">
        ${this._renderHeader(compiledScene)}
        ${this.isCssExpanded ? this._renderExpandedBody(compiledScene, profiledControl) : nothing}
      </section>
    `;
  }

  _renderHeader(compiledScene) {
    return html`
        <div class="${PANEL_HEADER_CLASS} flex-wrap">
          <div class="flex items-center gap-1.5 min-w-0">
            <i class="ph-duotone ph-code text-indigo-600 text-sm shrink-0"></i>
            <div class="min-w-0">
              <h3 class="text-[11px] leading-snug font-semibold uppercase tracking-wider text-slate-700">
                Live Combined CSS Output & Perceptual Telemetry
              </h3>
              <p class="text-[10px] text-slate-500 truncate">
                Single-layer multi-field compilation (${compiledScene.backgroundImages.length} synthesized CSS gradient fields)
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              @click=${() => { this.isCssExpanded = !this.isCssExpanded; }}
              class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
            >
              <i class="ph-bold ${this.isCssExpanded ? 'ph-caret-up' : 'ph-caret-down'}"></i>
              <span>${this.isCssExpanded ? 'Compact View' : 'Expand CSS'}</span>
            </button>

            <button
              type="button"
              @click=${this._copyCss}
              class="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-all"
            >
              <i class="ph-bold ${this.isCopied ? 'ph-check' : 'ph-copy'}"></i>
              <span>${this.isCopied ? 'Copied CSS!' : 'Copy Combined CSS'}</span>
            </button>
          </div>
        </div>
    `;
  }

  _renderExpandedBody(compiledScene, profiledControl) {
    return html`
          <div class="p-3 grid grid-cols-1 2xl:grid-cols-12 gap-3 items-stretch">
            <div class="2xl:col-span-8 relative min-w-0">
              <pre class="bg-slate-900 text-slate-100 font-mono text-[11px] p-3 rounded-lg overflow-x-auto max-h-44 leading-relaxed select-all border border-slate-800">${formatPreviewRuleset(compiledScene)}</pre>
            </div>

            ${this._renderFieldProfile(profiledControl)}
          </div>
    `;
  }

  _renderFieldProfile(profiledControl) {
    const { width, height } = FIELD_PROFILE;
    const { lightnessPoints, chromaPoints } = buildFieldProfilePoints(profiledControl, {
      allControls: this.controls,
      globals: this.globals,
      isNaiveSrgb: false
    });

    return html`
            <div class="2xl:col-span-4 min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3 flex flex-col justify-between">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-semibold text-slate-700 truncate">
                  Field Profile: ${profiledControl?.name || 'Active Control'}
                </span>
                <span class="shrink-0 text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  Core → Boundary
                </span>
              </div>

              <svg viewBox="0 0 ${width} ${height}" class="w-full h-14 my-1 overflow-visible">
                <line x1="0" y1=${height / 2} x2=${width} y2=${height / 2} stroke="#E2E8F0" stroke-dasharray="2 2" stroke-width="1" />
                <polyline fill="none" stroke="#EC4899" stroke-width="1.6" points=${chromaPoints} />
                <polyline fill="none" stroke="#c0249c" stroke-width="2.2" points=${lightnessPoints} />
              </svg>

              <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/70">
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>OKLCH L
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-pink-500 inline-block"></span>Chroma C
                </span>
                <span>r: ${profiledControl?.radius ?? CONTROL_DEFAULTS.radius}%</span>
              </div>
            </div>
    `;
  }
}
customElements.define('live-css-preview-bar', LiveCssPreviewBar);
